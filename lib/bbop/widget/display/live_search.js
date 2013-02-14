/*
 * Package: live_search.js
 * 
 * Namespace: bbop.widget.display.live_search
 * 
 * AmiGO object to draw various UI elements that have to do with things
 * dealing with a fully faceted searcher/browser.
 * 
 * It is probably not particularly useful directly, but rather used as
 * the framework for more specialized interfaces.
 * 
 * See Also:
 *  <search_pane.js>
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
bbop.core.require('bbop', 'widget', 'display', 'clickable_object');
bbop.core.require('bbop', 'widget', 'display', 'meta_results');
bbop.core.require('bbop', 'widget', 'display', 'results_table_by_class_conf');
bbop.core.require('bbop', 'widget', 'display', 'two_column_layout');
bbop.core.namespace('bbop', 'widget', 'live_search');

/*
 * Constructor: live_search
 * 
 * Contructor for the bbop.widget.display.live_search object.
 * 
 * Arguments:
 *  interface_id - string id of the div to build on
 *  conf_class - <bbop.golr.conf_class> for hints and other settings
 *  button_defs - a list of button definition hashes
 * 
 * Returns:
 *  BBOP GOlr UI object
 */
bbop.widget.display.live_search = function (interface_id, conf_class,
					    button_defs){

    var anchor = this;
    var each = bbop.core.each;
    
    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('UI (search): ' + str); }

    // There should be a string interface_id argument.
    // The class configuration we'll be using to hint and build.
    this.interface_id = interface_id;
    this.class_conf = conf_class;
   
    // Get the user interface hook and remove anything that was there.
    var ui_div_id = this.interface_id;
    jQuery('#' + ui_div_id).empty();

    // Mangle everything around this unique id so we don't collide
    // with other instances on the same page.
    var mangle = ui_div_id + '_ui_element_';

    // Render a control section into HTML. This includes the accordion
    // and current filter sections.
    var ui_controls_section_id = mangle + 'ui-controls-wrapper';
    var controls_div = new bbop.html.tag('div', {'id': ui_controls_section_id});
    //jQuery('#' + ui_div_id).append(controls_div.to_string());

    // Render a results section into HTML. The includes the results
    // table and the results meta-info sections.
    var ui_results_section_id = mangle + 'ui-results-wrapper';
    var results_div = new bbop.html.tag('div', {'id': ui_results_section_id});
    //jQuery('#' + ui_div_id).append(results_div.to_string());

    // Add the sections to a two column layout and add that into the
    // main ui div.
    var two_col_div =
	new bbop.widget.display.two_column_layout(controls_div, results_div);
    jQuery('#' + ui_div_id).append(two_col_div.to_string());

    // Main div id hooks to the easily changable areas of the two
    // column display.
    var ui_meta_div_id = mangle + 'meta-id';
    var ui_results_table_div_id = mangle + 'results-table-id';
    var ui_sticky_filters_div_id = mangle + 'sticky_filters-id';
    var ui_current_filters_div_id = mangle + 'current_filters-id';
    var ui_query_input_id = mangle + 'query-id';
    var ui_clear_query_span_id = mangle + 'clear-query-id';
    var ui_global_reset_span_id = mangle + 'global-reset-id';

    // Globally declared (or not) icons.
    var ui_icon_positive_label = '';
    var ui_icon_positive_source = '';
    var ui_icon_negative_label = '';
    var ui_icon_negative_source = '';
    var ui_icon_remove_label = '';
    var ui_icon_remove_source = '';

    // Additional id hooks for easy callbacks. While these are not as
    // easily changable as the above, we use them often enough and
    // across functions to have a hook.
    var accordion_div_id = mangle + 'filter-accordion-id';
    
    // These pointers are used in multiple functions (e.g. both
    // *_setup and *_draw).
    var filter_accordion_widget = null;
    //var current_filters_div = null;

    /*
     * Function: setup_query
     *
     * Setup the free text query display under contructed tags for
     * later population.
     * 
     * If no icon_clear_source is defined, icon_clear_label will be
     * used as the defining text.
     * 
     * Parameters:
     *  label_str - *[optional]* string or bbop.html for input label
     *  icon_clear_label - *[optional]* string or bbop.html for clear icon
     *  icon_clear_source - *[optional]* string to define the src of img 
     *
     * Returns:
     *  n/a
     */
    this.setup_query = function(label_str, icon_clear_label, icon_clear_source){
	ll('setup_query for: ' + ui_query_input_id);

	// Some defaults.
	if( ! label_str ){ label_str = ''; }
	if( ! icon_clear_label ){ icon_clear_label = ''; }
	if( ! icon_clear_source ){ icon_clear_source = ''; }
	
	// Tags and output to the page.
	var query_label = new bbop.html.tag('label', {'for': ui_query_input_id},
					    label_str);
	var query_div = new bbop.html.input({'id': ui_query_input_id,
					     'class': 'golr-ui-input'});	

	// Figure out an icon or a label.
	var clear_query_obj =
	    bbop.widget.display.clickable_object(icon_clear_label,
						 icon_clear_source,
						 ui_clear_query_span_id);

	// Add to display.
	jQuery('#' + ui_controls_section_id).append(query_label.to_string());
	jQuery('#' + ui_controls_section_id).append(query_div.to_string());
	jQuery('#' +ui_controls_section_id).append(clear_query_obj.to_string());
    };

    /*
     * Function: setup_global_reset_button
     *
     * Add a bit of a place for the global reset button.
     * 
     * If no icon_reset_source is defined, icon_reset_label will be
     * used as the defining text.
     * 
     * Parameters:
     *  icon_clear_label - *[optional]* string or bbop.html for clear icon
     *  icon_clear_source - *[optional]* string to define the src of img 
     *
     * Returns:
     *  n/a
     */
    this.setup_global_reset_button = function(icon_reset_label,
					      icon_reset_source){

	// Some defaults
	if( ! icon_reset_label ){ icon_reset_label = ''; }
	if( ! icon_reset_source ){ icon_reset_source = ''; }

	// Figure out an icon or a label.
    	var global_reset_obj =
	    bbop.widget.display.clickable_object(icon_reset_label,
						 icon_reset_source,
						 ui_global_reset_span_id);

	//
	var gstr = global_reset_obj.to_string();
    	jQuery('#' + ui_controls_section_id).append(gstr);
    };

    /*
     * Function: setup_sticky_filters
     *
     * Setup sticky filters display under contructed tags for later
     * population. The seeding information is coming in through the
     * GOlr conf class.
     * 
     * Add in the filter state up here.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  n/a
     */
    this.setup_sticky_filters = function(){
    
	ll('setup_sticky_filters UI for class configuration: ' +
	   this.class_conf.id());

	var sticky_filters_div =
	    new bbop.html.tag('div', {'id': ui_sticky_filters_div_id},
			      "No applied sticky filters.");

	// Add the output to the page.
	var sticky_filters_str = sticky_filters_div.to_string();
	jQuery('#' + ui_controls_section_id).append(sticky_filters_str);
    };

    /*
     * Function: setup_current_filters
     *
     * Setup current filters display under contructed tags for later
     * population. The seeding information is coming in through the
     * GOlr conf class.
     * 
     * Add in the filter state up here.
     * 
     * If no icon_reset_source is defined, icon_reset_label will be
     * used as the defining text.
     * 
     * Parameters:
     *  icon_remove_label - *[optional]* string or bbop.html for remove icon
     *  icon_remove_source - *[optional]* string to define the src of img 
     *
     * Returns:
     *  n/a
     */
    this.setup_current_filters = function(icon_remove_label,icon_remove_source){
	ll('setup_current_filters UI for class configuration: ' +
	   this.class_conf.id());

	// Set the class variables for use when we do the redraws.
	if( icon_remove_label ){ ui_icon_remove_label = icon_remove_label; }
	if( icon_remove_source ){ ui_icon_remove_source = icon_remove_source; }

	// Create the placeholder.
	var current_filters_div =
	    new bbop.html.tag('div', {'id': ui_current_filters_div_id},
			      "No applied user filters.");

	// Add the output to the page.
	var curr_filters_str = current_filters_div.to_string();
	jQuery('#' + ui_controls_section_id).append(curr_filters_str);
    };

    /*
     * Function: setup_accordion
     *
     * Setup the accordion skeleton under contructed tags for later
     * population. The seeding information is coming in through the
     * GOlr conf class.
     * Start building the accordion here. Not an updatable part.
     * 
     * If no icon_*_source is defined, icon_*_label will be
     * used as the defining text.
     * 
     * Parameters:
     *  icon_positive_label - *[optional]* string or bbop.html for positive icon
     *  icon_positive_source - *[optional]* string to define the src of img 
     *  icon_negative_label - *[optional]* string or bbop.html for positive icon
     *  icon_negative_source - *[optional]* string to define the src of img 
     *
     * Returns: 
     *  n/a
     */
    this.setup_accordion = function(icon_positive_label, icon_positive_source,
				    icon_negative_label, icon_negative_source){
	
	ll('setup_accordion UI for class configuration: ' +
	   this.class_conf.id());

	// Set the class variables for use when we do the redraws.
	if( icon_positive_label ){
	    ui_icon_positive_label = icon_positive_label; }
	if( icon_positive_source ){
	    ui_icon_positive_source = icon_positive_source; }
	if( icon_negative_label ){
	    ui_icon_negative_label = icon_negative_label; }
	if( icon_negative_source ){
	    ui_icon_negative_source = icon_negative_source; }

	var filter_accordion_attrs = {
	    id: accordion_div_id,
	    style: 'width: 25em;'
	};
	filter_accordion_widget = // heavy lifting by special widget
	    new bbop.html.accordion([], filter_accordion_attrs, true);

	// Add the sections with no contents as a skeleton to be
	// filled by draw_accordion.
	var field_list = this.class_conf.field_order_by_weight('filter');
	each(field_list,
	     function (in_field){
		 ll('saw field: ' + in_field);
		 var ifield = anchor.class_conf.get_field(in_field);
		 var in_attrs = {
		     id: in_field,
		     label: ifield.display_name(),
		     description: ifield.description()
		 };
		 filter_accordion_widget.add_to(in_attrs, '', true);
	     });
	
	// Add the output from the accordion to the page.
	var accordion_str = filter_accordion_widget.to_string();
	jQuery('#' + ui_controls_section_id).append(accordion_str);

	// Add the jQuery accordioning.
	jQuery("#" + accordion_div_id).accordion({ clearStyle: true,
						   collapsible: true,
						   active: false });
    };

    /*
     * Function: setup_results
     *
     * Setup basic results table using the class conf. For actual
     * results rendering, see .draw_results. While there is a meta
     * block supplied, its use is optional.
     * 
     * Parameters:
     *  hash; the only option is {'meta': true}.
     *
     * Returns:
     *  n/a
     */
    this.setup_results = function(args){

	ll('setup_results UI for class configuration: ' + this.class_conf.id());
	
	// Decide whether or not to add the meta div.
	var add_meta_p = false;
	if( args && args['meta'] && args['meta'] == true ){
	    add_meta_p = true;
	}

	// <div id="results_block" class="block">
	// <h2>Found entities</h2>
	// <div id="load_float"></div>
	// <div id="meta_results">
	// <div id="results_div">
	var block = new bbop.html.tag('div', {'class': 'block'});

	// Add header section.
	var header = new bbop.html.tag('h2', {}, 'Found entities');
	block.add_to(header);

	// If wanted, add meta to display queue.
	if( add_meta_p ){	    
	    var meta = new bbop.html.tag('div', {'id': ui_meta_div_id});
	    block.add_to(meta);
	}

	// Add results section.
	var results = new bbop.html.tag('div', {'id': ui_results_table_div_id});
	block.add_to(results);

	jQuery('#' + ui_results_section_id).append(block.to_string());

	// If wanted, add initial render of meta.
	if( add_meta_p ){	    
	    ll('Add meta UI div');
	    jQuery('#' + ui_meta_div_id).empty();
	    jQuery('#' + ui_meta_div_id).append('No search yet performed...');
	}
    };

    /*
     * Function: draw_meta
     *
     * Draw meta results.
     * TODO: paging, etc.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_meta = function(response, manager){
	
	ll('draw_meta for: ' + ui_meta_div_id);

	///
	/// Section 1: the numbers display.
	///

	// Collect numbers for display.
	var total_c = response.total_documents();
	var first_d = response.start_document();
	var last_d = response.end_document();

	// Draw meta; the current numbers and page--the same for
	// every type of return.
	var dmeta = null;
	if( total_c == 0 ){
	    //// Adjust since we're off by one.
	    //dmeta = new bbop.widget.display.meta_results(0, 0, 0);
	    jQuery('#' + ui_meta_div_id).empty();
	    jQuery('#' + ui_meta_div_id).append('No results found.');
	}else{
	    dmeta =
		new bbop.widget.display.meta_results(total_c, first_d, last_d);

	    jQuery('#' + ui_meta_div_id).empty();
	    jQuery('#' + ui_meta_div_id).append(dmeta.to_string());

	    ///
	    /// Section 2: the paging buttons.
	    ///
	    
	    // Now add the raw buttons to the interface, and after this,
	    // activation and adding events.
	    var b_first = new bbop.html.button('First', {'generate_id': true});
	    jQuery('#' + ui_meta_div_id).append(b_first.to_string());
	    var b_back = new bbop.html.button('Prev', {'generate_id': true});
	    jQuery('#' + ui_meta_div_id).append(b_back.to_string());
	    var b_forward = new bbop.html.button('Next', {'generate_id': true});
	    jQuery('#' + ui_meta_div_id).append(b_forward.to_string());
	    var b_last = new bbop.html.button('Last', {'generate_id': true});
	    jQuery('#' + ui_meta_div_id).append(b_last.to_string());

	    // Do the math about what buttons to activate.
	    var b_first_disabled_p = false;
	    var b_back_disabled_p = false;
	    var b_forward_disabled_p = false;
	    var b_last_disabled_p = false;
	    
	    // Only activate paging if it is necessary to the returns.
	    if( ! response.paging_p() ){
		b_first_disabled_p = true;
		b_back_disabled_p = true;
		b_forward_disabled_p = true;
		b_last_disabled_p = true;
	    }
	    
	    // Don't activate back on the first page.
	    if( ! response.paging_previous_p() ){
		b_first_disabled_p = true;
		b_back_disabled_p = true;
	    }
	    
	    // Don't activate next on the last page.
	    if( ! response.paging_next_p() ){
		b_forward_disabled_p = true;
		b_last_disabled_p = true;
	    }
	    
	    // First page button.
	    var b_first_props = {
		icons: { primary: "ui-icon-seek-first"},
		disabled: b_first_disabled_p,
		text: false
	    };
	    jQuery('#' + b_first.get_id()).button(b_first_props).click(
		function(){
		    // Cheat and trust reset by proxy to work.
		    manager.page_first(); 
		});
	    
	    // Previous page button.
	    var b_back_props = {
		icons: { primary: "ui-icon-seek-prev"},
		disabled: b_back_disabled_p,
		text: false
	    };
	    jQuery('#' + b_back.get_id()).button(b_back_props).click(
		function(){
		    manager.page_previous();
		});
	    
	    // Next page button.
	    var b_forward_props = {
		icons: { primary: "ui-icon-seek-next"},
		disabled: b_forward_disabled_p,
		text: false
	    };
	    jQuery('#' + b_forward.get_id()).button(b_forward_props).click(
		function(){
		    manager.page_next();
		});
	    
	    // Last page button.
	    var b_last_props = {
		icons: { primary: "ui-icon-seek-end"},
		disabled: b_last_disabled_p,
		text: false
	    };
	    jQuery('#' + b_last.get_id()).button(b_last_props).click(
		function(){
		    // A little trickier.
		    manager.page_last(total_c);
		});
	    
	    ///
	    /// Section 3: the button_defs buttons.
	    ///

	    // Spacer.	    
	    jQuery('#' + ui_meta_div_id).append('&nbsp;&nbsp;&nbsp;' +
						'&nbsp;&nbsp;&nbsp;');

	    // Add all of the defined buttons after the spacing.
	    function _button_rollout(button_def_hash){
		var default_hash =
    		    {
			label : 'n/a',
			disabled_p : false,
			text_p : false,
			icon : 'ui-icon-help',
			click_function_generator :
			function(){
			    return function(){
				alert('No callback defined for this button--' +
				      'the generator may have been empty!');
			    };
			}
    		    };
		var folding_hash = button_def_hash || {};
		var arg_hash = bbop.core.fold(default_hash, folding_hash);

		var label = arg_hash['label'];
		var disabled_p = arg_hash['disabled_p'];
		var text_p = arg_hash['text_p'];
		var icon = arg_hash['icon'];
		var click_function_generator =
		    arg_hash['click_function_generator'];

		var b = new bbop.html.button(label, {'generate_id': true});
		jQuery('#' + ui_meta_div_id).append(b.to_string());
		var b_props = {
		    icons: { primary: icon},
		    disabled: disabled_p,
		    text: text_p
		};
		var click_fun = click_function_generator(manager);
		jQuery('#' + b.get_id()).button(b_props).click(click_fun);
	    }
	    bbop.core.each(button_defs, _button_rollout);

	    // // GAF.
	    // // Export.
	    // var b_export = new bbop.html.button('Export to GO Galaxy',
	    // 					{'generate_id': true});
	    // jQuery('#' + ui_meta_div_id).append(b_export.to_string());
	    // var b_export_props = {
	    // 	icons: { primary: "ui-icon-circle-zoomin"},
	    // 	//disabled: false,
	    // 	disabled: true,
	    // 	text: false
	    // };
	    // jQuery('#' + b_export.get_id()).button(b_export_props).click(
	    // 	function(){
	    // 	    alert('TODO: Export to Galaxy: ' + manager.get_query_url());
	    // 	});

	    // var b_gaf = new bbop.html.button('GAF download',
	    // 				     {'generate_id': true});
	    // jQuery('#' + ui_meta_div_id).append(b_gaf.to_string());
	    // var b_gaf_props = {
	    // 	icons: { primary: "ui-icon-circle-arrow-s"},
	    // 	disabled: false,
	    // 	text: false
	    // };
	    // jQuery('#' + b_gaf.get_id()).button(b_gaf_props).click(
	    // 	function(){
	    // 	    var fl = [
	    // 		'source',
	    // 		// 'bioentity_internal_id',
	    // 		'bioentity_label',
	    // 		//'qualifier',
	    // 		'annotation_class',
	    // 		'reference',
	    // 		'evidence_type',
	    // 		'evidence_with',
	    // 		// 'aspect',
	    // 		// 'bioentity_name',
	    // 		// 'bioentity_synonym',
	    // 		// 'type',
	    // 		'taxon',
	    // 		'date',
	    // 		// 'assigned_by',
	    // 		'annotation_extension_class',
	    // 		'bioentity'
	    // 	    ];
	    // 	    alert('GAF download (1000 lines): ' +
	    // 		  manager.get_download_url(fl));
	    // 	    ;
	    // 	    //alert('GAF download: ' + manager.get_query_url());
	    // 	});

	    // // Cart.
	    // var b_cart = new bbop.html.button('Cart',
	    // 					{'generate_id': true});
	    // jQuery('#' + ui_meta_div_id).append(b_cart.to_string());
	    // var b_cart_props = {
	    // 	icons: { primary: "ui-icon-cart"},
	    // 	disabled: false,
	    // 	text: false
	    // };
	    // jQuery('#' + b_cart.get_id()).button(b_cart_props).click(
	    // 	function(){
	    // 	    alert('TODO: Cart function: ' + manager.get_query_url());
	    // 	});
	}
    };

    /*
     * Function: reset_query
     *
     * Setup and draw the query widget. This function makes it active
     * as well.
     * 
     * Due to the nature of this, it is only reset when called.
     * 
     * NOTE: Since this is part of the "persistant" interface (i.e. it
     * does not get wiped after every call), we make sure to clear the
     * event listeners when we retry the function to prevent them fomr
     * building up.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.reset_query = function(response, manager){

    	ll('reset_query for: ' + ui_query_input_id);

	// Reset manager and ui.
	jQuery('#' + ui_query_input_id).val('');
	manager.reset_query();

	// Add a smartish listener.
	jQuery('#' + ui_query_input_id).unbind('keyup');
	jQuery('#' + ui_query_input_id).keyup(
	    function(event){

		// First, extract the exact event, we might want to
		// filter it...
		var ignorable_event_p = false;
		if( event ){
		    var kc = event.keyCode;
		    if( kc ){
			if( kc == 39 || // right
                            kc == 37 || // left
                            kc == 32 || // space
                            kc == 20 || // ctl?
                            kc == 17 || // ctl?
                            kc == 16 || // shift
                            //kc ==  8 || // delete
                            kc ==  0 ){ // super
				ll('ignorable key event: ' + kc);
				ignorable_event_p = true;
			    }
                    }
		}

		// If we're left with a legitimate event, handle it.
		if( ! ignorable_event_p ){

		    // Can't ignore it anymore, so it goes into the
		    // manager for testing.
		    var tmp_q = manager.get_query();
		    var input_text = jQuery(this).val();
		    manager.set_query(input_text);

		    // If the manager feels like it's right, trigger.
		    if( manager.sensible_query_p() ){
			ll('keeping set query: ' + input_text);
			// Set the query to be more "usable" just
			// before triggering (so the tests can't be
			// confused by our switch).
			manager.set_comfy_query(input_text);
			manager.search();
		    }else{
			ll('rolling back query: ' + tmp_q);		    
			manager.set_query(tmp_q);
		    }
		}
	    });

	// Now reset the clear button and immediately set the event.
	jQuery('#' + ui_clear_query_span_id).unbind('click');
	jQuery('#' + ui_clear_query_span_id).click(
	    function(){
		jQuery('#' + ui_query_input_id).val('');
		manager.reset_query();
		manager.search();
	    });
    };

    /*
     * Function: reset_global_reset_button
     *
     * Add events and redraw to the global reset button section.
     * 
     * NOTE: Since this is part of the "persistant" interface (i.e. it
     * does not get wiped after every call), we make sure to clear the
     * event listeners when we retry the function to prevent them fomr
     * building up.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     * 
     * Returns:
     *  n/a
     */
    this.reset_global_reset_button = function(response, manager){
    
    	ll('reset_global_reset_button');
    	//jQuery('#' + ui_reset_span_id).empty();
    	// Immediately set the event.
	jQuery('#' + ui_global_reset_span_id).unbind('click');
    	jQuery('#' + ui_global_reset_span_id).click(
    	    function(){
    		manager.reset();
    	    });
    };

    /*
     * Function: draw_sticky_filters
     *
     * (Re)draw the information on the sticky filter set.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_sticky_filters = function(response, manager){
    
	ll('draw_sticky_filters for: ' + ui_div_id);

	// Add in the actual HTML for the pinned filters and buttons.
	var sticky_query_filters = manager.get_sticky_query_filters();
	ll('sticky filters: ' + bbop.core.dump(sticky_query_filters));
	var fq_list_tbl = new bbop.html.table(['', 'Pinned filters'], []);
	// [{'filter': A, 'value': B, 'negative_p': C, 'sticky_p': D}, ...]
	each(sticky_query_filters,
	     function(fset){

		 //
		 var sfield = fset['filter'];
		 var sfield_val = fset['value'];

		 // Boolean value to a character.
		 var polarity = fset['negative_p'];
		 var polstr = '-';
		 if( polarity ){ polstr = '+'; }

		 // Generate a button with a unique id.
		 var label_str = polstr + ' ' + sfield + ':' + sfield_val;
		 fq_list_tbl.add_to(['<b>'+ polstr +'</b>',
				     sfield + ': ' + sfield_val]);
	     });
	
	// Either add to the display, or display the "empty" message.
	var sfid = '#' + ui_sticky_filters_div_id;
	jQuery(sfid).empty();
	if( sticky_query_filters.length == 0 ){
	    jQuery(sfid).append("No sticky filters.");
	}else{
	    // Attach to the DOM...
	    jQuery(sfid).append(fq_list_tbl.to_string());
	}
    };

    /*
     * Function: draw_current_filters
     *
     * (Re)draw the information on the current filter set.
     * This function makes them active as well.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_current_filters = function(response, manager){
    
	ll('draw_current_filters for: ' + ui_div_id);

	// Add in the actual HTML for the filters and buttons. While
	// doing so, tie a unique id to the filter--we'll use that
	// later on to add buttons and events to them.
	var in_query_filters = response.query_filters();
	//var sticky_query_filters = manager.get_sticky_query_filters();
	ll('filters: ' + bbop.core.dump(in_query_filters));
	var fq_list_tbl = new bbop.html.table(['', 'User filters', ''], []);
	var has_fq_p = false; // assume there are no filters to begin with
	var button_hash = {};
	each(in_query_filters,
	     function(field, field_vals){
		 each(field_vals,
		      function(field_val, polarity){

			  // Make note of stickiness, skip adding if sticky.
			  var qfp =
			      manager.get_query_filter_properties(field,
								  field_val);
			  if( ! qfp || qfp['sticky_p'] == false ){
			  
			      // Note the fact that we actually have a
			      // query filter to work with and display.
			      has_fq_p = true;

			      // Boolean value to a character.
			      var polstr = '-';
			      if( polarity ){ polstr = '+'; }

			      // Generate a button with a unique id.
			      var label_str = polstr+' '+ field +':'+field_val;

			      // Argh! Real jQuery buttons are way too slow!
			      // var b = new bbop.html.button('remove filter',
			      // 		  {'generate_id': true});

			      // Is the "button" a span or an image?
			      var b = bbop.widget.display.clickable_object(
				  ui_icon_remove_label,
				  ui_icon_remove_source,
				  null); // generate_id

			      // Tie the button it to the filter for
			      // jQuery and events attachment later on.
			      var bid = b.get_id();
			      button_hash[bid] = [polstr, field, field_val];
			  
			      //ll(label_str +' '+ bid);
			      //fq_list_tbl.add_to(label_str +' '+ b.to_string());
			      fq_list_tbl.add_to(['<b>'+ polstr +'</b>',
						  field + ': ' + field_val,
						  b.to_string()]);
			      //label_str +' '+ b.to_string());
			  }
		      });
	     });

	// Either add to the display, or display the "empty" message.
	var cfid = '#' + ui_current_filters_div_id;
	jQuery(cfid).empty();
	if( ! has_fq_p ){
	    jQuery(cfid).append("No current user filters.");
	}else{

	    // With this, the buttons will be attached to the
	    // DOM...
	    jQuery(cfid).append(fq_list_tbl.to_string());

	    // Now let's go back and add the buttons, styles,
	    // events, etc.
	    each(button_hash,
		 function(button_id){
		     var bid = button_id;

		     // // Get the button.
		     // var bprops = {
		     // 	 icons: { primary: "ui-icon-close"},
		     // 	 text: false
		     // };
		     // Create the button and immediately add the event.
		     //jQuery('#' + bid).button(bprops).click(
		     jQuery('#' + bid).click(
			 function(){
			     var tid = jQuery(this).attr('id');
			     var button_props = button_hash[tid];
			     var polstr = button_props[0];
			     var field = button_props[1];
			     var value = button_props[2];

			     // Change manager and fire.
			     // var lstr = polstr +' '+ field +' '+ value;
			     // alert(lstr);
			     // manager.remove_query_filter(field,value,
			     // 				 [polstr, '*']);
			     manager.remove_query_filter(field, value);
			     manager.search();
			 });
		 });
	}
    };

    /*
     * Function: draw_accordion
     *
     * (Re)draw the information in the accordion controls/filters.
     * This function makes them active as well.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_accordion = function(response, manager){
    
	ll('draw_accordion for: ' + ui_div_id);

	// Make sure that accordion has already been inited.
	if( typeof(filter_accordion_widget) == 'undefined' ){
	    throw new Error('Need to init accordion to use it.');
	}

	// We'll need this in a little bit for calculating when to
	// display the "more" option for the field filters.
	var curr_facet_limit = manager.get_facet_limit();

	// Hash where we collect our button information.
	// button_id -> [source, filter, count, polarity];
	var button_hash = {};

	// And a hash to store information to be able to generate the
	// complete filter shields.
	// span_id -> filter_id
	var overflow_hash = {};

	// Cycle through each facet field; all the items in each,
	// create the lists and buttons (while collectong data useful
	// in creating the callbacks) and put them into the accordion.
	each(response.facet_field_list(),
	     function(in_field){

		 var facet_bd = response.facet_field(in_field);
		 if( bbop.core.is_empty(facet_bd) ){
		     
		     // No filters means nothing in the box.
		     var section_id =
			 filter_accordion_widget.get_section_id(in_field);
		     jQuery('#' + section_id).empty();
		     jQuery('#' + section_id).append('Nothing to filter.');

		 }else{
		     
		     // Create ul lists of the facet contents.
		     var tbl_id = mangle + 'filter-list-' + in_field;
		     var facet_list_tbl_attrs = {
			 id: tbl_id
			 //style: 'height: 30em;'
		     };
		     //var facet_list_ul=new bbop.html.list([],facet_list_ul_attrs);
		     var facet_list_tbl =
			 new bbop.html.table([], [], facet_list_tbl_attrs);
		     
		     // Now go through and get filters and counts.
		     each(response.facet_field(in_field),
			  function(ff_field, ff_index){

			      // Only go for it if we have still below
			      // the limit by one; otherwise, we'll
			      // want to display the larger selection
			      // shield.
			      if( ff_index < curr_facet_limit -1 ){ // offset
				  
				  // Pull out info.
				  var f_name = ff_field[0];
				  var f_count = ff_field[1];
				  //var fstr = f_name +" ("+ f_count +")";
				  //ll("COLLECT: " + fstr);
				  
				  // Create buttons and store them for later
				  // activation with callbacks to the manager.
				  var b_plus =
				      bbop.widget.display.clickable_object(
					  ui_icon_positive_label,
					  ui_icon_positive_source,
					  null); // generate_id
				  var b_minus =
				      bbop.widget.display.clickable_object(
					  ui_icon_negative_label,
					  ui_icon_negative_source,
					  null); // generate_id

				  // Store in hash for later keying to
				  // event.
				  button_hash[b_plus.get_id()] =
				      [in_field, f_name, f_count, '+'];
				  button_hash[b_minus.get_id()] =
				      [in_field, f_name, f_count, '-'];
				  
				  // // Add the label and buttons to the
				  // // appropriate ul list.
				  //facet_list_ul.add_to(
				  // fstr,b_plus.to_string(),
				  // 		       b_minus.to_string());
				  // Add the label and buttons to the table.
				  facet_list_tbl.add_to([f_name,'('+f_count+')',
							 b_plus.to_string(),
							 b_minus.to_string()]);
			      }else{

				  // Since this is the overflow item,
				  // add a span that can be clicked on
				  // to get the full filter list.
				  //ll("Overflow for " + in_field);
				  var b_over_txt = '<b>[more...]</b>';
				  var b_over =
				      new bbop.html.span(b_over_txt,
							 {'generate_id': true});
				  facet_list_tbl.add_to([b_over.to_string(),
				  			 '', '']);
				  overflow_hash[b_over.get_id()] = in_field;
			      }
			  });

		     // Now add the ul to the appropriate section of the
		     // accordion in the DOM.
		     var sect_id =
			 filter_accordion_widget.get_section_id(in_field);
		     jQuery('#' + sect_id).empty();
		     var final_tbl_str = facet_list_tbl.to_string();
		     jQuery('#' + sect_id).append(final_tbl_str);
		 }
	     });

	// Okay, now introducing a function that we'll be using a
	// couple of times in our callbacks. Given a button id (from
	// a button hash) and the [field, filter, count, polarity]
	// values from the props, make a button-y thing an active
	// filter.
	function filter_select_live(button_id, create_time_button_props){
	    //var bid = button_id;
	    //var in_field = create_time_button_props[0];	 
	    //var in_filter = create_time_button_props[1];
	    //var in_count = create_time_button_props[2];
	    var in_polarity = create_time_button_props[3];

	    // Decide on the button graphical elements.
	    var b_ui_icon = 'ui-icon-plus';
	    if( in_polarity == '-' ){
		b_ui_icon = 'ui-icon-minus';
	    }
	    var b_ui_props = {
		icons: { primary: b_ui_icon},
		text: false
	    };

	    // Create the button and immediately add the event.
	    //jQuery('#' + button_id).button(b_ui_props).click(
	    jQuery('#' + button_id).click(
		function(){
		    var tid = jQuery(this).attr('id');
		    var call_time_button_props = button_hash[tid];
		    var call_field = call_time_button_props[0];	 
		    var call_filter = call_time_button_props[1];
		    //var in_count = button_props[2];
		    var call_polarity = call_time_button_props[3];
		    
		    // Change manager and fire.
		    // var bstr =call_field+' '+call_filter+' '+call_polarity;
		    // alert(bstr);
		    manager.add_query_filter(call_field, call_filter,
			  		     [call_polarity]);
		    manager.search();
		});
	}

	// Now let's go back and add the buttons, styles,
	// events, etc. in the main accordion section.
	each(button_hash, filter_select_live);

	// Next, tie the events to the "more" spans.
	each(overflow_hash,
	     function(button_id, filter_name){
		 jQuery('#' + button_id).click(

		     // On click, set that one field to limitless in
		     // the manager, setup a shield, and wait for the
		     // callback.
		     function(){

			 // Recover the field name.
			 var tid = jQuery(this).attr('id');
			 var call_time_field_name = overflow_hash[tid];
			 //alert(call_time_field_name);

			 // Set the manager to no limit on that field and
			 // only rturn the information that we want.
			 manager.set_facet_limit(0);
			 manager.set_facet_limit(call_time_field_name, -1);
			 var curr_row = manager.get('rows');
			 manager.set('rows', 0);

			 // Create the shield and pop-up the
			 // placeholder.
			 var filter_shield =
			     new bbop.widget.display.filter_shield();
			 filter_shield.start_wait();

			 // Open the populated shield.
			 function draw_shield(resp){

			    // ll("shield what: " + bbop.core.what_is(resp));
			    // ll("shield resp: " + bbop.core.dump(resp));

			     // First, extract the fields from the
			     // minimal response.
			     var fina = call_time_field_name;
			     var flist = resp.facet_field(call_time_field_name);

			     // Draw the proper contents of the shield.
			     filter_shield.draw(fina, flist, manager);
			 }
			 manager.fetch(draw_shield);

			 // Reset the manager to more sane settings.
			 manager.reset_facet_limit();
			 manager.set('rows', curr_row);
		     });
	     });

	ll('Done current accordion for: ' + ui_div_id);
    };

    /*
     * Function: draw_results
     *
     * Draw results using hints from the golr class configuration.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_results = function(response, manager){
	
	var linker = new amigo.linker();

	ll('draw_results for: ' + ui_results_table_div_id);

	//ll('final_table a: ' + final_table._is_a);
	//ll('final_table b: ' + final_table.to_string);
	//ll('final_table c: ' + final_table.to_string());

	// Clear whatever is there.
	var urtdi = ui_results_table_div_id;
	jQuery('#' + urtdi).empty();

	// Display product when not empty.
	var docs = response.documents();
	if( ! bbop.core.is_empty(docs) ){
	    var final_table =
		new bbop.widget.display.results_table_by_class(anchor.class_conf,
							       response,
							       linker,
							       urtdi);
	    //jQuery('#' + urtdi).append(bbop.core.to_string(final_table));
	}
    };

    /*
     * Function: draw_error
     *
     * Somehow report an error to the user.
     * 
     * Parameters:
     *  error_message - a string(?) describing the error
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    this.draw_error = function(error_message, manager){
	ll("draw_error: " + error_message);
	alert("Runtime error: " + error_message);
    };

};
