/*
 * Package: live_pager.js
 * 
 * Namespace: bbop.widget.live_pager
 * 
 * BBOP JS object to allow the the paging/downloading etc. of a GOlr
 * manager.
 * 
 * Very much like a separated pager from the search pane.
 * 
 * This is a Bootstrap 3 widget.
 * 
 * See Also:
 *  <search_pane.js>
 *  <live_search.js>
 *  <live_filters.js>
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: live_pager
 * 
 * Contructor for the bbop.widget.live_pager object.
 * 
 * Display a manager response. Not a manager itself, but can use the
 * argument manager to page, download, etc.
 *
 * Arguments:
 *  interface_id - string id of the element to build on
 *  manager - a manager object to probe for display and use for remoting
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.widget.live_pager = function(interface_id, manager, in_argument_hash){
    this._is_a = 'bbop.widget.live_pager';

    var anchor = this;
    var each = bbop.core.each;
    function ll(str){ console.log(str); };

    // Some top-level variable defined.
    var ui_user_button_div_id =
	    interface_id + '_button_div_' + bbop.core.uuid();
    var ui_count_control_div_id =
	    interface_id + '_countctl_div_' + bbop.core.uuid();

    // Handle incoming arguements.
    var default_hash = {
	'callback_priority': 0
    };
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    var callback_priority = arg_hash['callback_priority'];

    // Last things last, bind to the manager.
    // TODO/BUG: Should this actually happen outside the widget? How
    // complicated is this really?
    var fun_id = bbop.core.uuid();
    manager.register('search', fun_id, _repaint_on_callback, callback_priority);

    /*
     * Function: draw_meta
     *
     * Draw meta results. Includes selector for drop down.
     * 
     * (Re)draw the count control with the current information in the
     * manager. This also tries to set the selector to the response
     * number (to keep things in sync), unbinds any current "change"
     * event, and adds a new change event.
     * 
     * Parameters:
     *  response - the <bbop.golr.response> returned from the server
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    function _repaint_on_callback(response, manager){
	
	ll('draw live_pager at: ' + interface_id);

	///
	/// Section 1: the numbers display.
	///

	// Collect numbers for display.
	var total_c = response.total_documents();
	var first_d = response.start_document();
	var last_d = response.end_document();

	// Draw meta; the current numbers and page--the same for
	// every type of return.
	jQuery('#' + interface_id).empty();
	if( total_c == 0 ){
	    jQuery('#' + interface_id).append('No results found.');
	}else{

	    // A top-level div to contain the literal meta results, and the count
	    // selector next to them.
	    var mdiv_attrs = {
		'class': 'row',
		'generate_id': true
	    };
	    var mdiv = new bbop.html.tag('div', mdiv_attrs);

	    // The literal return metadata.
	    var dmeta_attrs = {
		//'class': 'bbop-js-search-pane-meta'
		'generate_id': true,
		'class': 'col-xs-6 col-sm-6 col-md-4 col-lg-4'
	    };
	    var dmeta = new bbop.html.tag('div', dmeta_attrs);
	    dmeta.add_to('<div>Total: ' + total_c +
			 '; showing: ' + first_d +
			 '-' + last_d + '</div>');
	    mdiv.add_to(dmeta);

	    ///
	    /// Section 2: results count control.
	    ///

	    // Create a text label.
	    var sel_label_attrs = {
		//'for': ui_count_control_div_id,
		// 'generate_id': true,
		//'class': 'control-label'
	    };
	    var sel_label = new bbop.html.tag('span', sel_label_attrs,
					      'Results&nbsp;count&nbsp;&nbsp;');
	    
	    // Create inputs (the current order is important for proper
	    // for/id creation).
	    var cinputs = [];
	    each([10, 25, 50, 100],
		 function(num, cindex){
		     // Create and store the option.
		     var sel_input_attrs = {
			 'generate_id': true,
			 'value': num
		     };
		     var sel_input =
			     new bbop.html.tag('option', sel_input_attrs, num);
		     var sel_input_id = sel_input.get_id();
		     cinputs.push(sel_input);
		 });
	    // Option container div.
	    var sel_attrs = {
		'id': ui_count_control_div_id,
		//'class': 'form-control',
		'style': 'width: 5em;'
	    };
	    var sel = new bbop.html.tag('select', sel_attrs, cinputs);
	    
	    // Container div.
	    var sel_div_attrs = {
	    	'generate_id': true
		//'class': 'col-xs-6 col-sm-6 col-md-3 col-lg-3'
	    	//'class': 'form-group'
	    	//'style': 'width: 7em;'
	    };
	    var sel_div = new bbop.html.tag('div', sel_div_attrs);
	    
	    // Assemble these elements into the UI.
	    sel_div.add_to(sel_label);
	    sel_div.add_to(sel);
	    //mdiv.add_to(sel_div);
	    dmeta.add_to(sel_div);

	    // Render out the last two sections.
	    jQuery('#' + interface_id).append(mdiv.to_string());
	    
	    ///
	    /// Section 3: results count activity, setting.
	    ///

	    // First, unbind so we don't accidentally trigger with any
	    // changes and don't pile up event handlers.
	    jQuery('#' + ui_count_control_div_id).unbind('change');

	    // Next, pull out the number of rows requested.
	    var step = response.row_step();
	    
	    // Set the value to the number.
	    jQuery('#' + ui_count_control_div_id).val(step);
	    
	    // Finally, reactivate the event handler on the select.
	    jQuery('#' + ui_count_control_div_id).change(
		function(event, ui){
		    var sv = jQuery('#' + ui_count_control_div_id).val();
		    if( bbop.core.is_defined(sv) ){
			// Convert to a number.
			var si = parseInt(sv);
			
			// Set manager and to the search.
			manager.set_results_count(si);
			manager.search();
			// We are now searching--show it.
			//_spin_up();
		    }
		});

	    ///
	    /// Section 4: the paging buttons.
	    ///
	    
	    var bdiv_attrs = {
 		'class': 'col-xs-12 col-sm-12 col-md-8 col-lg-8',
	    	'generate_id': true
		
	    };
	    var bdiv = new bbop.html.tag('div', bdiv_attrs);
	    //jQuery('#' + interface_id).append(bdiv.to_string());
	    jQuery('#' + mdiv.get_id()).append(bdiv.to_string());
	    var bdiv_id = bdiv.get_id();

	    // Now add the raw buttons to the interface, and after this,
	    // activation and adding events.
	    var bopts = {
		'generate_id': true,
		'class': 'btn btn-primary'
	    };
	    var b_first = new bbop.html.button('&laquo;First', bopts);
	    //jQuery('#' + interface_id).append(b_first.to_string());
	    jQuery('#' + bdiv_id).append(b_first.to_string());
	    var b_back = new bbop.html.button('&lt;Prev', bopts);
	    //jQuery('#' + interface_id).append(b_back.to_string());
	    jQuery('#' + bdiv_id).append(b_back.to_string());
	    var b_forward = new bbop.html.button('Next&gt;', bopts);
	    //jQuery('#' + interface_id).append(b_forward.to_string());
	    jQuery('#' + bdiv_id).append(b_forward.to_string());
	    var b_last = new bbop.html.button('Last&raquo;', bopts);
	    //jQuery('#' + interface_id).append(b_last.to_string());
	    jQuery('#' + bdiv_id).append(b_last.to_string());

	    // Do the math about what buttons to activate.
	    var b_first_disabled_p = false;
	    var b_back_disabled_p = false;
	    var b_forward_disabled_p = false;
	    var b_last_disabled_p = false;
	    
	    // Only activate paging if it is necessary to the returns.
	    if( ! response.paging_p() ){
		b_first_disabled_p = true;
		b_back_disabled_p = true;
		b_forward_disabled_p = true;
		b_last_disabled_p = true;
	    }
	    
	    // Don't activate back on the first page.
	    if( ! response.paging_previous_p() ){
		b_first_disabled_p = true;
		b_back_disabled_p = true;
	    }
	    
	    // Don't activate next on the last page.
	    if( ! response.paging_next_p() ){
		b_forward_disabled_p = true;
		b_last_disabled_p = true;
	    }

	    // Add the "disabled" property to a button if the boolean
	    // value says so.
	    function _disable_if(bttn, disbool){
		if( disbool ){
		    jQuery('#' + bttn.get_id()).attr('disabled','disabled');
		}
	    }
	    
	    // First page button.
	    _disable_if(b_first, b_first_disabled_p);
	    jQuery('#' + b_first.get_id()).click(
		function(){
		    // Cheat and trust reset by proxy to work.
		    manager.page_first(); 
		    // We are now searching--show it.
		    //_spin_up();
		});
	    
	    // Previous page button.
	    _disable_if(b_back, b_back_disabled_p);
	    jQuery('#' + b_back.get_id()).click(
		function(){
		    manager.page_previous();
		    // We are now searching--show it.
		    //_spin_up();
		});
	    
	    // Next page button.
	    _disable_if(b_forward, b_forward_disabled_p);
	    jQuery('#' + b_forward.get_id()).click(
		function(){
		    manager.page_next();
		    // We are now searching--show it.
		    //_spin_up();
		});
	    
	    // Last page button.
	    _disable_if(b_last, b_last_disabled_p);
	    jQuery('#' + b_last.get_id()).click(
		function(){
		    // A little trickier.
		    manager.page_last(total_c);
		    // We are now searching--show it.
		    //_spin_up();
		});
	    
	    ///
	    /// Section 5: the button_definition buttons.
	    ///

	    // Spacer.	    
	    // jQuery('#' + interface_id).append('&nbsp;&nbsp;&nbsp;' +
	    // 					'&nbsp;&nbsp;&nbsp;');
	    jQuery('#'+ bdiv_id).append('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');

	    // (R)establish the user button div to the end of the meta
	    // retults.
	    var ubuttons = new bbop.html.tag('span',
					     {'id': ui_user_button_div_id});
	    //jQuery('#' + interface_id).append(ubuttons.to_string());
	    jQuery('#' + bdiv_id).append(ubuttons.to_string());

	    // Add all of the defined buttons after the spacing.
	    _draw_user_buttons(manager);
	}
    }

    /*
     * Function: draw_user_buttons
     *
     * (Re)draw the user-defined buttons in the meta information area.
     * Will naturally fail if there is no meta div that has been
     * nested with the user button element.
     * 
     * Parameters:
     *  manager - <bbop.golr.manager> that we initially registered with
     *
     * Returns:
     *  n/a
     */
    function _draw_user_buttons(){
	function _button_rollout(button_def_hash){
	    var default_hash =
    		{
		    label : 'n/a',
		    disabled_p : false,
		    text_p : false,
		    icon : 'ui-icon-help',
		    click_function_generator :
		    function(){
			return function(){
			    alert('No callback defined for this button--' +
				  'the generator may have been empty!');
			};
		    }
    		};
	    var folding_hash = button_def_hash || {};
	    var arg_hash = bbop.core.fold(default_hash, folding_hash);
	    
	    var label = arg_hash['label'];
	    var disabled_p = arg_hash['disabled_p'];
	    var text_p = arg_hash['text_p'];
	    var icon = arg_hash['icon'];
	    var click_function_generator =
		arg_hash['click_function_generator'];
	    
	    var b = new bbop.html.button(label, {'generate_id': true});
	    jQuery('#' + ui_user_button_div_id).append(b.to_string());
	    var b_props = {
		icons: { primary: icon},
		disabled: disabled_p,
		text: text_p
	    };
	    var click_fun = click_function_generator(manager);
	    jQuery('#' + b.get_id()).click(click_fun);
	}

	// Check that we're not about to do the impossible.
	if( ! jQuery('#' + ui_user_button_div_id) ){
	    alert('cannot refresh buttons without a place to draw them');
	}else{
	    jQuery('#' + ui_user_button_div_id).empty();
	    jQuery('#' + ui_user_button_div_id).empty();
	    bbop.core.each(anchor.button_definitions, _button_rollout);
	}
    }

};
