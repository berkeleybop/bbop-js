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
// BUG: bbop.core.chomp does not exist in min? Still percolating?
eval(readUrl('https://s3.amazonaws.com/bbop/jsapi/bbop.min.js'));
//eval(readUrl('http://cdn.berkeleybop.org/jsapi/bbop_0.9.min.js'));
eval(readUrl('http://cdn.berkeleybop.org/jsapi/amigo_0.9.min.js'));
//eval(readUrl('http://cdn.berkeleybop.org/jsapi/bbop_0.9.js'));
//eval(readUrl('http://cdn.berkeleybop.org/jsapi/amigo_0.9.js'));

// Aliases.
var each = bbop.core.each;
var chomp = bbop.core.chomp;
var splode = bbop.core.splode;
var is_defined = bbop.core.is_defined;

// Helper.
function err (str){
    print('ERROR: ' + str);
    java.lang.System.exit(1);    
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
var simple_checks = {};
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
	     simple_checks[arg1 + '^' + arg2] = [arg1, arg2];
	 }else{
	     // Parse logic.
	     var parsed_logic = splode(logic, ' OR ');
	     var or_log_bun = [arg1, arg2, parsed_logic];
	     //print('TODO: Logic check: ' + bbop.core.dump(or_log_bun));
	     logic_checks[arg1 + '^' + arg2 + '_' + logic] = or_log_bun;
	 }
     });

// Next, setup the manager environment.
print('Setting up manager.');
var gconf = new bbop.golr.conf(amigo.data.golr);
var go = new bbop.golr.manager.rhino('http://golr.berkeleybop.org/', gconf);
go.add_query_filter('document_category', 'annotation', ['*']);
go.set_personality('bbop_ann');
go.debug(false); // I think the default is still on?

// First, we cycle though all the simple exclusivity tests.
print('Running simple checks...');
each(simple_checks,
     function(key, arg_list){

	 // Set the next query.
	 go.reset_query_filters(); // reset from the last iteration
	 // Add all of the items in the simple 
	 each(arg_list,
	      function(arg){
		  go.add_query_filter('isa_partof_closure', arg);
	      });

	 // Fetch the data and grab the number we want.
	 var resp = new bbop.golr.response(go.fetch());
	 var count = resp.total_documents();

	 print('Checked exclusive: '+ arg_list.join(' & ') +' ('+ count +')');
	 if( count != 0 ){
	     check_errors.push('ERROR: count of ' + count + ' on: ' + key);
	 }
     });

// // Now try the OR(?) logic tests.
// print('Running logic checks...');
// each(logic_checks,
//      function(key, arg_list){
	 
// 	 var arg1 = arg_list[0];
// 	 var arg2 = arg_list[1];
// 	 var or_list = arg_list[2];
	 
// 	 // Set the next query.
// 	 go.reset_query_filters(); // reset from the last iteration
	 
// 	 go.add_query_filter('isa_partof_closure', arg1);
// 	 go.add_query_filter('isa_partof_closure', arg2);

// 	 // Add all of the items in the simple 
// 	 each(or_list,
// 	      function(arg){
// 		  go.add_query_filter('isa_partof_closure', arg);
// 	      });

// 	 // Fetch the data and grab the number we want.
// 	 var resp = new bbop.golr.response(go.fetch());
// 	 var count = resp.total_documents();

// 	 print('Checked exclusive: '+ arg_list.join(' & ') +' ('+ count +')');
// 	 if( count != 0 ){
// 	     check_errors.push('ERROR: count of ' + count + ' on: ' + key);
// 	 }
//      });

// Report.
print('Looked at ' + file_lines.length + ' rules.');
if( check_errors ){
    each(check_errors,
	 function(error_str){
	     print('PROBLEM: ' + error_str);
	 });
    err('Completed with ' + check_errors.length + ' broken rules.');
}else{
    print('Done--completed with no broken rules.');
}
