/*
 * Package: results_table_by_class_conf.js
 * 
 * Namespace: bbop.widget.display.results_table_by_class_conf
 * 
 * Subclass of <bbop.html.tag>.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'html');
bbop.core.namespace('bbop', 'widget', 'display', 'results_table_by_class_conf');

/*
 * Function: results_table_by_class_conf
 *
 * Using a conf class and a set of data, automatically populate and
 * return a results table.
 *  
 * Parameters:
 *  class_conf - a <bbop.golr.conf_class>
 *  golr_resp - a <bbop.golr.response>
 *  linker - a linker object; see <amigo.linker> for more details
 *  elt_id - the element id to attach it to
 *
 * Returns:
 *  <bbop.html.table> filled with results
 */
bbop.widget.display.results_table_by_class = function(cclass,
						      golr_resp,
						      linker,
						      elt_id){
    //bbop.html.tag.call(this, 'div');
    //var amigo = new bbop.amigo();

    // Temp logger.
    var logger = new bbop.logger();
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch('TT: ' + str); }

    // Conveience aliases.
    var each = bbop.core.each;
    var is_defined = bbop.core.is_defined;

    // Only want to compile once.
    var ea_regexp = new RegExp("\<\/a\>", "i"); // detect an <a>
    var br_regexp = new RegExp("\<br\ \/\>", "i"); // detect a <br />

    // Now take what we have, and wrap around some expansion code
    // if it looks like it is too long.
    var trim_hash = {};
    var trimit = 100;
    function _trim_and_store( in_str ){

	var retval = in_str;

	//ll("T&S: " + in_str);

	// Skip if it is too short.
	//if( ! ea_regexp.test(retval) && retval.length > (trimit + 50) ){
	if( retval.length > (trimit + 50) ){
	    //ll("T&S: too long: " + retval);

	    // Let there be tests.
	    var list_p = br_regexp.test(retval);
	    var anchors_p = ea_regexp.test(retval);

	    var tease = null;
	    if( ! anchors_p && ! list_p ){
		// A normal string then...trim it!
		//ll("\tT&S: easy normal text, go nuts!");
		tease = new bbop.html.span(bbop.core.crop(retval, trimit, ''),
					   {'generate_id': true});
	    }else if( anchors_p && ! list_p ){
		// It looks like it is a link without a break, so not
		// a list. We cannot trim this safely.
		//ll("\tT&S: single link so cannot work on!");
	    }else{
		//ll("\tT&S: we have a list to deal with");
		
		var new_str_list = retval.split(br_regexp);
		if( new_str_list.length <= 3 ){
		    // Let's just ignore lists that are only three
		    // items.
		    //ll("\tT&S: pass thru list length <= 3");
		}else{
		    //ll("\tT&S: contruct into 2 plus tag");
		    var new_str = '';
		    new_str = new_str + new_str_list.shift();
		    new_str = new_str + '<br />';
		    new_str = new_str + new_str_list.shift();
		    tease = new bbop.html.span(new_str, {'generate_id': true});
		}
	    }

	    // If we have a tease, assemble the rest of the packet
	    // to create the UI.
	    if( tease ){
		//ll("T&S: tease: " + tease.to_string());
		
		// Setup the text for tease and full versions.
		// var more_b = new bbop.html.span('<b>[more...]</b>',
		// 				{'generate_id': true});
		// var full = new bbop.html.span(retval,
		// 			      {'generate_id': true});
		// var less_b = new bbop.html.span('<b>[less]</b>',
		// 				{'generate_id': true});
		var bgen = bbop.widget.display.text_button_sim;
		var more_b = new bgen('more...', 'Display the complete list');
		var full = new bbop.html.span(retval,
					      {'generate_id': true});
		var less_b = new bgen('less', 'Display the truncated list');
		
		// Store the different parts for later activation.
		var tease_id = tease.get_id();
		var more_b_id = more_b.get_id();
		var full_id = full.get_id();
		var less_b_id = less_b.get_id();
		trim_hash[tease_id] = 
		    [tease_id, more_b_id, full_id, less_b_id];
		
		// New final string.
		retval = tease.to_string() + " " +
		    more_b.to_string() + " " +
		    full.to_string() + " " +
		    less_b.to_string();
	    }
	}

	return retval;
    }

    // Start with score, and add the others by order of the class
    // results_weights field.
    // var headers = ['score'];
    // var headers_display = ['Score'];
    var headers = [];
    var headers_display = [];
    var results_order = cclass.field_order_by_weight('result');
    each(results_order,
	 function(fid){
	     // Store the raw headers/fid for future use.
	     headers.push(fid);
	     // Get the headers into a presentable state.
	     var field = cclass.get_field(fid);
	     if( ! field ){ throw new Error('conf error: not found:' + fid); }
	     //headers_display.push(field.display_name());
	     var fdname = field.display_name();
	     var fdesc = field.description() || '???';
	     var head_span_attrs = {
		 // TODO/NOTE: to make the tooltip work properly, since the
		 // table headers are being created each time,
		 // the tooltop initiator would have to be called after
		 // each pass...I don't know that I want to do that.
		 //'class': 'bbop-js-ui-hoverable bbop-js-ui-tooltip',
		 'class': 'bbop-js-ui-hoverable',
		 'title': fdesc
	     };
	     // More aggressive link version.
	     //var head_span = new bbop.html.anchor(fdname, head_span_attrs);
	     var head_span = new bbop.html.span(fdname, head_span_attrs);
	     headers_display.push(head_span.to_string());
	 });

    // Some of what we'll do for each field in each doc (see below).
    // var ext = cclass.searchable_extension();
    var handler = new bbop.handler(); // may use a special handler
    function _process_entry(fid, iid, doc){

	var retval = '';
	var did = doc['id'];

	// BUG/TODO: First see if the filed will be multi or not.
	// If not multi, follow the first path. If multi, break it
	// down and try again.

	// Get a label instead if we can.
	var ilabel = golr_resp.get_doc_label(did, fid, iid);
	if( ! ilabel ){
	    ilabel = iid;
	}

	// Extract highlighting if we can from whatever our "label"
	// was.
	var hl = golr_resp.get_doc_highlight(did, fid, ilabel);

	// See what kind of link we can create from what we got.
	var ilink = linker.anchor({id: iid, label: ilabel, hilite: hl}, fid);
	
	ll('processing: ' + [fid, ilabel, iid].join(', '));
	//ll('ilink: ' + ilink);

	// See what we got, in order of how much we'd like to have it.
	if( ilink ){
	    retval = ilink;
	}else if( ilabel ){
	    retval = ilabel;
	}else{
	    retval = iid;
	}

	return retval;
    }

    // Cycle through and render each document.
    // For each doc, deal with it as best we can using a little
    // probing. Score is a special case as it is not an explicit
    // field.
    var table_buff = [];
    var docs = golr_resp.documents();
    each(docs,
	 function(doc){
	     
	     // Well, they had better be in here, so we're
	     // just gunna cycle through all the headers/fids.
	     var entry_buff = [];
	     each(headers,
		  function(fid){
		      // Remember: score is a special--non-explicit--case.
		      if( fid == 'score' ){
			  var score = doc['score'] || 0.0;
			  score = bbop.core.to_string(100.0 * score);
			  entry_buff.push(bbop.core.crop(score, 4) + '%');
		      }else{

			  // Not "score", so let's figure out what we
			  // can automatically.
			  var field = cclass.get_field(fid);

			  // Make sure that something is there and
			  // that we can iterate over whatever it
			  // is.
			  var bits = [];
			  if( doc[fid] ){
			      if( field.is_multi() ){
				  //ll("Is multi: " + fid);
				  bits = doc[fid];
			      }else{
				  //ll("Is single: " + fid);
				  bits = [doc[fid]];
			      }
			  }

			  // Render each of the bits.
			  var tmp_buff = [];
			  each(bits,
			       function(bit){

				   // The major difference that we'll have here
				   // is between standard fields and special
				   // hander fields, as defined by
				   // _handler.
				   var out = null;
				   if( field.has_handler() ){

				       // Special handler output.
				       var objo = null;
				       var reso = null;
				       try{
					   objo = bbop.json.parse(bit);
				           reso = handler.dispatch(objo);
				       }catch (x){
					   ll("handler failed to resolve: " +
					      bit);
				       }

				       if( reso && reso.success ){
					   out = reso.results;
					   tmp_buff.push(out);
				       }else{
					   // Something noticable on
					   // failure...let's just push
					   // the original blob for
					   // now. Likely an upstream
					   // problem.
					   tmp_buff.push(bit + " (?)");
				       }
				   }else{
				       // Standard output.   
				       out = _process_entry(fid, bit, doc);
				       //ll('out: ' + out);
				       tmp_buff.push(out);
				   }
			       });
			  // Join it, trim/store it, push to to output.
			  var joined = tmp_buff.join('<br />');
			  entry_buff.push(_trim_and_store(joined));
		      }
		  });
	     table_buff.push(entry_buff);
	 });
	
	// Add the table to the DOM.
	var final_table = new bbop.html.table(headers_display, table_buff);
	jQuery('#' + elt_id).append(bbop.core.to_string(final_table));

	// Add the roll-up/down events to the doc.
	each(trim_hash,
	    function(key, val){
		var tease_id = val[0];
		var more_b_id = val[1];
		var full_id = val[2];
		var less_b_id = val[3];

		// Initial state.
		jQuery('#' + full_id ).hide();
		jQuery('#' + less_b_id ).hide();

		// Click actions to go back and forth.
		jQuery('#' + more_b_id ).click(
		    function(){
			jQuery('#' + tease_id ).hide();
			jQuery('#' + more_b_id ).hide();
			jQuery('#' + full_id ).show('fast');
			jQuery('#' + less_b_id ).show('fast');
		    });
		jQuery('#' + less_b_id ).click(
		    function(){
			jQuery('#' + full_id ).hide();
			jQuery('#' + less_b_id ).hide();
			jQuery('#' + tease_id ).show('fast');
			jQuery('#' + more_b_id ).show('fast');
		    });
	    });

	return final_table;
};
bbop.widget.display.results_table_by_class.prototype = new bbop.html.tag;
