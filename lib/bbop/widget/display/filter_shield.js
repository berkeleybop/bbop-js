/*
 * Package: filter_shield.js
 * 
 * Namespace: bbop.widget.display.filter_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing shield
 * to support very large filter selection in the live search/search
 * pane genre.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
//bbop.core.require('bbop', 'model');
//bbop.core.require('bbop', 'model', 'graph', 'bracket');
bbop.core.require('bbop', 'html');
bbop.core.require('bbop', 'golr', 'manager', 'jquery');
bbop.core.namespace('bbop', 'widget', 'display', 'filter_shield');

/*
 * Constructor: filter_shield
 * 
 * Contructor for the bbop.widget.display.filter_shield object.
 * 
 * Support for <bbop.widget.search_pane> by way of
 * <bbop.widget.display.live_search>
 * 
 * Arguments:
 *  spinner_img_src - *[optional]* optional source of a spinner image to use
 * 
 * Returns:
 *  self
 */
bbop.widget.display.filter_shield = function(spinner_img_src){

    this._is_a = 'bbop.widget.display.filter_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (filter_shield): ' + str); }

    // Variables that we'll need to keep.
    var is_open_p = false;
    var parea = new bbop.html.tag('div', {'generate_id': true});
    var pmsg = new bbop.html.tag('div', {'generate_id': true}, "Waiting...");
    parea.add_to(pmsg);

    var div = new bbop.html.tag('div', {'generate_id': true}, parea);
    var pmsg_id = pmsg.get_id();
    //var pbar_id = pbar.get_id();
    var div_id = div.get_id();
    var diargs = {
	modal: true,
	draggable: false,
	width: 800,
	height: 600,
	close:
	function(){
	    // TODO: Could maybe use .dialog('destroy') instead?
	    jQuery('#' + div_id).remove();
	}	    
    };

    /*
     * Function: start_wait
     * 
     * Render an unpopulated modal shield with some kind of waiting
     * element. This is to act as a block for the IO if
     * desired--calling this before .draw() is not required (as
     * .draw() will call it anyways if you haven't).
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.start_wait = function(){

	// Mark that we've finally opened it.
	is_open_p = true;

	// Append div to body.
	jQuery('body').append(div.to_string());	

	// If we have an image source specified, go ahead and add it to
	// the waiting display before popping it open.
	if( spinner_img_src && spinner_img_src != '' ){
	    var s = new bbop.widget.spinner(parea.get_id(), spinner_img_src);
	}

	// Pop open the dialog.
	var dia = jQuery('#' + div_id).dialog(diargs);
    };

    /*
     * Function: draw
     * 
     * Render a temporary modal filter shield.
     * 
     * Arguments:
     *  field_name - the name (id) of the filter field to display
     *  filter_list - a list of [[filter_id, filter_count], ...]
     *  manager - the manager that we'll use for the callbacks
     * 
     * Returns:
     *  n/a
     */
    this.draw = function(field_name, filter_list, manager){
	//ll(doc['id']);

	// Open the shield if it is not already open.
	if( ! is_open_p ){
	    anchor.open();
	}

	var txt = 'No filters...';
	var tbl = new bbop.html.table(null, null, {'generate_id': true});
	var button_hash = {};
	var each = bbop.core.each; // conveience
	var bgen = bbop.widget.display.text_button_sim;
	each(filter_list,
 	     function(field){
		 var fname = field[0];
		 var fcount = field[1];

		 var b_plus = new bgen('+', 'Add positive filter');
		 var b_minus = new bgen('-', 'Add negative filter');
		 button_hash[b_plus.get_id()] =
		     [field_name, fname, fcount, '+'];
		 button_hash[b_minus.get_id()] =
		     [field_name, fname, fcount, '-'];

		 tbl.add_to([fname, '(' + fcount + ')',
			     b_plus.to_string(),
			     b_minus.to_string()]);
	     });
	txt = tbl.to_string();

	// Create a filter slot div.
	
	// Add filter slot and table text to div.
	jQuery('#' + div_id).empty();
	var fdiv = new bbop.html.tag('div', {'generate_id': true});
	jQuery('#' + div_id).append(fdiv.to_string());	
	jQuery('#' + div_id).append(txt);

	// Apply the filter to the table.
	var ft = null;
	if( spinner_img_src && spinner_img_src != '' ){
	    ft = bbop.widget.filter_table(fdiv.get_id(), tbl.get_id(),
					  spinner_img_src, null);
	}else{
	    ft = bbop.widget.filter_table(fdiv.get_id(), tbl.get_id(), null);
	}

	// Okay, now introducing a function that we'll be using a
	// couple of times in our callbacks. Given a button id (from
	// a button hash) and the [field, filter, count, polarity]
	// values from the props, make a button-y thing an active
	// filter.
	function filter_select_live(button_id, create_time_button_props){
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
	    jQuery('#' + button_id).click(
		function(){
		    var tid = jQuery(this).attr('id');
		    var call_time_button_props = button_hash[tid];
		    var call_field = call_time_button_props[0];	 
		    var call_filter = call_time_button_props[1];
		    //var in_count = button_props[2];
		    var call_polarity = call_time_button_props[3];
		    
		    // Change manager, fire, and close the dialog.
		    manager.add_query_filter(call_field, call_filter,
			  		     [call_polarity]);
		    manager.search();
		    jQuery('#' + div_id).remove();
		});
	}

	// Now let's go back and add the buttons, styles,
	// events, etc. in the main accordion section.
	each(button_hash, filter_select_live);

    };

};
