/*
 * Package: live_filters.js
 * 
 * Namespace: bbop.widget.live_filters
 * 
 * BBOP JS object to allow the live probing of a GOlr personality.
 * 
 * Very much like a separated accordion and filter from the search
 * pane.
 * 
 * See Also:
 *  <search_pane.js>
 *  <live_search.js>
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: live_filters
 * 
 * Contructor for the bbop.widget.live_filters object.
 * 
 * Interactively explore a search personality with no direct side
 * effects.
 *
 * This is a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
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
bbop.widget.live_filters = function(golr_loc, golr_conf_obj,
				    interface_id, in_argument_hash){
    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.live_filters';

    var anchor = this;
    var each = bbop.core.each;
    
    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = false;
    //logger.DEBUG = true;
    function ll(str){ logger.kvetch('LF: ' + str); }

    ///
    /// Deal with incoming arguments.
    ///

    this._class_conf = golr_conf_obj;

    // Our argument default hash.
    var default_hash =
	{
	    'display_meta_p': true,
	    'display_free_text_p': true,
	    'display_accordion_p': true,
	    'minimum_free_text_length': 3, // wait for three characters or more
	    'on_update_callback': function(){}
	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    // 
    this._interface_id = interface_id;
    this._display_meta_p = arg_hash['display_meta_p'];
    this._display_free_text_p = arg_hash['display_free_text_p'];
    this._display_accordion_p = arg_hash['display_accordion_p'];
    this._minimum_free_text_length = arg_hash['minimum_free_text_length'];
    this._on_update_callback = arg_hash['on_update_callback'];

    ///
    /// Prepare the interface and setup the div hooks.
    ///

    anchor._established_p = false;

    // Mangle everything around this unique id so we don't collide
    // with other instances on the same page.
    var ui_div_id = this._interface_id;
    var mangle = ui_div_id + '_ui_element_' + bbop.core.uuid() + '_';

    // Main div id hooks to the easily changable areas of the display.
    var container_div_id = mangle + 'container-id';
    var meta_div_id = mangle + 'meta-id';
    var query_input_div_id = mangle + 'query-id';
    var sticky_filters_div_id = mangle + 'sticky_filters-id';
    var current_filters_div_id = mangle + 'current_filters-id';
    var filters_div_id = mangle + 'ui-filters-wrapper';
    var clear_query_span_id = mangle + 'clear-query-id';
    var clear_user_filter_span_id = mangle + 'clear-user-filter-id';
    // var ui_user_button_div_id = mangle + 'user-button-id';
    // var ui_results_table_div_id = mangle + 'results-table-id';
    // var ui_count_control_div_id = mangle + 'count_control-id';

    // Blow away whatever was there completely.
    // Render a control section into HTML. This includes the accordion
    // and current filter sections.
    // Get the user interface hook and remove anything that was there.
    var container_div = new bbop.html.tag('div', {'id': container_div_id});
    jQuery('#' + ui_div_id).empty();
    jQuery('#' + ui_div_id).append(container_div.to_string());

    // // Globally declared (or not) icons.
    // var ui_spinner_search_source = '';
    // var ui_spinner_shield_source = '';
    // var ui_spinner_shield_message = null;
    // var ui_icon_positive_label = '';
    // var ui_icon_positive_source = '';
    // var ui_icon_negative_label = '';
    // var ui_icon_negative_source = '';
    // var ui_icon_remove_label = '';
    // var ui_icon_remove_source = '';

    // // The spinner, if it exists, needs to be accessible by everybody
    // // and safe to use.
    // var spinner = null;
    // function _spinner_gen(elt_id){
    // 	var spinner_args = {
    // 	    //timeout: 5,
    // 	    //timeout: 500,
    // 	    timeout: 10,
    // 	    //classes: 'bbop-widget-search_pane-spinner',
    // 	    visible_p: false
    // 	};
    // 	spinner = new bbop.widget.spinner(elt_id,
    // 					  ui_spinner_search_source,
    // 					  spinner_args);
    // }
    // function _spin_up(){
    // 	if( spinner ){
    // 	    spinner.start_wait();
    // 	}
    // }
    // function _spin_down(){
    // 	if( spinner ){
    // 	    spinner.finish_wait();
    // 	}
    // }

    // // Additional id hooks for easy callbacks. While these are not as
    // // easily changable as the above, we use them often enough and
    // // across functions to have a hook.
    // var accordion_div_id = mangle + 'filter-accordion-id';
    
    // // These pointers are used in multiple functions (e.g. both
    // // *_setup and *_draw).
    var filter_accordion_widget = null;
    // //var current_filters_div = null;

    /*
     * Function: establish_display
     * 
     * Completely redraw the display.
     * 
     * Required to display after setting up the manager.
     * 
     * Also may be useful after a major change to the manager to reset
     * it.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.establish_display = function(){
	
    	// Can only make a display if there is a set
    	// personality--there is no general default and it is an
    	// error.
    	var personality = anchor.get_personality();
    	var cclass = golr_conf_obj.get_class(personality);
    	if( ! personality || ! cclass ){
    	    ll('ERROR: no usable personality set');
    	    throw new Error('ERROR: no useable personality set');
    	}

    	///
    	/// Setup UI and bind it to events.
    	///
	
	// ...
	if( this._display_meta_p ){
	    //...
	}

	// Setup the free text query display under contructed tags for
	// later population.
	// 
	// If no icon_clear_source is defined, icon_clear_label will be
	// used as the defining text.
	this.setup_query = function(label_str){
	    ll('setup_query for: ' + query_input_div_id);
	    
	    // Some defaults.
	    if( ! label_str ){ label_str = ''; }
	    // if( ! icon_clear_label ){ icon_clear_label = ''; }
	    // if( ! icon_clear_source ){ icon_clear_source = ''; }
	    
	    // The incoming label.
	    var query_label_attrs = {
		//'class': 'bbop-js-search-pane-query-label'
	    };
	    var query_label_div =
		new bbop.html.tag('div', query_label_attrs, label_str);
	    
	    // The text area.
	    var ta_args = {
		//'class': 'bbop-js-search-pane-textarea',
		'id': query_input_div_id
	    };
	    var query_area = new bbop.html.tag('textarea', ta_args);
	    
	    // Figure out an icon or a label.
	    var clear_query_obj =
		//bbop.widget.display.clickable_object(icon_clear_label);
		bbop.widget.display.clickable_object(null);
	    
	    // And a div to put it in.
	    var clear_div_attrs = {
		//'class': 'bbop-js-search-pane-clear-button',
		'generate_id': true
	    };
	    var clear_div =
		new bbop.html.tag('div', clear_div_attrs, clear_query_obj);	
	    
	    // General container div.
	    var gen_div_attrs = {
		'generate_id': true
	    };
	    var gen_div = new bbop.html.tag('div', gen_div_attrs);
	    
	    // Add to display.
	    query_label_div.add_to(clear_div.to_string());
	    gen_div.add_to(query_label_div.to_string());
	    gen_div.add_to(query_area.to_string());
	    
	    jQuery('#' + container_div.get_id()).append(gen_div.to_string());
	};
	if( this._display_free_text_p ){
	    this.setup_query('Foo!');
	}

	// Setup sticky filters display under contructed tags for later
	// population. The seeding information is coming in through the
	// GOlr conf class.
	this.setup_sticky_filters = function(){    
    	    ll('setup_sticky_filters UI for class configuration: ' +
	       cclass.id());
	    
    	    var sticky_filters_attrs = {
    		//'class': 'bbop-js-search-pane-sticky-filters',
    		'id': sticky_filters_div_id
    	    };
    	    var sticky_filters_div =
    		new bbop.html.tag('div', sticky_filters_attrs,
    				  "No applied sticky filters.");
	    
    	    // Add the output to the page.
    	    var sticky_filters_str = sticky_filters_div.to_string();
	    jQuery('#' + container_div.get_id()).append(sticky_filters_str);
	};	
	// Setup current filters display under contructed tags for later
	// population. The seeding information is coming in through the
	// GOlr conf class.
	// 
	// Add in the filter state up here.
	// 
	// If no icon_reset_source is defined, icon_reset_label will be
	// used as the defining text.
	this.setup_current_filters = function(){
    	    ll('setup_current_filters UI for class configuration: ' +
	       cclass.id());
	    
    	    // Create the placeholder.
    	    var curr_filters_div =
    		new bbop.html.tag('div', {'id': current_filters_div_id},
    				  "No applied user filters.");
	    
    	    // Add the output to the page.
    	    var curr_filters_str = curr_filters_div.to_string();
	    jQuery('#' + container_div.get_id()).append(curr_filters_str);
	};
	// Setup the accordion skeleton under contructed tags for later
	// population. The seeding information is coming in through the
	// GOlr conf class.
	// Start building the accordion here. Not an updatable part.
	// 
	// If no icon_*_source is defined, icon_*_label will be
	// used as the defining text.
	this.setup_accordion = function(){
    	    ll('setup_accordion UI for class configuration: ' +
    	       cclass.id());
	    
    	    var filter_accordion_attrs = {
    		id: filters_div_id
    	    };
    	    filter_accordion_widget = // heavy lifting by special widget
    	    new bbop.html.accordion([], filter_accordion_attrs, true);
	    
    	    // Add the sections with no contents as a skeleton to be
    	    // filled by draw_accordion.
    	    var field_list = cclass.field_order_by_weight('filter');
    	    each(field_list,
    		 function(in_field){
    		     ll('saw field: ' + in_field);
    		     var ifield = cclass.get_field(in_field);
    		     var in_attrs = {
    			 id: in_field,
    			 label: ifield.display_name(),
    			 description: ifield.description()
    		     };
    		     filter_accordion_widget.add_to(in_attrs, '', true);
    		 });
	
    	    // Add the output from the accordion to the page.
    	    var accordion_str = filter_accordion_widget.to_string();
    	    jQuery('#' + container_div_id).append(accordion_str);

    	    // Add the jQuery accordioning.
    	    var jqacc_attrs = {
    		clearStyle: true,
    		heightStyle: 'content',
    		collapsible: true,
    		active: false
    	    };
    	    jQuery("#" + filters_div_id).accordion(jqacc_attrs);
	};
	if( this._display_accordion_p ){
	    this.setup_current_filters();
	    this.setup_sticky_filters();
	    this.setup_accordion();
	}

	///
    	// /// Things to do on every reset event. Essentially re-draw
    	// /// everything.
	// ///

    	// if( show_searchbox_p ){ // conditionally display search box stuff
    	//     anchor.register('reset', 'reset_query', anchor.ui.reset_query, -1);
	// }
    	// if( show_filterbox_p ){ // conditionally display filter stuff
    	//     anchor.register('reset', 'sticky_first',
    	// 		    anchor.ui.draw_sticky_filters, -1);
    	//     anchor.register('reset', 'curr_first',
    	// 		    anchor.ui.draw_current_filters, -1);
    	//     anchor.register('reset', 'accordion_first',
    	// 		    anchor.ui.draw_accordion, -1);
    	// }
    	// // We're always showing meta and results.
    	// anchor.register('reset', 'meta_first', anchor.ui.draw_meta, -1);
    	// anchor.register('reset', 'results_first', anchor.ui.draw_results, -1);
	
	// // Finally, we're going to add a first run behavior here.
	// // We'll wrap the user-defined function into a 
	// function _initial_runner(response, manager){
	//     // I can't just remove the callback from the register
	//     // after the first run because it would be reconstituted
	//     // every time it was reset (established).
	//     if( anchor.initial_reset_p ){
	// 	anchor.initial_reset_p = false;
	// 	anchor.initial_reset_callback(response, manager);
	// 	//ll('unregister: ' + anchor.unregister('reset', 'first_run'));
	//     }
	// }
    	// anchor.register('reset', 'initial_reset', _initial_runner, -100);

	// ///
    	// /// Things to do on every search event.
	// ///

    	// if( show_searchbox_p ){ // conditionally display search box stuff
	//     // TODO: I worry a little about this being rebound after
	//     // every keyboard event, but rationally, considering the
	//     // rebinds and redraws that are happening down in the
	//     // accordion, that seems a little silly.
    	//     anchor.register('search', 'draw_query', anchor.ui.draw_query, -1);
	// }
    	// if( show_filterbox_p ){ // conditionally display filter stuff
    	//     anchor.register('search','sticky_filters_std',
    	// 		    anchor.ui.draw_sticky_filters);
    	//     anchor.register('search','curr_filters_std',
    	// 		    anchor.ui.draw_current_filters);
    	//     anchor.register('search', 'accordion_std',
	// 		    anchor.ui.draw_accordion);
    	// }
    	// // These will always be updated after a search.
    	// anchor.register('search', 'meta_usual', anchor.ui.draw_meta);
    	// anchor.register('search', 'results_usual', anchor.ui.draw_results);
	
    	// // Things to do on an error.
    	// anchor.register('error', 'results_unusual', anchor.ui.draw_error);	
	
    	// // Setup the gross frames for the filters and results.
    	// if( show_searchbox_p ){ // conditionally display search box stuff
    	//     anchor.ui.setup_query('Free-text filtering',
	// 			  icon_clear_label,
	// 			  icon_clear_source);
	// }
    	// if( show_filterbox_p ){ // conditionally display filter stuff
    	//     anchor.ui.setup_sticky_filters();
    	//     anchor.ui.setup_current_filters(icon_remove_label,
	// 				    icon_remove_source);
    	//     anchor.ui.setup_accordion(icon_positive_label,
	// 			      icon_positive_source,
	// 			      icon_negative_label,
	// 			      icon_negative_source,
	// 			      spinner_shield_source,
	// 			      spinner_shield_message);
	// }
    	// anchor.ui.setup_results({'meta': show_pager_p,
	// 			 'spinner_source': spinner_search_source});
	
    	// // // Start the ball with a reset event.
    	// //anchor.reset();

	// The display has been established.
	anchor._established_p = true;
    };

    // /*
    //  * Function: draw_meta
    //  *
    //  * Draw meta results. Includes selector for drop down.
    //  * 
    //  * (Re)draw the count control with the current information in the
    //  * manager. This also tries to set the selector to the response
    //  * number (to keep things in sync), unbinds any current "change"
    //  * event, and adds a new change event.
    //  * 
    //  * Parameters:
    //  *  response - the <bbop.golr.response> returned from the server
    //  *  manager - <bbop.golr.manager> that we initially registered with
    //  *
    //  * Returns:
    //  *  n/a
    //  */
    // this.draw_meta = function(response, manager){
	
    // 	ll('draw_meta for: ' + ui_meta_div_id);

    // 	///
    // 	/// Section 1: the numbers display.
    // 	///

    // 	// Collect numbers for display.
    // 	var total_c = response.total_documents();
    // 	var first_d = response.start_document();
    // 	var last_d = response.end_document();

    // 	// Draw meta; the current numbers and page--the same for
    // 	// every type of return.
    // 	jQuery('#' + ui_meta_div_id).empty();
    // 	if( total_c == 0 ){
    // 	    jQuery('#' + ui_meta_div_id).append('No results found.');
    // 	}else{

    // 	    // A div for the literal meta results and the count
    // 	    // selector next to them.
    // 	    var mdiv_attrs = {
    // 	    };
    // 	    var mdiv = new bbop.html.tag('div', mdiv_attrs);

    // 	    // The literal return metadata.
    // 	    var dmeta_attrs = {
    // 		'class': 'bbop-js-search-pane-meta'
    // 	    };
    // 	    var dmeta = new bbop.html.tag('div', dmeta_attrs);
    // 	    dmeta.add_to('Total: ' + total_c +
    // 			 '; showing ' + first_d +
    // 			 '-' + last_d);
    // 	    mdiv.add_to(dmeta);

    // 	    ///
    // 	    /// Section 2: results count.
    // 	    ///

    // 	    // Create inputs (the current order is important for proper
    // 	    // for/id creation).
    // 	    var cinputs = [];
    // 	    each([10, 25, 50, 100],
    // 		 function(num, cindex){
    // 		     // Create and store the option.
    // 		     var sel_input_attrs = {
    // 			 'generate_id': true,
    // 			 'value': num
    // 		     };
    // 		     var sel_input =
    // 			 new bbop.html.tag('option', sel_input_attrs, num);
    // 		     var sel_input_id = sel_input.get_id();
    // 		     cinputs.push(sel_input);
    // 		 });
    // 	    // Option container div.
    // 	    var sel_attrs = {
    // 		'id': ui_count_control_div_id
    // 	    };
    // 	    var sel = new bbop.html.tag('select', sel_attrs, cinputs);
	    
    // 	    // Create a text label.
    // 	    var sel_label_attrs = {
    // 		// 'generate_id': true,
    // 		// 'class': 'bbop-widget-search_pane-spinner-element'
    // 	    };
    // 	    var sel_label = new bbop.html.tag('label', sel_label_attrs,
    // 					      'Results count&nbsp;&nbsp;');
	    
    // 	    // Container div.
    // 	    var sel_div_attrs = {
    // 		'generate_id': true,
    // 		'class': 'bbop-js-search-pane-results-count'
    // 	    };
    // 	    var sel_div = new bbop.html.tag('div', sel_div_attrs);
	    
    // 	    // Assemble these elements into the UI.
    // 	    sel_div.add_to(sel_label);
    // 	    sel_div.add_to(sel);
    // 	    mdiv.add_to(sel_div);

    // 	    // Render out the last two sections.
    // 	    jQuery('#' + ui_meta_div_id).append(mdiv.to_string());
	    
    // 	    ///
    // 	    /// Section 3: results count activity, setting.
    // 	    ///

    // 	    // First, unbind so we don't accidentally trigger with any
    // 	    // changes and don't pile up event handlers.
    // 	    jQuery('#' + ui_count_control_div_id).unbind('change');

    // 	    // Next, pull out the number of rows requested.
    // 	    var step = response.row_step();
	    
    // 	    // Set the value to the number.
    // 	    jQuery('#' + ui_count_control_div_id).val(step);
	    
    // 	    // Finally, reactivate the event handler on the select.
    // 	    jQuery('#' + ui_count_control_div_id).change(
    // 		function(event, ui){
    // 		    var sv = jQuery('#' + ui_count_control_div_id).val();
    // 		    if( bbop.core.is_defined(sv) ){
    // 			// Convert to a number.
    // 			var si = parseInt(sv);
			
    // 			// Set manager and to the search.
    // 			manager.set_results_count(si);
    // 			manager.search();
    // 			// We are now searching--show it.
    // 			_spin_up();
    // 		    }
    // 		});

    // 	    ///
    // 	    /// Section 4: the paging buttons.
    // 	    ///
	    
    // 	    var bdiv_attrs = {
    // 		'generate_id': true
    // 	    };
    // 	    var bdiv = new bbop.html.tag('div', bdiv_attrs);
    // 	    jQuery('#' + ui_meta_div_id).append(bdiv.to_string());
    // 	    var bdiv_id = bdiv.get_id();

    // 	    // Now add the raw buttons to the interface, and after this,
    // 	    // activation and adding events.
    // 	    var b_first = new bbop.html.button('First', {'generate_id': true});
    // 	    //jQuery('#' + ui_meta_div_id).append(b_first.to_string());
    // 	    jQuery('#' + bdiv_id).append(b_first.to_string());
    // 	    var b_back = new bbop.html.button('Prev', {'generate_id': true});
    // 	    //jQuery('#' + ui_meta_div_id).append(b_back.to_string());
    // 	    jQuery('#' + bdiv_id).append(b_back.to_string());
    // 	    var b_forward = new bbop.html.button('Next', {'generate_id': true});
    // 	    //jQuery('#' + ui_meta_div_id).append(b_forward.to_string());
    // 	    jQuery('#' + bdiv_id).append(b_forward.to_string());
    // 	    var b_last = new bbop.html.button('Last', {'generate_id': true});
    // 	    //jQuery('#' + ui_meta_div_id).append(b_last.to_string());
    // 	    jQuery('#' + bdiv_id).append(b_last.to_string());

    // 	    // Do the math about what buttons to activate.
    // 	    var b_first_disabled_p = false;
    // 	    var b_back_disabled_p = false;
    // 	    var b_forward_disabled_p = false;
    // 	    var b_last_disabled_p = false;
	    
    // 	    // Only activate paging if it is necessary to the returns.
    // 	    if( ! response.paging_p() ){
    // 		b_first_disabled_p = true;
    // 		b_back_disabled_p = true;
    // 		b_forward_disabled_p = true;
    // 		b_last_disabled_p = true;
    // 	    }
	    
    // 	    // Don't activate back on the first page.
    // 	    if( ! response.paging_previous_p() ){
    // 		b_first_disabled_p = true;
    // 		b_back_disabled_p = true;
    // 	    }
	    
    // 	    // Don't activate next on the last page.
    // 	    if( ! response.paging_next_p() ){
    // 		b_forward_disabled_p = true;
    // 		b_last_disabled_p = true;
    // 	    }
	    
    // 	    // First page button.
    // 	    var b_first_props = {
    // 		icons: { primary: "ui-icon-seek-first"},
    // 		disabled: b_first_disabled_p,
    // 		text: false
    // 	    };
    // 	    jQuery('#' + b_first.get_id()).button(b_first_props).click(
    // 		function(){
    // 		    // Cheat and trust reset by proxy to work.
    // 		    manager.page_first(); 
    // 		    // We are now searching--show it.
    // 		    _spin_up();
    // 		});
	    
    // 	    // Previous page button.
    // 	    var b_back_props = {
    // 		icons: { primary: "ui-icon-seek-prev"},
    // 		disabled: b_back_disabled_p,
    // 		text: false
    // 	    };
    // 	    jQuery('#' + b_back.get_id()).button(b_back_props).click(
    // 		function(){
    // 		    manager.page_previous();
    // 		    // We are now searching--show it.
    // 		    _spin_up();
    // 		});
	    
    // 	    // Next page button.
    // 	    var b_forward_props = {
    // 		icons: { primary: "ui-icon-seek-next"},
    // 		disabled: b_forward_disabled_p,
    // 		text: false
    // 	    };
    // 	    jQuery('#' + b_forward.get_id()).button(b_forward_props).click(
    // 		function(){
    // 		    manager.page_next();
    // 		    // We are now searching--show it.
    // 		    _spin_up();
    // 		});
	    
    // 	    // Last page button.
    // 	    var b_last_props = {
    // 		icons: { primary: "ui-icon-seek-end"},
    // 		disabled: b_last_disabled_p,
    // 		text: false
    // 	    };
    // 	    jQuery('#' + b_last.get_id()).button(b_last_props).click(
    // 		function(){
    // 		    // A little trickier.
    // 		    manager.page_last(total_c);
    // 		    // We are now searching--show it.
    // 		    _spin_up();
    // 		});
	    
    // 	    ///
    // 	    /// Section 5: the button_definition buttons.
    // 	    ///

    // 	    // Spacer.	    
    // 	    // jQuery('#' + ui_meta_div_id).append('&nbsp;&nbsp;&nbsp;' +
    // 	    // 					'&nbsp;&nbsp;&nbsp;');
    // 	    jQuery('#'+ bdiv_id).append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');

    // 	    // (R)establish the user button div to the end of the meta
    // 	    // retults.
    // 	    var ubuttons = new bbop.html.tag('span',
    // 					     {'id': ui_user_button_div_id});
    // 	    //jQuery('#' + ui_meta_div_id).append(ubuttons.to_string());
    // 	    jQuery('#' + bdiv_id).append(ubuttons.to_string());

    // 	    // Add all of the defined buttons after the spacing.
    // 	    anchor.draw_user_buttons(manager);
    // 	}
    // };

    // // Detect whether or not a keyboard event is ignorable.
    // function _ignorable_event(event){

    // 	var retval = false;

    // 	if( event ){
    // 	    var kc = event.keyCode;
    // 	    if( kc ){
    // 		if( kc == 39 || // right
    //                 kc == 37 || // left
    //                 kc == 32 || // space
    //                 kc == 20 || // ctl?
    //                 kc == 17 || // ctl?
    //                 kc == 16 || // shift
    //                 //kc ==  8 || // delete
    //                 kc ==  0 ){ // super
    // 			ll('ignorable key event: ' + kc);
    // 			retval = true;
    // 		    }
    //         }
    // 	}
    // 	return retval;
    // }

    // /*
    //  * Function: draw_query
    //  *
    //  * Draw the query widget. This function makes it active
    //  * as well.
    //  * 
    //  * Clicking the reset button will reset the query to ''.
    //  * 
    //  * NOTE: Since this is part of the "persistant" interface (i.e. it
    //  * does not get wiped after every call), we make sure to clear the
    //  * event listeners when we redraw the function to prevent them from
    //  * building up.
    //  * 
    //  * Parameters:
    //  *  response - the <bbop.golr.response> returned from the server
    //  *  manager - <bbop.golr.manager> that we initially registered with
    //  *
    //  * Returns:
    //  *  n/a
    //  */
    // this.draw_query = function(response, manager){

    // 	ll('draw_query for: ' + ui_query_input_id);

    // 	// Add a smartish listener.
    // 	jQuery('#' + ui_query_input_id).unbind('keyup');
    // 	jQuery('#' + ui_query_input_id).keyup(
    // 	    function(event){

    // 		// If we're left with a legitimate event, handle it.
    // 		if( ! _ignorable_event(event) ){

    // 		    // Can't ignore it anymore, so it goes into the
    // 		    // manager for testing.
    // 		    var tmp_q = manager.get_query();
    // 		    var input_text = jQuery(this).val();
    // 		    manager.set_query(input_text);

    // 		    // If the manager feels like it's right, trigger.
    // 		    if( manager.sensible_query_p() ){
    // 			ll('keeping set query: ' + input_text);
    // 			// Set the query to be more "usable" just
    // 			// before triggering (so the tests can't be
    // 			// confused by our switch).
    // 			manager.set_comfy_query(input_text);
    // 			manager.search();

    // 			// We are now searching--show it.
    // 			_spin_up();
    // 		    }else{
    // 			ll('rolling back query: ' + tmp_q);		    
    // 			manager.set_query(tmp_q);
    // 		    }
    // 		}
    // 	    });

    // 	// Now reset the clear button and immediately set the event.
    // 	jQuery('#' + ui_clear_query_span_id).unbind('click');
    // 	jQuery('#' + ui_clear_query_span_id).click(
    // 	    function(){
    // 		manager.reset_query();
    // 		//anchor.set_query_field(manager.get_query());
    // 		anchor.set_query_field('');
    // 		manager.search();
    // 		// We are now searching--show it.
    // 		_spin_up();
    // 	    });
    // };

    // /*
    //  * Function: reset_query
    //  *
    //  * Simply reset the query and then redraw (rebind) the query.
    //  * 
    //  * Parameters:
    //  *  response - the <bbop.golr.response> returned from the server
    //  *  manager - <bbop.golr.manager> that we initially registered with
    //  *
    //  * Returns:
    //  *  n/a
    //  * 
    //  * See:
    //  *  <draw_query>
    //  */
    // this.reset_query = function(response, manager){

    // 	ll('reset_query for: ' + ui_query_input_id);

    // 	// Reset manager back to the default.
    // 	manager.reset_query();

    // 	anchor.draw_query(response, manager);
    // };

    // /*
    //  * Function: draw_sticky_filters
    //  *
    //  * (Re)draw the information on the sticky filter set.
    //  * 
    //  * Parameters:
    //  *  response - the <bbop.golr.response> returned from the server
    //  *  manager - <bbop.golr.manager> that we initially registered with
    //  *
    //  * Returns:
    //  *  n/a
    //  */
    // this.draw_sticky_filters = function(response, manager){
    
    // 	ll('draw_sticky_filters for: ' + ui_div_id);

    // 	// Add in the actual HTML for the pinned filters and buttons.
    // 	var sticky_query_filters = manager.get_sticky_query_filters();
    // 	ll('sticky filters: ' + bbop.core.dump(sticky_query_filters));
    // 	var fq_list_tbl =
    // 	    new bbop.html.table(['', 'Your search is pinned to these filters'],
    // 				[],
    // 			       	{'class': 'bbop-js-search-pane-filter-table'});
    // 	// [{'filter': A, 'value': B, 'negative_p': C, 'sticky_p': D}, ...]
    // 	each(sticky_query_filters,
    // 	     function(fset){

    // 		 //
    // 		 var sfield = fset['filter'];
    // 		 var sfield_val = fset['value'];

    // 		 // Boolean value to a character.
    // 		 var polarity = fset['negative_p'];
    // 		 var polstr = '+';
    // 		 if( polarity ){ polstr = '-'; }

    // 		 // Generate a button with a unique id.
    // 		 var label_str = polstr + ' ' + sfield + ':' + sfield_val;
    // 		 fq_list_tbl.add_to(['<b>'+ polstr +'</b>',
    // 				     sfield + ': ' + sfield_val]);
    // 	     });
	
    // 	// Either add to the display, or display the "empty" message.
    // 	var sfid = '#' + ui_sticky_filters_div_id;
    // 	jQuery(sfid).empty();
    // 	if( sticky_query_filters.length == 0 ){
    // 	    jQuery(sfid).append("No sticky filters.");
    // 	}else{
    // 	    // Attach to the DOM...
    // 	    jQuery(sfid).append(fq_list_tbl.to_string());
    // 	}
    // };

    // /*
    //  * Function: draw_current_filters
    //  *
    //  * (Re)draw the information on the current filter set.
    //  * This function makes them active as well.
    //  * 
    //  * Parameters:
    //  *  response - the <bbop.golr.response> returned from the server
    //  *  manager - <bbop.golr.manager> that we initially registered with
    //  *
    //  * Returns:
    //  *  n/a
    //  */
    // this.draw_current_filters = function(response, manager){
    
    // 	ll('draw_current_filters for: ' + ui_div_id);

    // 	///
    // 	/// Add in the actual HTML for the filters and buttons. While
    // 	/// doing so, tie a unique id to the filter--we'll use that
    // 	/// later on to add buttons and events to them.
    // 	///

    // 	// First, we need to make the filter clear button for the top
    // 	// of the table.
    // 	var b_cf =
    // 	    new bbop.widget.display.text_button_sim('X', 
    // 						    'Clear all user filters',
    // 						    ui_clear_user_filter_span_id);

    // 	var in_query_filters = response.query_filters();
    // 	//var sticky_query_filters = manager.get_sticky_query_filters();
    // 	ll('filters: ' + bbop.core.dump(in_query_filters));
    // 	var fq_list_tbl =
    // 	    new bbop.html.table(['', 'User filters', b_cf.to_string()],
    // 				[],
    // 			       	{'class': 'bbop-js-search-pane-filter-table'});
    // 	var has_fq_p = false; // assume there are no filters to begin with
    // 	var button_hash = {};
    // 	each(in_query_filters,
    // 	     function(field, field_vals){
    // 		 each(field_vals,
    // 		      function(field_val, polarity){

    // 			  // Make note of stickiness, skip adding if sticky.
    // 			  var qfp =
    // 			      manager.get_query_filter_properties(field,
    // 								  field_val);
    // 			  if( ! qfp || qfp['sticky_p'] == false ){
			  
    // 			      // Note the fact that we actually have a
    // 			      // query filter to work with and display.
    // 			      has_fq_p = true;

    // 			      // Boolean value to a character.
    // 			      var polstr = '-';
    // 			      if( polarity ){ polstr = '+'; }

    // 			      // Generate a button with a unique id.
    // 			      var label_str = polstr+' '+ field +':'+field_val;

    // 			      // Argh! Real jQuery buttons are way too slow!
    // 			      // var b = new bbop.html.button('remove filter',
    // 			      // 		  {'generate_id': true});

    // 			      // Is the "button" a span or an image?
    // 			      var b = bbop.widget.display.clickable_object(
    // 				  ui_icon_remove_label,
    // 				  ui_icon_remove_source,
    // 				  null); // generate_id

    // 			      // Tie the button it to the filter for
    // 			      // jQuery and events attachment later on.
    // 			      var bid = b.get_id();
    // 			      button_hash[bid] = [polstr, field, field_val];
			  
    // 			      //ll(label_str +' '+ bid);
    // 			      //fq_list_tbl.add_to(label_str +' '+ b.to_string());
    // 			      fq_list_tbl.add_to(['<b>'+ polstr +'</b>',
    // 						  field + ': ' + field_val,
    // 						  b.to_string()]);
    // 			      //label_str +' '+ b.to_string());
    // 			  }
    // 		      });
    // 	     });

    // 	// Either add to the display, or display the "empty" message.
    // 	var cfid = '#' + ui_current_filters_div_id;
    // 	jQuery(cfid).empty();
    // 	if( ! has_fq_p ){
    // 	    jQuery(cfid).append("No current user filters.");
    // 	}else{

    // 	    // With this, the buttons will be attached to the
    // 	    // DOM...
    // 	    jQuery(cfid).append(fq_list_tbl.to_string());
	    
    // 	    // First, lets add the reset for all of the filters.
    // 	    jQuery('#' + b_cf.get_id()).click(
    // 		function(){
    //    		    manager.reset_query_filters();
    //    		    manager.search();
    // 		    // We are now searching--show it.
    // 		    _spin_up();
    // 		}		
    // 	    );

    // 	    // Now let's go back and add the buttons, styles,
    // 	    // events, etc. to the filters.
    // 	    each(button_hash,
    // 		 function(button_id){
    // 		     var bid = button_id;

    // 		     // // Get the button.
    // 		     // var bprops = {
    // 		     // 	 icons: { primary: "ui-icon-close"},
    // 		     // 	 text: false
    // 		     // };
    // 		     // Create the button and immediately add the event.
    // 		     //jQuery('#' + bid).button(bprops).click(
    // 		     jQuery('#' + bid).click(
    // 			 function(){
    // 			     var tid = jQuery(this).attr('id');
    // 			     var button_props = button_hash[tid];
    // 			     var polstr = button_props[0];
    // 			     var field = button_props[1];
    // 			     var value = button_props[2];

    // 			     // Change manager and fire.
    // 			     // var lstr = polstr +' '+ field +' '+ value;
    // 			     // alert(lstr);
    // 			     // manager.remove_query_filter(field,value,
    // 			     // 				 [polstr, '*']);
    // 			     manager.remove_query_filter(field, value);
    // 			     manager.search();
    // 			     // We are now searching--show it.
    // 			     _spin_up();
    // 			 });
    // 		 });
    // 	}
    // };

    // /*
    //  * Function: draw_accordion
    //  *
    //  * (Re)draw the information in the accordion controls/filters.
    //  * This function makes them active as well.
    //  * 
    //  * Parameters:
    //  *  response - the <bbop.golr.response> returned from the server
    //  *  manager - <bbop.golr.manager> that we initially registered with
    //  *
    //  * Returns:
    //  *  n/a
    //  */
    // this.draw_accordion = function(response, manager){
    
    // 	ll('draw_accordion for: ' + ui_div_id);

    // 	// Make sure that accordion has already been inited.
    // 	if( typeof(filter_accordion_widget) == 'undefined' ){
    // 	    throw new Error('Need to init accordion to use it.');
    // 	}

    // 	// We'll need this in a little bit for calculating when to
    // 	// display the "more" option for the field filters.
    // 	var real_facet_limit = manager.get_facet_limit();
    // 	var curr_facet_limit = real_facet_limit -1; // the facets we'll show

    // 	// We want this so we can filter out any facets that have the
    // 	// same count as the current response total--these facets are
    // 	// pretty much information free.
    // 	var total_docs = response.total_documents();

    // 	// A helper function for when no filters are
    // 	// displayed.
    // 	function _nothing_to_see_here(in_field){
    // 	    var section_id = filter_accordion_widget.get_section_id(in_field);
    // 	    jQuery('#' + section_id).empty();
    // 	    jQuery('#' + section_id).append('Nothing to filter.');
    // 	}

    // 	// Hash where we collect our button information.
    // 	// button_id -> [source, filter, count, polarity];
    // 	var button_hash = {};

    // 	// And a hash to store information to be able to generate the
    // 	// complete filter shields.
    // 	// span_id -> filter_id
    // 	var overflow_hash = {};

    // 	// Cycle through each facet field; all the items in each,
    // 	// create the lists and buttons (while collectong data useful
    // 	// in creating the callbacks) and put them into the accordion.
    // 	each(response.facet_field_list(),
    // 	     function(in_field){

    // 		 var facet_bd = response.facet_field(in_field);
    // 		 if( bbop.core.is_empty(facet_bd) ){
		     
    // 		     // No filters means nothing in the box.
    // 		     _nothing_to_see_here(in_field);

    // 		 }else{
		     
    // 		     // Create ul lists of the facet contents.
    // 		     var tbl_id = mangle + 'filter-list-' + in_field;
    // 		     var facet_list_tbl_attrs = {
    // 			 id: tbl_id
    // 		     };

    // 		     var facet_list_tbl =
    // 			 new bbop.html.table([], [], facet_list_tbl_attrs);
		     
    // 		     ll("consider:" + in_field + ": " +
    // 			response.facet_field(in_field).length);

    // 		     // BUG/TODO:
    // 		     // Count the number of redundant (not shown)
    // 		     // facets so we can at least give a face to this
    // 		     // bug/problem.
    // 		     // Also filter out "empty filters".
    // 		     var redundant_count = 0;
    // 		     // Now go through and get filters and counts.
    // 		     var good_count = 0; // only count when good
    // 		     var overflow_p = false; // true when at 24 -> 25
    // 		     each(response.facet_field(in_field),
    // 			  function(ff_field, ff_index){

    // 			      // Pull out info early so we can test it
    // 			      // for information content.
    // 			      var f_name = ff_field[0];
    // 			      var f_count = ff_field[1];
			      
    // 			      // ll(in_field + ": " + f_name + ": " +
    // 			      // 	 [f_count,
    // 			      // 	  total_docs,
    // 			      // 	  ff_index,
    // 			      // 	  good_count,
    // 			      // 	  redundant_count,
    // 			      // 	  real_facet_limit].join(', '));
			      			      
    // 			      // TODO: The field is likely redundant
    // 			      // (BUG: not always true in closures),
    // 			      // so eliminate it.
    // 			      if( f_count == total_docs ){
    // 				  //ll("\tnothing here");
    // 				  redundant_count++;
    // 			      }else if( ! f_name || f_name == "" ){
    // 				  // Straight out skip if it is an
    // 				  // "empty" facet field.
    // 			      }else if( ff_index < real_facet_limit -1 ){
    // 				  //ll("\tgood row");
    // 				  good_count++;

    // 				  // Create buttons and store them for later
    // 				  // activation with callbacks to
    // 				  // the manager.
    // 				  var b_plus =
    // 				      bbop.widget.display.clickable_object(
    // 					  ui_icon_positive_label,
    // 					  ui_icon_positive_source,
    // 					  null); // generate_id
    // 				  var b_minus =
    // 				      bbop.widget.display.clickable_object(
    // 					  ui_icon_negative_label,
    // 					  ui_icon_negative_source,
    // 					  null); // generate_id
				  
    // 				  // Store in hash for later keying to
    // 				  // event.
    // 				  button_hash[b_plus.get_id()] =
    // 				      [in_field, f_name, f_count, '+'];
    // 				  button_hash[b_minus.get_id()] =
    // 				      [in_field, f_name, f_count, '-'];
				  
    // 				  // // Add the label and buttons to the
    // 				  // // appropriate ul list.
    // 				  //facet_list_ul.add_to(
    // 				  // fstr,b_plus.to_string(),
    // 				  //   b_minus.to_string());
    // 				  // Add the label and buttons to the table.
    // 				  facet_list_tbl.add_to([f_name,
    // 							 '('+ f_count+ ')',
    // 							 b_plus.to_string(),
    // 							 b_minus.to_string()
    // 							]);
    // 			      }
			
    // 			      // This must be logically separated from
    // 			      // the above since we still want to show
    // 			      // more even if all of the top 25 are
    // 			      // redundant.
    // 			      if( ff_index == real_facet_limit -1 ){
    // 				  // Add the more button if we get up to
    // 				  // this many facet rows. This should
    // 				  // only happen on the last possible
    // 				  // iteration.
				  
    // 				  overflow_p = true;
    // 				  //ll( "\tadd [more]");
				  
    // 				  // Since this is the overflow item,
    // 				  // add a span that can be clicked on
    // 				  // to get the full filter list.
    // 				  //ll("Overflow for " + in_field);
    // 				  var bgn = bbop.widget.display.text_button_sim;
    // 				  var b_over =
    // 				      new bgn('more...',
    // 					      'Display the complete list');
    // 				  facet_list_tbl.add_to([b_over.to_string(),
    // 				  			 '', '']);
    // 				  overflow_hash[b_over.get_id()] = in_field;
    // 			      }
    // 			  });

    // 		     // There is a case when we have filtered out all
    // 		     // avilable filters (think db source).
    // 		     if( good_count == 0 && ! overflow_p ){
    // 			 _nothing_to_see_here(in_field);
    // 		     }else{
    // 			 // Otherwise, now add the ul to the
    // 			 // appropriate section of the accordion in
    // 			 // the DOM.
    // 			 var sect_id =
    // 			     filter_accordion_widget.get_section_id(in_field);
    // 			 jQuery('#' + sect_id).empty();

    // 			 // TODO/BUG:
    // 			 // Give warning to the redundant facets.
    // 			 var warn_txt = null;
    // 			 if( redundant_count == 1 ){
    // 			     warn_txt = "field is";
    // 			 }else if( redundant_count > 1 ){
    // 			     warn_txt = "fields are";
    // 			 }
    // 			 if( warn_txt ){
    // 			     jQuery('#' + sect_id).append(
    // 				 "<small> The top (" + redundant_count +
    // 				     ") redundant " + warn_txt + " not shown" +
    // 				     "</small>");
							  
    // 			 }

    // 			 // Add facet table.
    // 			 var final_tbl_str = facet_list_tbl.to_string();
    // 			 jQuery('#' + sect_id).append(final_tbl_str);
    // 		     }
    // 		 }
    // 	     });

    // 	// Okay, now introducing a function that we'll be using a
    // 	// couple of times in our callbacks. Given a button id (from
    // 	// a button hash) and the [field, filter, count, polarity]
    // 	// values from the props, make a button-y thing an active
    // 	// filter.
    // 	function filter_select_live(button_id, create_time_button_props){
    // 	    //var bid = button_id;
    // 	    //var in_field = create_time_button_props[0];	 
    // 	    //var in_filter = create_time_button_props[1];
    // 	    //var in_count = create_time_button_props[2];
    // 	    var in_polarity = create_time_button_props[3];

    // 	    // Decide on the button graphical elements.
    // 	    var b_ui_icon = 'ui-icon-plus';
    // 	    if( in_polarity == '-' ){
    // 		b_ui_icon = 'ui-icon-minus';
    // 	    }
    // 	    var b_ui_props = {
    // 		icons: { primary: b_ui_icon},
    // 		text: false
    // 	    };

    // 	    // Create the button and immediately add the event.
    // 	    //jQuery('#' + button_id).button(b_ui_props).click(
    // 	    jQuery('#' + button_id).click(
    // 		function(){
    // 		    var tid = jQuery(this).attr('id');
    // 		    var call_time_button_props = button_hash[tid];
    // 		    var call_field = call_time_button_props[0];	 
    // 		    var call_filter = call_time_button_props[1];
    // 		    //var in_count = button_props[2];
    // 		    var call_polarity = call_time_button_props[3];
		    
    // 		    // Change manager and fire.
    // 		    // var bstr =call_field+' '+call_filter+' '+call_polarity;
    // 		    // alert(bstr);
    // 		    manager.add_query_filter(call_field, call_filter,
    // 			  		     [call_polarity]);
    // 		    manager.search();
    // 		    // We are now searching--show it.
    // 		    _spin_up();
    // 		});
    // 	}

    // 	// Now let's go back and add the buttons, styles,
    // 	// events, etc. in the main accordion section.
    // 	each(button_hash, filter_select_live);

    // 	// Next, tie the events to the "more" spans.
    // 	each(overflow_hash,
    // 	     function(button_id, filter_name){
    // 		 jQuery('#' + button_id).click(

    // 		     // On click, set that one field to limitless in
    // 		     // the manager, setup a shield, and wait for the
    // 		     // callback.
    // 		     function(){

    // 			 // Recover the field name.
    // 			 var tid = jQuery(this).attr('id');
    // 			 var call_time_field_name = overflow_hash[tid];
    // 			 //alert(call_time_field_name);

    // 			 // Set the manager to no limit on that field and
    // 			 // only rturn the information that we want.
    // 			 manager.set_facet_limit(0);
    // 			 manager.set_facet_limit(call_time_field_name, -1);
    // 			 var curr_row = manager.get('rows');
    // 			 manager.set('rows', 0);

    // 			 // Create the shield and pop-up the
    // 			 // placeholder.
    // 			 var fs = bbop.widget.display.filter_shield;
    // 			 var filter_shield = new fs(ui_spinner_shield_source,
    // 						    ui_spinner_shield_message); 
    // 			 filter_shield.start_wait();

    // 			 // Open the populated shield.
    // 			 function draw_shield(resp){

    // 			    // ll("shield what: " + bbop.core.what_is(resp));
    // 			    // ll("shield resp: " + bbop.core.dump(resp));

    // 			     // First, extract the fields from the
    // 			     // minimal response.
    // 			     var fina = call_time_field_name;
    // 			     var flist = resp.facet_field(call_time_field_name);

    // 			     // Draw the proper contents of the shield.
    // 			     filter_shield.draw(fina, flist, manager);
    // 			 }
    // 			 manager.fetch(draw_shield);

    // 			 // Reset the manager to more sane settings.
    // 			 manager.reset_facet_limit();
    // 			 manager.set('rows', curr_row);
    // 		     });
    // 	     });

    // 	ll('Done current accordion for: ' + ui_div_id);
    // };

    // /*
    //  * Function: draw_error
    //  *
    //  * Somehow report an error to the user.
    //  * 
    //  * Parameters:
    //  *  error_message - a string(?) describing the error
    //  *  manager - <bbop.golr.manager> that we initially registered with
    //  *
    //  * Returns:
    //  *  n/a
    //  */
    // this.draw_error = function(error_message, manager){
    // 	ll("draw_error: " + error_message);
    // 	alert("Runtime error: " + error_message);
    // 	_spin_down();
    // };

    // /*
    //  * Function: set_query_field
    //  *
    //  * Set the text in the search query field box.
    //  * 
    //  * If no query is set, the field is cleared.
    //  * 
    //  * Parameters:
    //  *  query - *[optional]* string
    //  *
    //  * Returns:
    //  *  true or false on whether the task was accomplished
    //  */
    // this.set_query_field = function(query){
    // 	var retval = false;
    // 	if( ! query ){
    // 	    query = '';
    // 	}
    // 	if( jQuery('#' + ui_query_input_id) ){
    // 	    ll("changing query search field: to " + query);
    // 	    jQuery('#' + ui_query_input_id).val(query);
    // 	    //jQuery('#' + ui_query_input_id).keyup();
    // 	    retval = true;
    // 	}
    // 	return retval;
    // };
};
bbop.core.extend(bbop.widget.live_filters, bbop.golr.manager.jquery);
