/*
 * Package: filter_table.js
 * 
 * Namespace: bbop.widget.filter_table
 * 
 * Create a dynamic filter for removing rows from a table (where the
 * rows are inside of a tbody).
 * 
 * The repaint_func argument takes the table id as its argument. If a
 * function is not specified, the default function will do nothing.
 */

// YANKED: ...apply the classes "even_row" and "odd_row" to the table.

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Method: filter_table
 * 
 * The table needs to keep the row information in a tbody, not just at
 * the top level.
 * 
 * Arguments:
 *  elt_id - the element to inject the filter into
 *  table_id - the table that we will operate on
 *  img_src - *[optional]* img source URL for the spinner image (defaults to no spinner)
 *  repaint_func - the repaint function to run after filtering (see above)
 *  label - *[optional]* the label to use for the filter
 * 
 * Returns:
 *  n/a
 */
bbop.widget.filter_table = function(elt_id, table_id, img_src,
				    repaint_func, label){
    this._is_a = 'bbop.widget.filter_table';

    var anchor = this;
    
    var logger = new bbop.logger();
    //logger.DEBUG = true;
    logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    ll('init filter_table in ' + elt_id + ' for ' + table_id);

    // Sort out spinner image source.
    anchor.img_src = null;
    if( img_src ){
	anchor.img_src = img_src;
    }

    // Sort out repaint function.
    anchor.repaint_func = 
    	function (tid){};	
    // function (tid){
    //     jQuery('table#' + tid + ' tr:even').attr('class', 'even_row');
    //     jQuery('table#' + tid + ' tr:odd').attr('class', 'odd_row');
    // };
    if( repaint_func ){
    	anchor.repaint_func = repaint_func;
    }

    // Sort out label.
    anchor.label = 'Filter:';
    if( label ){
	anchor.label = label;
    }

    ll('finished args');

    // Create a label, input field, and a clear button.
    var input_attrs = {
	'type': 'text',
	'class': 'textBox',
	'value': "",
	'generate_id': true
    };
    var input = new bbop.html.input(input_attrs);
    var lbl_attrs = {
	'for': input.get_id(),
	'generate_id': true
    };
    var lbl = new bbop.html.tag('label', lbl_attrs);
    lbl.add_to(anchor.label);
    var clear_button =
	new bbop.widget.display.text_button_sim('X', 'Clear filter');

    ll('widget gen done');

    // And add them to the DOM at the location.
    jQuery('#' + elt_id).empty();
    jQuery('#' + elt_id).append(lbl.to_string());
    jQuery('#' + elt_id).append(input.to_string());
    jQuery('#' + elt_id).append(clear_button.to_string());

    // Also, attach a spinner.
    var spinner = null;
    if( anchor.img_src ){
	jQuery('#' + elt_id).append('&nbsp;&nbsp;');
	spinner = new bbop.widget.spinner(elt_id, anchor.img_src,
					 {
					     visible_p: false
					 });
    }
    
    ll('widget addition done');

    // Make the clear button active.
    jQuery('#' + clear_button.get_id()).click(
	function(){
	    ll('click call');
	    if( spinner ){ spinner.show(); }
            jQuery('#' + input.get_id()).val('');
	    trs.show();
	    // Recolor after filtering.
	    anchor.repaint_func(table_id);
	    if( spinner ){ spinner.hide(); }
	});

    // Cache information about the table.
    var trs = jQuery('#' + table_id + ' tbody > tr');
    var tds = trs.children();

    // Make the table filter active.
    jQuery('#' + input.get_id()).keyup(
	function(){

	    if( spinner ){ spinner.show(); }

            var stext = jQuery(this).val();

	    ll('keyup call: (' + stext + '), ' + trs);

	    if( ! bbop.core.is_defined(stext) || stext == "" ){
		// Restore when nothing found.
		trs.show();
	    }else{
		// Want this to be insensitive.
		stext = stext.toLowerCase();

		// All rows (the whole table) gets hidden.
		trs.hide();

		// jQuery filter to match element contents against
		// stext.
		function _match_filter(){
		    var retval = false;
		    var lc = jQuery(this).text().toLowerCase();
		    if( lc.indexOf(stext) >= 0 ){
			retval = true;
		    }
		    return retval;
		}

		// If a td has a match, the parent (tr) gets shown.
		// Or: show only matching rows.
		tds.filter(_match_filter).parent("tr").show();
            }

	    // Recolor after filtering.
	    anchor.repaint_func(table_id);

	    if( spinner ){ spinner.hide(); }
	});
};
