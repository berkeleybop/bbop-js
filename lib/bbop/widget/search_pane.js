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
 *  show_global_reset_p - show the global reset button (default true)
 *  show_searchbox_p - show the search query box (default true)
 *  show_filterbox_p - show currents filters and accordion (default true)
 *  show_pager_p - show the results pager (default true)
 *  icon_clear_label - (default: '[clear search]')
 *  icon_clear_source - (default: '')
 *  icon_reset_label - (default: '[reset all user filters]')
 *  icon_reset_source - (default: '')
 *  icon_positive_label - (default: '<b>[&nbsp;+&nbsp;]</b>')
 *  icon_positive_source - (default: '')
 *  icon_negative_label - (default: '<b>[&nbsp;-&nbsp;]</b>')
 *  icon_negative_source - (default: '')
 *  icon_remove_label - (default: '<b>[&nbsp;X&nbsp;]</b>')
 *  icon_remove_source - (default: '')
 *  buttons -  a list of button definition hashes (default [])
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
    var loop = bbop.core.loop;
    var anchor = this;

    // We need to keep a handle on the live_search ui component so we
    // can manipulate the buttons after the fact.
    this.ui = null;

    // Our argument default hash.
    var default_hash =
    	{
    	    //'layout_type' : 'two-column',
    	    'show_global_reset_p' : true,
    	    'show_searchbox_p' : true,
    	    'show_filterbox_p' : true,
    	    'show_pager_p' : true,
	    'icon_clear_label': '<b>[clear search]</b>',
	    'icon_clear_source': '',
	    'icon_reset_label': '<b>[reset all user filters]</b>',
	    'icon_reset_source': '',
	    'icon_positive_label': '<b>[&nbsp;+&nbsp;]</b>',
	    'icon_positive_source': '',
	    'icon_negative_label': '<b>[&nbsp;-&nbsp;]</b>',
	    'icon_negative_source': '',
	    'icon_remove_label': '<b>[&nbsp;X&nbsp;]</b>',
	    'icon_remove_source': '',
	    'buttons' : []
    	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // Pull args into variables.
    //var base_icon_url = arg_hash['base_icon_url'];
    //var image_type = arg_hash['image_type'];
    //var layout_type = arg_hash['layout_type'];
    var show_global_reset_p = arg_hash['show_global_reset_p'];
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
    var button_defs = arg_hash['buttons'];

    /*
     * Function: establish_display
     * 
     * Completely redraw the display.
     * 
     * Required to display after setting up the manager.
     * 
     * Also may be useful after a major change to the manager.
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
	
    	// Create a new two column layout and a lot of hidden switches
    	// and variables.
    	// // var ui = null;
	// if( layout_type == 'two-column' ){
	anchor.ui = new bbop.widget.display.live_search(interface_id, cclass,
							button_defs);
	// }else{
    	//     throw new Error('ERROR: unsupported layout type: '+ layout_type);
	// }
	
    	// Things to do on every reset event. Essentially re-draw
    	// everything.
    	if( show_searchbox_p ){ // conditionally display search box stuff
    	    anchor.register('reset', 'reset_query', anchor.ui.reset_query, -1);
	}
    	if( show_global_reset_p ){ // conditionally show global reset button
    	    anchor.register('reset', 'global_reset_button',
    	    		    anchor.ui.reset_global_reset_button, -1);
    	}
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
    	    anchor.ui.setup_query('Search:&nbsp;',
				  icon_clear_label,
				  icon_clear_source);
	}
    	if( show_global_reset_p ){ // conditionally show global reset button
	    //anchor.ui.setup_global_reset_button();
	    anchor.ui.setup_global_reset_button(icon_reset_label,
						icon_reset_source);
	}
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
    };

    /*
     * Function: add_button
     * 
     * Add a user-defined button to the display.
     * 
     * NOTE: The button change will not appear until the next search
     * refresh.
     * 
     * Parameters:
     *  button_definition_hash - ""
     *
     * Returns
     *  n/a
     */
    this.add_button = function(button_definition_hash){
	anchor.ui.add_button(button_definition_hash);
	// And trigger a redraw of meta.
	anchor.ui.draw_user_buttons(anchor);
    };

    /*
     * Function: clear_buttons
     * 
     * Remove all user-defined buttons from the display.
     * 
     * NOTE: The button change will not appear until the next search
     * refresh.
     * 
     * Parameters:
     *  n/a
     *
     * Returns
     *  n/a
     */
    this.clear_buttons = function(){
	anchor.ui.clear_buttons();
	// And trigger a redraw of meta.
	anchor.ui.draw_user_buttons(anchor);
    };

    // // Now let's run the above function as the initializer.
    // anchor.establish_display();
};
bbop.core.extend(bbop.widget.search_pane, bbop.golr.manager.jquery);
