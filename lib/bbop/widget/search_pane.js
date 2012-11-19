/*
 * Package: search_pane.js
 * 
 * Namespace: bbop.widget.search_pane
 * 
 * BBOP object to produce a self-constructing/self-destructing term
 * general filtering search tool for an index.
 * 
 * The function ".establish_display()" must be run *after* an initial
 * personality is set.
 * 
 * This is a completely self-contained UI and manager.
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
 * To actually do much useful, you should set the personality of the
 * widget.
 * 
 * Sticky filters (see manager documentation) are "hidden" from the
 * user in all displays.
 * 
 * The optional hash arguments look like:
 * 
 *  ??? - ???
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

    // Our argument default hash.
    var default_hash =
    	{
    	    'base_icon_url' : null,
    	    'image_type' : 'gif',
    	    'show_searchbox_p' : true,
    	    'show_filterbox_p' : true,
    	    'show_metadata_p' : true
    	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // Pull args into variables.
    var base_icon_url = arg_hash['base_icon_url'];
    var image_type = arg_hash['image_type'];
    var show_searchbox_p = arg_hash['show_searchbox_p'];
    var show_filterbox_p = arg_hash['show_filterbox_p'];
    var show_metadata_p = arg_hash['show_metadata_p'];

    /*
     * Function: establish_display
     * 
     * Completely redraw the display. May be useful after a major
     * change to the manager.
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
    	    ll('ERROR: no personality set');
    	    throw new Error('ERROR: no personality set');
    	}

    	///
    	/// Setup UI and bind it to events.
    	///
	
    	// Create a new two column layout and a lot of hidden switches
    	// and variables.
    	var ui = new bbop.widget.display.live_search(interface_id, cclass);
	
    	// Things to do on every reset event. Essentially re-draw
    	// everything.
    	if( show_searchbox_p ){ // conditionally display search box stuff
    	    anchor.register('reset', 'reset_query',
    			    ui.reset_query, -1);
    	    anchor.register('reset', 'rereset_button',
    			    ui.reset_reset_button,-1);
    	}
    	if( show_filterbox_p ){ // conditionally display filter stuff
    	    anchor.register('reset', 'curr_first',
    			    ui.draw_current_filters, -1);
    	    anchor.register('reset', 'accordion_first',
    			    ui.draw_accordion, -1);
    	}
    	// We're always showing meta and results.
    	anchor.register('reset', 'meta_first', ui.draw_meta, -1);
    	anchor.register('reset', 'results_first', ui.draw_results, -1);
	
    	// Things to do on every search event.
    	if( show_filterbox_p ){ // conditionally display filter stuff
    	    anchor.register('search','curr_filters_std',
    			    ui.draw_current_filters);
    	    anchor.register('search', 'accordion_std', ui.draw_accordion);
    	}
    	// These will always be updated after a search.
    	anchor.register('search', 'meta_usual', ui.draw_meta);
    	anchor.register('search', 'results_usual', ui.draw_results);
	
    	// Things to do on an error.
    	anchor.register('error', 'results_unusual', ui.draw_error);	
	
    	// Setup the gross frames for the filters and results.
    	ui.setup_query();
    	ui.setup_reset_button();
    	ui.setup_current_filters();
    	ui.setup_accordion();
    	ui.setup_results({'meta': show_metadata_p});
	
    	// Start the ball with a reset event.
    	anchor.reset();
    };

    // Now let's run the above function as the initializer.
    // anchor.establish_display();
};
bbop.core.extend(bbop.widget.search_pane, bbop.golr.manager.jquery);