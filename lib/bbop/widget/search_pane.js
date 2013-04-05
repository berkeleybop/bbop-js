/*
 * Package: search_pane.js
 * 
 * Namespace: bbop.widget.search_pane
 * 
 * BBOP object to produce a self-constructing/self-destructing term
 * general filtering search tool for an index. This is a completely
 * self-contained UI and manager.
 * 
 * The function ".establish_display()" must be run *after* an initial
 * personality is set. Also, in many use cases, you'll want to have a
 * line like the following before running ".establish_display()":
 * sp_widget.add_query_filter('document_category', 'annotation',
 * ['*']);
 * 
 * Also, establish_display() literally just establishes the physical
 * presence of the display. To actually populate it with data once you
 * start, a seeding call to the .reset() or .search() is necessary.
 * 
 * The search pane will display one less filter row than is set with
 * .set_facet_limit(), it will use this runover to decide whether or
 * not to display the "more" option for the filters.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
//bbop.core.require('bbop', 'model');
//bbop.core.require('bbop', 'model', 'graph', 'bracket');
bbop.core.require('bbop', 'html');
bbop.core.require('bbop', 'golr', 'manager', 'jquery');
bbop.core.namespace('bbop', 'widget', 'search_pane');

/*
 * Constructor: search_pane
 * 
 * Contructor for the bbop.widget.search_pane object.
 * 
 * This is a specialized (and widgetized) subclass of
 * <bbop.golr.manager.jquery>.
 * 
 * Sticky filters (see manager documentation) are "hidden" from the
 * user in all displays.
 * 
 * The optional hash arguments look like:
 * 
 *  show_searchbox_p - show the search query box (default true)
 *  show_filterbox_p - show currents filters and accordion (default true)
 *  show_pager_p - show the results pager (default true)
 *  icon_clear_label - (default: text button based on 'X')
 *  icon_clear_source - (default: '')
 *  icon_reset_label - (default: text button based on 'X')
 *  icon_reset_source - (default: '')
 *  icon_positive_label - (default: text button based on '+')
 *  icon_positive_source - (default: '')
 *  icon_negative_label - (default: text button based on '-')
 *  icon_negative_source - (default: '')
 *  icon_remove_label - (default: text button based on 'X')
 *  icon_remove_source - (default: '')
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server; not needed if local
 *  golr_conf_obj - a <bbop.golr.conf> object
 *  interface_id - string id of the element to build on
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  self
 */
bbop.widget.search_pane = function(golr_loc, golr_conf_obj, interface_id,
				   in_argument_hash){

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('SP (widget): ' + str); }    

    bbop.golr.manager.jquery.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.widget.search_pane';
    // ll("what_is (post: this.update): " + bbop.core.what_is(this.update));

    // ...
    var anchor = this;

    // We need to keep a handle on the live_search ui component so we
    // can manipulate the buttons after the fact.
    this.ui = null;
    this.user_buttons = [];

    // It's also good to know if the display has actually been
    // established yet (e.g. the user-defined buttons being added
    // before can have the redraw not happen, since there is nothing
    // there yet and they will be draw naturally when the display
    // finally is.
    this.established_p = false;

    // A special set for a single run after the first reset.
    this.initial_reset_p = true;
    this.initial_reset_callback =
	function(response, manager){ ll('empty first run'); };

    // Our argument default hash.
    function _button_wrapper(str, title){
	var b = new bbop.widget.display.text_button_sim(str, title, '');
	return b.to_string();
    }
    var default_hash =
    	{
    	    //'layout_type' : 'two-column',
    	    'show_searchbox_p' : true,
    	    'show_filterbox_p' : true,
    	    'show_pager_p' : true,
	    'icon_clear_label': _button_wrapper('X', 'Clear text from query'),
	    'icon_clear_source': '',
	    'icon_reset_label': _button_wrapper('!','Reset user query filters'),
	    'icon_reset_source': '',
	    'icon_positive_label': _button_wrapper('+', 'Add positive filter'),
	    'icon_positive_source': '',
	    'icon_negative_label': _button_wrapper('-', 'Add negative filter'),
	    'icon_negative_source': '',
	    'icon_remove_label':_button_wrapper('X','Remove filter from query'),
	    'icon_remove_source': ''
    	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // Pull args into variables.
    //var base_icon_url = arg_hash['base_icon_url'];
    //var image_type = arg_hash['image_type'];
    //var layout_type = arg_hash['layout_type'];
    var show_searchbox_p = arg_hash['show_searchbox_p'];
    var show_filterbox_p = arg_hash['show_filterbox_p'];
    var show_pager_p = arg_hash['show_pager_p'];
    var icon_clear_label = arg_hash['icon_clear_label'];
    var icon_clear_source = arg_hash['icon_clear_source'];
    var icon_reset_label = arg_hash['icon_reset_label'];
    var icon_reset_source = arg_hash['icon_reset_source'];
    var icon_positive_label = arg_hash['icon_positive_label'];
    var icon_positive_source = arg_hash['icon_positive_source'];
    var icon_negative_label = arg_hash['icon_negative_label'];
    var icon_negative_source = arg_hash['icon_negative_source'];
    var icon_remove_label = arg_hash['icon_remove_label'];
    var icon_remove_source = arg_hash['icon_remove_source'];

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
	
    	// Blow away whatever was there completely.
    	jQuery('#' + interface_id).empty();

    	// Can only make a display if there is a set
    	// personality--there is no general default and it is an
    	// error.
    	var personality = anchor.get_personality();
    	var cclass = golr_conf_obj.get_class(personality);
    	if( ! personality || ! cclass ){
    	    ll('ERROR: no useable personality set');
    	    throw new Error('ERROR: no useable personality set');
    	}

    	///
    	/// Setup UI and bind it to events.
    	///
	
	anchor.ui = new bbop.widget.display.live_search(interface_id, cclass);

	// Try to add any buttons that we have loafing around into the
	// initial setup.
	anchor.ui.set_buttons(anchor.user_buttons);

    	// Things to do on every reset event. Essentially re-draw
    	// everything.
    	if( show_searchbox_p ){ // conditionally display search box stuff
    	    anchor.register('reset', 'reset_query', anchor.ui.reset_query, -1);
	}
    	// if( show_global_reset_p ){ // conditionally show global reset button
    	//     anchor.register('reset', 'global_reset_button',
    	//     		    anchor.ui.reset_global_reset_button, -1);
    	// }
    	if( show_filterbox_p ){ // conditionally display filter stuff
    	    anchor.register('reset', 'sticky_first',
    			    anchor.ui.draw_sticky_filters, -1);
    	    anchor.register('reset', 'curr_first',
    			    anchor.ui.draw_current_filters, -1);
    	    anchor.register('reset', 'accordion_first',
    			    anchor.ui.draw_accordion, -1);
    	}
    	// We're always showing meta and results.
    	anchor.register('reset', 'meta_first', anchor.ui.draw_meta, -1);
    	anchor.register('reset', 'results_first', anchor.ui.draw_results, -1);
	
	// Finally, we're going to add a first run behavior here.
	// We'll wrap the user-defined function into a 
	function _initial_runner(response, manager){
	    // I can't just remove the callback from the register
	    // after the first run because it would be reconstituted
	    // every time it was reset (established).
	    if( anchor.initial_reset_p ){
		anchor.initial_reset_p = false;
		anchor.initial_reset_callback(response, manager);
		//ll('unregister: ' + anchor.unregister('reset', 'first_run'));
	    }
	}
    	anchor.register('reset', 'initial_reset', _initial_runner, -100);

    	// Things to do on every search event.
    	if( show_filterbox_p ){ // conditionally display filter stuff
    	    anchor.register('search','sticky_filters_std',
    			    anchor.ui.draw_sticky_filters);
    	    anchor.register('search','curr_filters_std',
    			    anchor.ui.draw_current_filters);
    	    anchor.register('search', 'accordion_std',
			    anchor.ui.draw_accordion);
    	}
    	// These will always be updated after a search.
    	anchor.register('search', 'meta_usual', anchor.ui.draw_meta);
    	anchor.register('search', 'results_usual', anchor.ui.draw_results);
	
    	// Things to do on an error.
    	anchor.register('error', 'results_unusual', anchor.ui.draw_error);	
	
    	// Setup the gross frames for the filters and results.
    	//anchor.ui.setup_reset_button();
    	if( show_searchbox_p ){ // conditionally display search box stuff
    	    //anchor.ui.setup_query();
    	    //anchor.ui.setup_query('Search:&nbsp;',
    	    anchor.ui.setup_query('Filter:&nbsp;',
				  icon_clear_label,
				  icon_clear_source);
	}
    	// if( show_global_reset_p ){ // conditionally show global reset button
	//     //anchor.ui.setup_global_reset_button();
	//     anchor.ui.setup_global_reset_button(icon_reset_label,
	// 					icon_reset_source);
	// }
    	if( show_filterbox_p ){ // conditionally display filter stuff
    	    anchor.ui.setup_sticky_filters();
    	    //anchor.ui.setup_current_filters();
    	    //anchor.ui.setup_accordion();
    	    anchor.ui.setup_current_filters(icon_remove_label,
					    icon_remove_source);
    	    anchor.ui.setup_accordion(icon_positive_label,
				      icon_positive_source,
				      icon_negative_label,
				      icon_negative_source);
	}
    	anchor.ui.setup_results({'meta': show_pager_p});
	
    	// // Start the ball with a reset event.
    	//anchor.reset();

	// The display has been established.
	anchor.established_p = true;
    };

    /*
     * Function: add_button
     * 
     * Add a user-defined button to the display.
     * 
     * NOTE: Does not function until the display is established.
     * 
     * Parameters:
     *  button_definition_hash - ""
     *
     * Returns
     *  n/a
     */
    this.add_button = function(button_definition_hash){
	// Add to our locally stored buttons.
	anchor.user_buttons.push(button_definition_hash);

	if( anchor.established_p && anchor.ui ){
	    anchor.ui.set_buttons(anchor.user_buttons);
	    anchor.ui.draw_user_buttons(anchor);	    
	}
    };

     /*
     * Function: clear_buttons
     * 
     * Remove all user-defined buttons from the display.
     * 
     * NOTE: Does not function until the display is established.
     * 
     * Parameters:
     *  n/a
     *
     * Returns
     *  n/a
     */
    this.clear_buttons = function(){
	// Clear our locally stored buttons.
	anchor.user_buttons = [];

	if( anchor.established_p && anchor.ui ){
	    anchor.ui.set_buttons(anchor.user_buttons);
	    anchor.ui.draw_user_buttons(anchor);	    
	}
    };

    /*
     * Function: set_query_field_text
     * 
     * Push text into the search box.
     * 
     * NOTE: Does not function until the display is established.
     * 
     * Parameters:
     *  query - the text to put into the search box
     *
     * Returns
     *  true or false on whether the task was accomplished
     */
    this.set_query_field_text = function(query){
	var retval = false;	
	if( anchor.established_p && anchor.ui ){
	    retval = anchor.ui.set_query_field(query);
	}
	return retval;
    };

    /*
     * Function: set_initial_reset_callback
     * 
     * Add a callback to be run after the initial reset is finished.
     * 
     * Parameters:
     *  response - the usual
     *  manager - the usual
     *
     * Returns
     *  n/a
     */
    this.set_initial_reset_callback = function(callback){
	anchor.initial_reset_callback = callback;
    };

    // // Now let's run the above function as the initializer.
    // anchor.establish_display();
};
bbop.core.extend(bbop.widget.search_pane, bbop.golr.manager.jquery);
