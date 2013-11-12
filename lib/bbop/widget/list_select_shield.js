/*
 * Package: list_select_shield.js
 * 
 * Namespace: bbop.widget.list_select_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing term
 * information shield.
 * 
 * A simple invocation could be:
 * 
 * : new bbop.widget.list_select_shield({title: 'foo', blurb: 'explanation', list_of_lists: [[['a', 'b'], ['c', 'd', true]], [[1, 2], [3, 4]]], title_list: ['title 1', 'title 2'], action: function(selected_args){ alert(selected_args.join(', '));}})
 * 
 * This is a completely self-contained UI and manager.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: list_select_shield
 * 
 * Contructor for the bbop.widget.list_select_shield object.
 * 
 * The purpose of this object to to create a popup that 1) display
 * multiple lists for the user to select from and 2) triggers an
 * action (by function argument) to act on the list selections.
 * 
 * The "list_of_lists" argument is a list of lists structured like:
 * : [[[label, value, nil|true|false], ...], ...]
 * 
 * Items that are true will appear as pre-checked when the lists come
 * up.
 * 
 * The "action" argument is a function that takes a list of selected
 * values.
 * 
 * The argument hash looks like:
 *  title - *[optional]* the title to be displayed 
 *  blurb - *[optional]* a text chunk to explain the point of the action
 *  title_list - a list of titles/explanations for the lists
 *  list_of_lists - a list of lists (see above)
 *  action - *[optional] * the action function to be triggered (see above, defaults to no-op)
 *  width - *[optional]* width as px integer (defaults to 800)
 * 
 * Arguments:
 *  in_argument_hash - hash of arguments (see above)
 * 
 * Returns:
 *  self
 */
bbop.widget.list_select_shield = function(in_argument_hash){    
    this._is_a = 'bbop.widget.list_select_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (list_select_shield): ' + str); }

    // Aliases.
    var each = bbop.core.each;
    var uuid = bbop.core.uuid;
    
    // Our argument default hash.
    var default_hash = {
	'title': '',
	'blurb': '',
	'title_list': [],
	'list_of_lists': [],
	'action': function(){},
	'width': 800
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    var title = arg_hash['title'];
    var blurb = arg_hash['blurb'];
    var title_list = arg_hash['title_list'];
    var list_of_lists = arg_hash['list_of_lists'];
    var action = arg_hash['action'];
    var width = arg_hash['width'];

    // Cache the group names as we go so we can pull them out later
    // when we scan for checked items.
    var group_cache = [];
    function _draw_radio_list(list){

	var list_cache = [];
	var rdo_grp = 'bbop_js_lss_' + uuid();
	group_cache.push(rdo_grp);

	each(list,
	     function(item){

		 var lbl = item[0];
		 var val = item[1];
		 var ckt = item[2] || false;

		 //ll('lbl: ' + lbl);
		 //ll('val: ' + val);
		 //ll('ckt: ' + ckt);

		 // Radio button.	 
		 var rdo_attrs = {
		     'generate_id': true,
		     'name': rdo_grp,
		     'type': 'radio',
		     'value': val
		 };
		 if( ckt ){
		     rdo_attrs['checked'] = 'checked';
		 }
		 var rdo = new bbop.html.input(rdo_attrs);
		 //ll('rdo: ' + rdo.to_string());

		 // Label for it.
		 var rdo_lbl_attrs = {
		     'for': rdo.get_id()
		 };
		 var rdo_lbl = new bbop.html.tag('label', rdo_lbl_attrs,
						 '&nbsp;' + lbl);
		 //ll('rdo_lbl: ' + rdo_lbl.to_string());

		 // And a span to capture both.
		 var rdo_span_attrs = {
		 };
		 var rdo_span = new bbop.html.span('', rdo_span_attrs);
		 //ll('rdo_span (1): ' + rdo_span.to_string());
		 rdo_span.add_to(rdo);
		 //ll('rdo_span (2): ' + rdo_span.to_string());
		 rdo_span.add_to(rdo_lbl);
		 //ll('rdo_span (3): ' + rdo_span.to_string());

		 // Now /this/ goes into the list.
		 list_cache.push(rdo_span);
	     });

	// Now we have a list of all the items, put them into a UL
	// element.
	var ul_list_attrs = {
	    'generate_id': true,
	    'class': 'bbop-js-ui-list-select-shield-list'
	};
	var ul_list = new bbop.html.list(list_cache, ul_list_attrs);

	// ...and send it back.
	return ul_list;
    }

    // Append super container div to body.
    var div = new bbop.html.tag('div', {'generate_id': true});
    var div_id = div.get_id();
    jQuery('body').append(div.to_string());

    // Add title and blurb to div.
    jQuery('#' + div_id).append('<p>' + blurb + '</p>');

    // Add the table of lists to div.
    var cont_table_attrs = {
	'class': 'bbop-js-ui-list-select-shield-table'
    };
    var tbl = new bbop.html.table(title_list, [], cont_table_attrs);
    var lol_cache = []; // not funny: list of lists
    each(list_of_lists,
	 function(sub_list){
	     lol_cache.push(_draw_radio_list(sub_list));
	 });
    tbl.add_to(lol_cache);
    jQuery('#' + div_id).append(tbl.to_string());

    // Finally, add a clickable button to that calls the action
    // function. (Itself embedded in a container div to help move it
    // around.)
    var cont_div_attrs = {
	'class': 'bbop-js-ui-dialog-button-right',
	'generate_id': true
    };
    var cont_div = new bbop.html.tag('div', cont_div_attrs);
    var cont_btn_attrs = {
	//'class': 'bbop-js-ui-dialog-button-right'
    };
    var cont_btn = new bbop.widget.display.text_button_sim('Continue',
							   'Click to continue',
							   null,
							   cont_btn_attrs);
    cont_div.add_to(cont_btn);
    jQuery('#' + div_id).append(cont_div.to_string());

    // Since we've technically added the button, back it clickable
    // Note that this is very much radio button specific.
    jQuery('#' + cont_btn.get_id()).click(
	function(){
	    // Jimmy values out from above by cycling over the
	    // collected groups.
	    var selected = [];
	    each(group_cache,
		 function(gname){
		     var find_str = 'input[name=' + gname + ']';
		     var val = null;
		     jQuery(find_str).each(
			 function(){
			     if( this.checked ){
				 val = jQuery(this).val();
			     }
			     // }else{
			     // 	 selected.push(null);
			     //}
			 });
		     selected.push(val);
		 });

	    // Calls those values with our action function.
	    action(selected);

	    // And destroy ourself.
	    jQuery('#' + div_id).remove();
	});

    // Modal dialogify div; include self-destruct.
    var diargs = {
	'title': title,
	'modal': true,
	'draggable': false,
	'width': width,
	'close':
	function(){
	    // TODO: Could maybe use .dialog('destroy') instead?
	    jQuery('#' + div_id).remove();
	}	    
    };
    var dia = jQuery('#' + div_id).dialog(diargs);
};
