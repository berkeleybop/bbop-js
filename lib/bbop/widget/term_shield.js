/*
 * Package: term_shield.js
 * 
 * Namespace: bbop.widget.term_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing term
 * information shield.
 * 
 * This is a completely self-contained UI and manager.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: term_shield
 * 
 * Contructor for the bbop.widget.term_shield object.
 * 
 * This is (sometimes) a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * To actually do much useful, you should set the personality of the
 * widget.
 * 
 * The optional hash arguments look like:
 * 
 *  linker - a "linker" object
 *  width - defaults to 700
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server; not needed if local
 *  golr_conf_obj - a <bbop.golr.conf> object
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  self
 */
bbop.widget.term_shield = function(golr_loc, golr_conf_obj, in_argument_hash){
    
    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.term_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (term_shield): ' + str); }

    // Our argument default hash.
    var default_hash = {
	'linker_function': function(){},
	'width': 700
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    var width = arg_hash['width'];
    var linker = arg_hash['linker_function'];

    // Draw a locally help Solr response doc.
    function _draw_local_doc(doc){
	
	//ll(doc['id']);

	var personality = anchor.get_personality();
	var cclass = golr_conf_obj.get_class(personality);

	var txt = 'Nothing here...';
	if( doc && cclass ){

	    var tbl = new bbop.html.table();
	    var results_order = cclass.field_order_by_weight('result');
	    var each = bbop.core.each; // convenience
	    each(results_order,
		 function(fid){
		     // 
		     var field = cclass.get_field(fid);
		     var val = doc[fid];

		     // Determine if we have a list that we're working
		     // with or not.
		     if( field.is_multi() ){

			 if( val ){
			     val = val.join(', ');
			 }else{
			     val = 'n/a';
			 }

		     }else{

			 // When handling just the single value, see
			 // if we can link out the value.
			 var link = null;
			 if( val ){
			     //link = linker.anchor({id: val});
			     //link = linker.anchor({id: val}, 'term');
			     link = linker.anchor({id: val}, fid);
			     if( link ){ val = link; }
			 }else{
			     val = 'n/a';
			 }
		     }

		     tbl.add_to([field.display_name(), val]);
		 });
	    txt = tbl.to_string();
	}

	// Create div.
	var div = new bbop.html.tag('div', {'generate_id': true});
	var div_id = div.get_id();

	// Append div to body.
	jQuery('body').append(div.to_string());

	// Add text to div.
	jQuery('#' + div_id).append(txt);

	// Modal dialogify div; include self-destruct.
	var diargs = {
	    modal: true,
	    draggable: false,
	    width: width,
	    close:
	    function(){
		// TODO: Could maybe use .dialog('destroy') instead?
		jQuery('#' + div_id).remove();
	    }	    
	};
	var dia = jQuery('#' + div_id).dialog(diargs);
    }

    // Get a doc by id from a remote server then display it when it
    // gets local.
    // TODO: spinner?
    function _draw_remote_id(id_string){
	function _process_resp(resp){
	    var doc = resp.get_doc(0);
	    _draw_local_doc(doc);
	}
	anchor.register('search', 'do', _process_resp);
	anchor.set_id(id_string);
	//ll('FOO: ' + id_string);
	anchor.search();
    }

    /*
     * Function: draw
     * 
     * Render a temporary modal information shield. 
     * 
     * Arguments:
     *  item - either a document id or a Solr-returned document
     * 
     * Returns:
     *  n/a
     */
    this.draw = function(item){
    // Call the render directly if we already have a document,
    // otherwise, if it seems like a string (potential id), do a
    // callback on it and pull the doc out.
	if( bbop.core.what_is(item) == 'string' ){
	    _draw_remote_id(item);
	}else{
	    _draw_local_doc(item);
	}
    };
    
};
bbop.core.extend(bbop.widget.term_shield, bbop.golr.manager.jquery);
