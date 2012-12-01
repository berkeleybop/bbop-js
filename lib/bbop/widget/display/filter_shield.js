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
 *  field_name - the name (id) of the filter field to display
 *  filter_list - a list of [[filter_id, filter_count], ...]
 *  manager - the manager that we'll use for the callbacks
 * 
 * Returns:
 *  self
 */
bbop.widget.display.filter_shield = function(field_name, filter_list, manager){
    this._is_a = 'bbop.widget.display.filter_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (filter_shield): ' + str); }

    /*
     * Function: draw
     * 
     * Render a temporary modal filter shield.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.draw = function(){
	//ll(doc['id']);
	var txt = 'No filters...';
	var tbl = new bbop.html.table();
	var button_hash = {};
	var each = bbop.core.each; // conveience
	each(filter_list,
 	     function(field){
		 var fname = field[0];
		 var fcount = field[1];
		 
		 var b_plus_txt = '<b>[&nbsp;+&nbsp;]</b>';
		 var b_plus =
		     new bbop.html.span(b_plus_txt,
					{'generate_id': true});
		 var b_minus_txt = '<b>[&nbsp;-&nbsp;]</b>';
		 var b_minus =
		     new bbop.html.span(b_minus_txt,
					{'generate_id': true});
		 button_hash[b_plus.get_id()] =
		     [field_name, fname, fcount, '+'];
		 button_hash[b_minus.get_id()] =
		     [field_name, fname, fcount, '-'];

		 tbl.add_to([fname, '(' + fcount + ')',
			     b_plus.to_string(),
			     b_minus.to_string()]);
	     });
	txt = tbl.to_string();
	
	// Create div.
	var div = new bbop.html.tag('div', {'generate_id': true});
	var div_id = div.get_id();
	
	// Append div to body.
	jQuery('body').append(div.to_string());
	
	// Add text to div.
	jQuery('#' + div_id).append(txt);
	
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
	var dia = jQuery('#' + div_id).dialog(diargs);
    };

};
