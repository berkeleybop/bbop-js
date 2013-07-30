/*
 * Package: drop_select_shield.js
 * 
 * Namespace: bbop.widget.drop_select_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing DnD
 * selection and ordering shield.
 * 
 * A simple invocation could be:
 * 
 * : new bbop.widget.drop_select_shield({title: 'foo', blurb: 'explanation', pool_list: [['a', 'b'], ['c', 'd']], selected_list [['a', 'b']], action: function(selected_items){ alert(selected_items.join(', '));}})
 * 
 * This is a completely self-contained UI and manager.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
//bbop.core.require('bbop', 'model');
//bbop.core.require('bbop', 'model', 'graph', 'bracket');
bbop.core.require('bbop', 'html');
bbop.core.require('bbop', 'golr', 'manager', 'jquery');
bbop.core.namespace('bbop', 'widget', 'drop_select_shield');

/*
 * Constructor: drop_select_shield
 * 
 * Contructor for the bbop.widget.drop_select_shield object.
 * 
 * The purpose of this object to to create a popup that 1) displays a
 * drag selectable and reorderable list of items and 2) define an
 * action (by function argument) to act on the selection.
 * 
 * The list arguments take the form of: ["label", "id"].
 * 
 * The "action" argument is a function that takes a list of selected
 * ids.
 * 
 * The argument hash looks like:
 *  title - *[optional]* the title to be displayed 
 *  blurb - *[optional]* a text chunk to explain the point of the action
 *  pool_list - a list of lists (see above)
 *  selected_list - a list of lists (see above)
 *  action - *[optional] * the action function to be triggered (see above, defaults to no-op)
 *  width - *[optional]* width as px integer (defaults to 800)
 * 
 * Arguments:
 *  in_argument_hash - hash of arguments (see above)
 * 
 * Returns:
 *  self
 */
bbop.widget.drop_select_shield = function(in_argument_hash){    
    this._is_a = 'bbop.widget.drop_select_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (drop_select_shield): ' + str); }

    // Aliases.
    var each = bbop.core.each;
    var uuid = bbop.core.uuid;
    
    // Our argument default hash.
    var default_hash = {
	'title': '',
	'blurb': '',
	'pool_list': [],
	'selected_list': [],
	'action': function(){},
	'width': 800
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    var title = arg_hash['title'];
    var blurb = arg_hash['blurb'];
    var pool_list = arg_hash['pool_list'];
    var selected_list = arg_hash['selected_list'];
    var action = arg_hash['action'];
    var width = arg_hash['width'];

    // Create a random class that we'll use as a connector later.
    var rclass = 'bbop-js-ui-dss-rclass-'+ bbop.core.randomness(20);

    // Get the pool and selected lists into html form for loading into
    // the frame table.
    var li_attrs = {
	'class': 'ui-state-default bbop-js-ui-hoverable'
	//'class': 'bbop-js-ui-hoverable'
    };
    var ul_src_list_attrs = {
    	'generate_id': true,
	'class': 'bbop-js-ui-drop-select-shield ' + rclass
    };
    var pool_ul_list = new bbop.html.list([], ul_src_list_attrs);
    each(pool_list,
    	 function(item){	     
    	     var lbl = item[0];
    	     var val = item[1];
    	     //ll('lbl: ' + lbl);
    	     //ll('val: ' + val);
	     li_attrs['value'] = val;
	     var cntnt = '' +
		 '<span class="ui-icon ui-icon-arrow-4"></span> ' +
		 '' + lbl + ' (' + val + ')' + 
		 '';
	     var li_elt = new bbop.html.tag('li', li_attrs, cntnt);
	     pool_ul_list.add_to(li_elt);
    	 });
    var ul_target_list_attrs = {
    	'generate_id': true,
	'class':
	'bbop-js-ui-drop-select-shield bbop-js-ui-drop-select-shield-target ' +
	    rclass
    };
    var selected_ul_list = new bbop.html.list([], ul_target_list_attrs);
    each(selected_list,
    	 function(item){
    	     var lbl = item[0];
    	     var val = item[1];
    	     //ll('lbl: ' + lbl);
    	     //ll('val: ' + val);
	     li_attrs['value'] = val;
	     var cntnt = '' +
		 '<span class="ui-icon ui-icon-arrow-4"></span> ' +
		 '' + lbl + ' (' + val + ')' + 
		 '';
	     var li_elt = new bbop.html.tag('li', li_attrs, cntnt);
	     selected_ul_list.add_to(li_elt);
    	 });

    // Append super container div to body.
    var div = new bbop.html.tag('div', {'generate_id': true});
    var div_id = div.get_id();
    jQuery('body').append(div.to_string());

    // Add title and blurb to div.
    jQuery('#' + div_id).append('<p>' + blurb + '</p>');

    // Add the table frame to the div.
    var tbl = new bbop.html.table(['Available pool', 'Selected fields'],
				  [[pool_ul_list, selected_ul_list]],
				  {'class':
				   'bbop-js-ui-drop-select-shield-frame'});
    jQuery('#' + div_id).append(tbl.to_string());

    // Make the lists operable.
    var pul_id = pool_ul_list.get_id();
    var sul_id = selected_ul_list.get_id();
    jQuery('#'+pul_id+',#'+sul_id ).sortable(
	{connectWith: '.' + rclass}
    ).disableSelection();

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
    var cont_btn = new bbop.widget.display.text_button_sim('Select',
    							   'Click to select',
    							   null,
    							   cont_btn_attrs);
    // var cancel_btn_attrs = {
    // 	//'class': 'bbop-js-ui-dialog-button-right'
    // };
    // var cancel_btn = new bbop.widget.display.text_button_sim('Cancel',
    // 							     'Click to cancel',
    // 							     null,
    // 							     cont_btn_attrs);
    cont_div.add_to(cont_btn);
    // cont_div.add_to(cancel_btn);
    jQuery('#' + div_id).append(cont_div.to_string());

    // Since we've technically added the button, make it clickable
    // Note that this is very much radio button specific.
    jQuery('#' + cont_btn.get_id()).click(
    	function(){
	    // Pull the values.
	    // Currently, JQuery adds a lot of extra non-attributes li
	    // tags when it creates the DnD, so filter those out to
	    // get just the fields ids.
	    var selected_strings =
		jQuery('#'+ sul_id).sortable('toArray', {'attribute': 'value'});
    	    var final_selected = [];
    	    each(selected_strings,
    	    	 function(in_thing){
		     if( in_thing && in_thing != '' ){
			 final_selected.push(in_thing);
		     }
		 });
	    //alert(final_selected.join(','));

    	    // Calls those values with our action function.
    	    action(final_selected);

    	    // And destroy ourself.
    	    jQuery('#' + div_id).remove();
    	});

    // // And activate the canel button.
    // jQuery('#' + cancel_btn.get_id()).click(
    // 	function(){
    // 	    // And destroy ourself.
    // 	    jQuery('#' + div_id).remove();
    // 	});

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
