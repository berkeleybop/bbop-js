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
 * : new bbop.widget.list_select_shield({title: 'foo', blurb: 'explanation', list_of_lists: [[['a', 'b'], ['c', 'd']], [[1, 2]]], title_list: ['title 1', 'title 2'], action: function(selected_args){ alert(selected_args.join(', '));}})
 * 
 * This is a completely self-contained UI and manager.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
//bbop.core.require('bbop', 'model');
//bbop.core.require('bbop', 'model', 'graph', 'bracket');
bbop.core.require('bbop', 'html');
bbop.core.require('bbop', 'golr', 'manager', 'jquery');
bbop.core.namespace('bbop', 'widget', 'list_select_shield');

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
 * : [[[label, value], ...], ...]
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

    // 
    function _draw_radio_list(list){

	var list_cache = [];
	var rdo_grp = 'bbop_js_lss_' + uuid();

	each(list,
	     function(item){

		 var lbl = item[0];
		 var val = item[1];

		 //ll('lbl: ' + lbl);
		 //ll('val: ' + val);

		 // Radio button.	 
		 var rdo_attrs = {
		     'generate_id': true,
		     'name': rdo_grp,
		     'type': 'radio',
		     'value': val
		 };
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
	    'generate_id': true
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
    var tbl = new bbop.html.table(title_list);
    var lol_cache = [];
    each(list_of_lists,
	 function(sub_list){
	     lol_cache.push(_draw_radio_list(sub_list));
	 });
    tbl.add_to(lol_cache);
    jQuery('#' + div_id).append(tbl.to_string());

    // Finally, add a clickable button to that calls the action
    // function.
    var cont = new bbop.widget.display.text_button_sim('continue',
						       'Click to continue');
    jQuery('#' + div_id).append(cont.to_string());

    // Since we've technically added the button, back it clickable
    jQuery('#' + cont.get_id()).click(
	function(){
	    // BUG/TODO: Jimmy values out from above.
	    var selected = ['TODO', 'BUG'];

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
