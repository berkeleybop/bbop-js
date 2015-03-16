/*
 * Package: search_box.js
 * 
 * Namespace: bbop.widget.search_box
 * 
 * BBOP object to draw various UI elements that have to do with
 * autocompletion.
 * 
 * This is a completely self-contained UI and manager.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: search_box
 * 
 * Contructor for the bbop.widget.search_box object.
 * 
 * This is a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * The function for the callback argument should either accept a
 * JSONized solr document representing the selected item or null
 * (nothing found).
 * 
 * While everything in the argument hash is technically optional,
 * there are probably some fields that you'll want to fill out to make
 * things work decently. The options for the argument hash are:
 * 
 *  fill_p - whether or not to fill the input with the val on select (default true)
 *  label_template - string template for dropdown, can use any document field
 *  value_template - string template for selected, can use any document field
 *  additional_results_class - class to add to the pop-up autocomplete ul tag when there are more results than are shown in the results
 *  minimum_length - wait for this many characters to start (default 3)
 *  list_select_callback - function takes a json solr doc on dropdown selection
 * 
 * To get a better idea on how to use the templates, see the demo page
 * at http://cdn.berkeleybop.org/jsapi/bbop-js/demo/index.html and
 * read the documentation for <bbop.template>.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 *  interface_id - string id of the element to build on
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.widget.search_box = function(golr_loc,
				  golr_conf_obj,
				  interface_id,
				  in_argument_hash){
    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.search_box';

    // Aliases.
    var anchor = this;
    var loop = bbop.core.each;
    
    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (auto): ' + str); }

    // Our argument default hash.
    var default_hash =
	{
	    'fill_p': true,
	    'label_template': '{{id}}',
	    'value_template': '{{id}}',
	    'additional_results_class': '',
	    'minimum_length': 3, // wait for three characters or more
	    'list_select_callback': function(){}
	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // There should be a string interface_id argument.
    this._interface_id = interface_id;
    this._fill_p = arg_hash['fill_p'];
    this._list_select_callback = arg_hash['list_select_callback'];
    var label_tt = new bbop.template(arg_hash['label_template']);
    var value_tt = new bbop.template(arg_hash['value_template']);
    var ar_class = arg_hash['additional_results_class'];
    var minlen = arg_hash['minimum_length'];
    // The document  return counts. Need  tri-state here since 0  is a
    // legit return.
    var result_count = null;
    var return_count = null;

    // The all-important argument hash. See:
    // http://jqueryui.com/demos/autocomplete/#method-widget
    var auto_args = {
	minLength: minlen,
	// Function for a successful data hit.
	// The data getter, which is making it all more complicated
	// than it needs to be...we need to close around those
	// callback hooks so we have to do it inplace here.
	source: function(request_data, response_hook) {
	    anchor.jq_vars['success'] = function(json_data){
		var retlist = [];
		var resp = new bbop.golr.response(json_data);

		// Reset the last return; remember: tri-state.
		result_count = null;
		return_count = null;

		if( resp.success() ){

		    // Get best shot at document counts.
		    result_count = resp.total_documents();
		    return_count = resp.documents().length;

		    loop(resp.documents(),
			 function(doc){

			     // First, try and pull what we can out of our
			     var lbl = label_tt.fill(doc);

			     // Now the same thing for the return/value.
			     var val = value_tt.fill(doc);

			     // Add the discovered items to the return
			     // save.
			     var item = {
				 'label': lbl,
				 'value': val,
				 'document': doc
			     };
			     retlist.push(item);
			 });
		}
		response_hook(retlist);
	    };

	    // Get the selected term into the manager and fire.
	    //anchor.set_query(request_data.term);
	    anchor.set_comfy_query(request_data.term);
	    anchor.JQ.ajax(anchor.get_query_url(), anchor.jq_vars);
	},
	// What to do when an element is selected.
	select: function(event, ui){

	    // Prevent default selection input filling action (from
	    // jQuery UI) when non-default marked.
	    if( ! anchor._fill_p ){
		event.preventDefault();		
	    }

	    var doc_to_apply = null;
	    if( ui.item ){
		doc_to_apply = ui.item.document;
	    }

	    // Only do the callback if it is defined.
	    if( doc_to_apply && 
		bbop.core.is_defined(anchor._list_select_callback) ){
		anchor._list_select_callback(doc_to_apply);
	    }
	},
	// What to do when a search is completed.
	response: function(event, ui){
	    // if(	result_count != null && return_count != null ){ // possible
	    // 	if( result_count > return_count ){
	    // 	    //console.log('incomplete listing');
	    // 	    var item = {
	    // 		'label': '...',
	    // 		'value': null,
	    // 		'document': null
	    // 	    };
	    // 	    ui.content.push(item);
	    // 	}else{
	    // 	    //console.log('complete listing');
	    // 	}
	    // }
	}
    };

    // Set the ball rolling (attach jQuery autocomplete to doc).
    var jac = jQuery('#' + anchor._interface_id).autocomplete(auto_args);

    // Add our render override.
    // Extension point to get the additional
    jac.data('ui-autocomplete')._renderMenu = function(ul, items){

	// Allow standard menu construction delegation.
	var anchor = this;
	loop(items, function(item){
	    anchor._renderItemData(ul, item);
	});
	
	// Add a special class to the UL if there are results that
	// are not shown.
	if( ar_class && ar_class != '' ){
	    jQuery(ul).removeClass(ar_class); // default no
	    if( result_count != null && return_count != null ){ // possible
		console.log('res_c: ' + result_count);
		console.log('ret_c: ' + return_count);
		if( result_count > return_count ){
		    // If 
		    jQuery(ul).addClass(ar_class);
		}
	    }
	}
    };

    /*
     * Function: destroy
     * 
     * Remove the autocomplete and functionality from the DOM.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.destroy = function(){
	jQuery('#' + anchor._interface_id).autocomplete('destroy');
    };

    /*
     * Function: content
     * 
     * Get the current text contents of the search box.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  string
     */
    this.content = function(){
	return jQuery('#' + anchor._interface_id).val();
    };

};
bbop.core.extend(bbop.widget.search_box, bbop.golr.manager.jquery);
