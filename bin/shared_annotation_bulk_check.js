#!/usr/bin/rhino
/* 
 * Package: shared_annotation_bulk_check.js
 * 
 * This is a Rhino script.
 * 
 * Determine is the rules in the rules file are true. Complain if not.
 * 
 * Usage like:
 * : shared_annotation_bulk_check.js ../_data/shared_annotation_check_rules.txt
 */

// Load the necessary remote files.
print('Downloading libraries...');
// // BUG: bbop.core.chomp does not exist in min? Still percolating through CDN?
eval(readUrl('https://s3.amazonaws.com/bbop/jsapi/bbop.min.js'));
//eval(readUrl('http://cdn.berkeleybop.org/jsapi/bbop_0.9.min.js'));
eval(readUrl('http://cdn.berkeleybop.org/jsapi/amigo_0.9.min.js'));

// Aliases.
var each = bbop.core.each;
var chomp = bbop.core.chomp;
var splode = bbop.core.splode;
var is_defined = bbop.core.is_defined;
var ensure = bbop.core.ensure;

// Helper.
function err (str){
    print('!: ' + str);
    java.lang.System.exit(1);    
}

// Helper to bookmark into A2
var linker = new amigo.linker();
var sdata = new amigo.data.server();
function _link_to_a2(bookmark){

    var retl =
	// BUG/TODO:
	//sdata.app_base() + '/' + 
	//'http://amigo2.berkeleybop.org/cgi-bin/amigo2' + '/' + 
	linker.url(encodeURIComponent(bookmark), 'search');

    // Seems to be something wonky in the local config we're pulling
    // from.
    retl = retl.replace('localhost', 'amigo2.berkeleybop.org');

    return retl;
}


// First, see if we have our input file.
var file_to_read = arguments[0];
if( ! is_defined(file_to_read) ){
    err('Could not find rules file.');
}else{
    print('Will use rules file: ' + file_to_read);
}

// Read in the rules files.
var file_str = readFile(file_to_read);
if( ! is_defined(file_str) ||
    bbop.core.what_is(file_str) != 'string' ){
    err('File could not be opened.');
}else{
    print('Read: ' + file_to_read);
}

// Our rule variables.
 // Looks like {idA : [arg1A, arg2A], ...}
var no_overlap_checks = {};
 // Looks like {idA : [arg1A, arg2A], ...}
var overlap_checks = {};
// Looks like {idA : [arg1A, arg2A, [or1A, or2A, ...]], ...}
var logic_checks = {};
var check_errors = [];

// Parse the rules file.
file_str = chomp(file_str);
var file_lines = splode(file_str, '\n');
each(file_lines,
     function(raw_line){
	 var line = chomp(raw_line);
	 var columns = splode(line, ',');

	 // Make sure that it is at least grossly a rule.
	 if( columns.length != 3 ){ err('Bad rule: ' + line); }

	 // Switch between NO_OVERLAP and logic modes.
	 var arg1 = columns[0];
	 var arg2 = columns[1];
	 var logic = columns[2];
	 if( logic == 'NO_OVERLAP' ){
	     // Simple check.
	     //print('Simple check: ' + arg1 + ', ' + arg2);
	     no_overlap_checks[arg1 + ';' + arg2] = [arg1, arg2];
	 }else{
	     // Parse logic.
	     var parsed_logic = splode(logic, ' OR ');
	     // Decide on simple overlap or group check.
	     if( parsed_logic.length == 1 ){
		 var arg3 = parsed_logic[0];
		 overlap_checks[arg1+';'+arg2+';'+arg3] = [arg1, arg2, arg3];
	     }else{
		 var or_log_bun = [arg1, arg2, parsed_logic];
		 //print('TODO: Logic check: ' + bbop.core.dump(or_log_bun));
		 logic_checks[arg1 + ';' + arg2 + ';' + logic] = or_log_bun;
	     }
	 }
     });

// Next, setup the manager environment.
print('Setting up manager.');
var gconf = new bbop.golr.conf(amigo.data.golr);
var go = new bbop.golr.manager.rhino('http://golr.berkeleybop.org/', gconf);
go.add_query_filter('document_category', 'annotation', ['*']);
//go.add_query_filter('taxon', 'NCBITaxon:4896', ['*']);
go.set_personality('bbop_ann');
go.debug(false); // I think the default is still on?

// Runs an n-way AND in the closure and returns the count and a
// bookmark to the data in question.
function run_n_way_and(arg_list){
    
    // Add all of the items in the simple 
    each(arg_list,
	 function(arg){
	     go.add_query_filter('isa_partof_closure', arg);
	 });

    // Fetch the data and grab the number we want.
    var resp = go.fetch();
    var count = resp.total_documents();
    var bookmark = go.get_state_url();

    // Reset from the last iteration.
    go.reset_query_filters();

    return [count, bookmark];
}

// First, we cycle though all the simple exclusivity tests.
print('Running simple exclusivity checks...');
each(no_overlap_checks,
     function(key, arg_list){
	 var run_results = run_n_way_and(arg_list);
	 var count = run_results[0];
	 var bookmark = run_results[1];
	 print('Checked exclusive: '+ arg_list.join(' && ') +' ('+ count +')');
	 if( count != 0 ){
	     check_errors.push('! : exclusive count of ' +
			       count + ' on: ' +
			       key + "\n\t" +
			       _link_to_a2(bookmark));
	 }
     });

// First, we cycle though all the simple exclusivity tests.
print('Running simple inclusivity checks...');
each(overlap_checks,
     function(key, arg_list){
	 var run_results = run_n_way_and(arg_list);
	 var count = run_results[0];
	 var bookmark = run_results[1];
	 print('Checked inclusive: '+ arg_list.join(' && ') +' ('+ count +')');
	 if( count == 0 ){
	     check_errors.push('! : inclusive count of ' +
			       count + ' on: ' +
			       key + "\n\t" +
			       _link_to_a2(bookmark));
	 }
     });

// Now try the OR(?) logic tests.
print('Running AND series logic checks...');
each(logic_checks,
     function(key, arg_list){
	 
	 var arg1 = arg_list[0];
	 var arg2 = arg_list[1];
	 var or_list = arg_list[2];

	 // print('To check (inclusive): ' + arg1 + ', ' + arg2  + '; ' +  
	 //       or_list.join(' && '));
	 
	 // First, see if there is any point in proceeding.
	 var run_results = run_n_way_and([arg1, arg2]);
	 var check_cnt = run_results[0];
	 if( check_cnt == 0 ){
	     
	     print('Checked logical; trivially passed with no base overlap: ' +
		   arg1 + ' && ' + arg2);

	 }else{

	     //print('Logic parse...');

	     // Umm...ugh--we're going to try some actual logic. This
	     // should be more built into the manager at some point.
	     var ors = new bbop.logic('OR');
	     each(or_list,
	     	  function(or_arg){
	     	      ors.add(ensure(or_arg, '"'));
	     	  });
	     //print('Logic parse: OR: ' + ors.to_string());
	     var ands = new bbop.logic('AND');
	     ands.add(ensure(arg1, '"'));
	     ands.add(ensure(arg2, '"'));
	     ands.add(ors);
	     var raw_logic = ands.to_string();
	     //print('Logic parsed to: ' + raw_logic);

	     // Corrected because rhino sucks.
	     var final_logic = raw_logic.replace('(', '%28', 'g');
	     final_logic = final_logic.replace(')', '%29', 'g');
	     final_logic = final_logic.replace('"', '%22', 'g');
	     final_logic = final_logic.replace(' ', '%20', 'g');

	     // Set the next query with our logic ball.
	     //go.add_query_filter('isa_partof_closure', final_logic);
	     go.set_extra('fq=isa_partof_closure:%28' + final_logic + '%29');

	     // Fetch the data and grab the info we want.
	     var resp = go.fetch();
	     var count = resp.total_documents();
	     var bookmark = go.get_state_url();

	     // Reset from the last iteration.
	     go.reset_query_filters();
	     go.remove_extra(); // have to remove this manually each time

	     // Test the count to make sure that there were annotations
	     // for at least one of the choices.
	     print('Checked inclusive: ' + arg1 + ' && ' + arg2  + ' && (' +  
	     	   or_list.join(' || ') + ') (' + count + ')');
	     if( count == 0 ){
	     	 check_errors.push('! : no co-annotations for: ' +
				   key + "\n\t" +
				   _link_to_a2(bookmark));
	     	 // }else{
	     	 //     check_errors.push('PASS: co-annotation for: ' + key);
	     }
	 }
     });

// Report.
print('Looked at ' + file_lines.length + ' rules.');
if( check_errors && check_errors.length > 0 ){
    each(check_errors,
	 function(error_str){
	     print('PROBLEM: ' + error_str);
	 });
    err('Completed with ' + check_errors.length + ' broken rules.');
}else{
    print('Done--completed with no broken rules.');
}

java.lang.System.exit(0);
