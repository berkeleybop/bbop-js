/*
 * Package: results_table_by_class_conf.js
 * 
 * Namespace: bbop.widget.display.results_table_by_class_conf
 * 
 * Reusable HTML drop of Solr meta results.
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
 *
 * Returns:
 *  <bbop.html.table> filled with results
 */
bbop.widget.display.results_table_by_class = function(cclass,
							       golr_resp,
							       linker){
    //bbop.html.tag.call(this, 'div');
    //var amigo = new bbop.amigo();

    // // Temp logger.
    // var logger = new bbop.logger();
    // logger.DEBUG = true;
    // function ll(str){ logger.kvetch('TT: ' + str); }

    var each = bbop.core.each; // conveience

    // Start with score, and add the others by order of the class
    // results_weights field.
    var headers = ['score'];
    var headers_display = ['Score'];
    var results_order = cclass.field_order_by_weight('result');
    each(results_order,
	 function(fid){
	     // Store the raw headers/fid for future use.
	     headers.push(fid);
	     // Get the headers into a presentable state.
	     var field = cclass.get_field(fid);
	     if( ! field ){ throw new Error('conf error: not found:' + fid); }
	     headers_display.push(field.display_name());
	 });

    // Some of what we'll do for each field in each doc (see below).
    var ext = cclass.searchable_extension();
    function _process_entry(fid, iid, doc){

	var retval = '';
	var did = doc['id'];

	// Get a label instead if we can.
	var ilabel = golr_resp.get_doc_field(did, fid + '_label');
	if( ! ilabel ){
	    ilabel = golr_resp.get_doc_field(did, fid);
	}

	// Extract highlighting if we can.
	var hl = golr_resp.get_doc_field_hl(did, fid + '_label' + ext);
	if( ! hl ){
	    hl = golr_resp.get_doc_field_hl(did, fid + ext);
	}
	if( ! hl ){
	    hl = golr_resp.get_doc_field_hl(did, fid);
	}

	// See what we can create from what we got.
	var ilink = linker.anchor({id: iid, label: ilabel, hilite: hl}, fid);
	
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

			  // Make sure that comething is there and
			  // that we can iterate over whatever it
			  // is.
			  var bits = [];
			  if( doc[fid] ){
			      if( field.is_multi() ){
				  bits = doc[fid];
			      }else{
				  bits = [doc[fid]];
			      }
			  }

			  // Render each of the bits.
			  var tmp_buff = [];
			  each(bits,
			       function(bit){
				   var out = _process_entry(fid, bit, doc);
				   //ll('out: ' + out);
				   tmp_buff.push(out);
			       });
			  entry_buff.push(tmp_buff.join(' '));
		      }
		  });
	     table_buff.push(entry_buff);
	 });
    
    return new bbop.html.table(headers_display, table_buff);
};
bbop.widget.display.results_table_by_class.prototype = new bbop.html.tag;
