/*
 * Package: repl.js
 * 
 * Namespace: bbop.widget.repl
 * 
 * A self-contained flexible REPL to use as a base to explore the BBOP
 * environment that you setup.
 * 
 * This is a completely self-contained UI and manager.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
bbop.core.require('bbop', 'html');
//bbop.core.require('bbop', 'golr', 'manager', 'jquery');
bbop.core.namespace('bbop', 'widget', 'repl');

/*
 * Constructor: repl
 * 
 * Contructor for the bbop.widget.repl object.
 * 
 * The in_argument_hash has the following options.
 * 
 *  buffer_id - the id of the evaluation buffer textarea (default: null/random)
 *  cli_id - the id of the CLI textarea (default: null/random)
 * 
 * If you do not specify ids for the inputs, random ones will be
 * generated.
 * 
 * Arguments:
 *  interface_id - string id of the element to build on
 *  initial_command - a list of initial commands to feed the interpreter
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.widget.repl = function(interface_id, initial_commands, in_argument_hash){
    this._is_a = 'bbop.widget.repl';

    // Aliases.
    var anchor = this;
    var loop = bbop.core.each;
    
    // Per-UI logger.
    var rlogger = new bbop.logger();
    rlogger.DEBUG = true;
    function log(str){ rlogger.kvetch('repl (pre): ' + str); }

    // Get no commands if nothing else.
    var init_buffer = initial_commands || [];
    
    // Our argument default hash.
    var default_hash =
	{
	    'buffer_id': null,
	    'cli_id': null
	};
    var folding_hash = in_argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);
    var in_buffer_id = arg_hash['buffer_id'];
    var in_cli_id = arg_hash['cli_id'];

    // The main div we'll work with.
    var repl_id = interface_id;
    jQuery('#' + repl_id).empty();

    // Save our CLI history as we go.
    var history_pointer = 0;
    var history_list = [''];

    ///
    /// Setup the HTML and layout on the page.
    ///

    // Env into work buffer.
    var command_buffer_args = {'rows': '12', cols:'80'};
    if( in_buffer_id ){
	command_buffer_args['id'] = in_buffer_id;
    }else{
	command_buffer_args['generate_id'] = true;
    }
    var command_buffer = new bbop.html.tag('textarea', command_buffer_args,
					   init_buffer.join("\n"));
    jQuery('#' + repl_id).append(command_buffer.to_string());
    
    jQuery('#' + repl_id).append('<br />');

    // Command buffer eval button.
    var command_buffer_button = new bbop.html.button('Evaluate buffer',
	    				   {'generate_id': true});
    jQuery('#' + repl_id).append(command_buffer_button.to_string());

    //jQuery('#' + repl_id).append('&nbsp;');

    // Clear buffer button.
    var clear_buffer_button = new bbop.html.button('Clear buffer',
	    					   {//'style':'float:right;',
						    'generate_id': true});
    jQuery('#' + repl_id).append(clear_buffer_button.to_string());

    //jQuery('#' + repl_id).append('&nbsp;&nbsp;&nbsp;');

    // Clear log button.
    var clear_log_button = new bbop.html.button('Clear log',
	    					{'generate_id': true});
    jQuery('#' + repl_id).append(clear_log_button.to_string());

    jQuery('#' + repl_id).append('<br />');

    // Log (+ clear botton).
    var logging_console_id = 'bbop-logger-console-text';
    var logging_console = new bbop.html.tag('textarea',
					    {'rows': '7', cols:'80',
					     'readonly': 'readonly',
					     'id': logging_console_id});
    jQuery('#' + repl_id).append(logging_console.to_string());

    jQuery('#' + repl_id).append('<br />');

    // A usage message.
    var cli_msg = new bbop.html.tag('span', {},
				    "[eval: return; ctrl+up/down: history]:");
    jQuery('#' + repl_id).append(cli_msg.to_string());
    jQuery('#' + repl_id).append('<br />');

    // Command line.
    var command_line_args = {'rows': '1', cols:'80'};
    if( in_cli_id ){
	command_line_args['id'] = in_cli_id;
    }else{
	command_line_args['generate_id'] = true;
    }
    var command_line = new bbop.html.tag('textarea', command_line_args);
    jQuery('#' + repl_id).append(command_line.to_string());

    // // Setup target divs.
    // bbop.core.each(['div1', 'div2', 'div3'],
    // 		   function(d){
    // 		       //log('// :' + d);
    // 		       var div =
    // 			   new bbop.html.tag('div', {'id':d}, '<b>'+ d +'</b>');
    // 		       jQuery('#' + repl_id).append(div.to_string());
    // 		       //jQuery('#' + repl_id).append('<br />');
    // 		   });

    ///
    /// Core helper functions.
    ///

    // Clobber the original logger to send stuff to the internal log
    // if possible.
    function log(str){
	rlogger.kvetch(str);
    }

    /*
     * Function: advance_log_to_bottom
     * 
     * Can't be bothered to check now, but this needs to be done
     * separately from the log because of an initial race condition.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.advance_log_to_bottom = function(){
    	var cons = jQuery('#' + logging_console_id);
    	var foo = cons.scrollTop(cons[0].scrollHeight);	
    };

    /*
     * Function: replace_buffer_text
     * 
     * Replace the buffer text with new text.
     * 
     * Arguments:
     *  str - the new text for the command buffer
     * 
     * Returns:
     *  n/a
     */
    this.replace_buffer_text = function(str){
	jQuery('#' + command_buffer.get_id()).val(str);
    };

    // /*
    //  * Function: replace_buffer_text
    //  * 
    //  * Replace the buffer text with new text.
    //  * 
    //  * Arguments:
    //  *  str - the new text for the command buffer
    //  * 
    //  * Returns:
    //  *  n/a
    //  */
    // this.replace_buffer_text = function(str){
    // 	jQuery('#' + command_buffer.get_id()).val(str);
    // };

    // Eval!
    function evaluate(to_eval){

	var retval = '';
	try{
	    // If we get through this, things have gone well.
	    // Global eval actually kind of tricky:
	    //  http://perfectionkills.com/global-eval-what-are-the-options/
	    //var ret = eval(to_eval);
	    //var ret = jQuery.globalEval(to_eval);
	    var ret = window.eval(to_eval);
	    if( bbop.core.is_defined(ret) ){
		if( bbop.core.what_is(ret) == 'string' ){
		    retval = '"' + ret + '"';
		}else{
		    retval = ret;
		}
	    }else{
		// ...
	    }
	}catch (x){
	    // Bad things happened.
	    retval = '[n/a]';
	}

	return retval;
    }

    // Update the CLI to the current point in the history.
    function update_cli(){

	var item = history_list[history_pointer];
	jQuery('#' + command_line.get_id()).val(item);
	//log('// [history]: ' + item);
	//log('// history: '+history_pointer+', '+history_list.length);
	//advance_log_to_bottom();
    }

    ///
    /// Build callbacks.
    ///
    
    // A lot of cases for button presses when reading from the command
    // line.
    function read_cli(event){

	var which = event.which;
	var ctrl_p = event.ctrlKey;
	//log('cli: ' + which + ', ' + ctrl_p);

	if ( which == 13 ) { // return
	    
	    // Stop events.
	    event.preventDefault();
	    
	    // Get and ensure nice JS, wipe CLI clean.
	    var to_eval = jQuery('#' + command_line.get_id()).val();
	    if( to_eval != '' ){
		jQuery('#' + command_line.get_id()).val('');
		
		// Enter the new command into our history and bump the
		// index to the last thing pushed on.
		history_list.pop(); // pop the empty ''
		history_list.push(to_eval);
		history_list.push(''); // push new empty ''
		history_pointer = history_list.length -1;
		//log('// history: '+history_pointer+', '+history_list.length);
		
		// Log, eval, log.
		to_eval = bbop.core.ensure(to_eval, ';', 'back');
		log(to_eval);
		log('// ' + evaluate(to_eval));
		anchor.advance_log_to_bottom();

		return false;
	    }
	}else if( ctrl_p && which == 38 ){ // ctrl + up

	    // Stop stuff?
	    event.preventDefault();

	    if( history_pointer == 0 ){
		update_cli();
	    }else if( history_pointer > 0 ){
		history_pointer--;
		update_cli();
	    }

	    return false;

	}else if( ctrl_p && which == 40 ){ // ctrl + down

	    // Stop stuff?
	    event.preventDefault();

	    if( history_pointer < history_list.length -1 ){
		history_pointer++;
		update_cli();
	    }

	    return false;
	}

	return true;
    }
    //jQuery('#' + command_line.get_id()).keypress(read_cli);
    jQuery('#' + command_line.get_id()).keydown(read_cli);

    // Bind buffer eval.
    function read_buffer(){
	var to_eval = jQuery('#' + command_buffer.get_id()).val();
	if( to_eval != '' ){
	    //log(to_eval);
	    log('// Evaluating buffer...');
	    log('// ' + evaluate(to_eval));
	    anchor.advance_log_to_bottom();
	}
    }
    var cbbid = '#' + command_buffer_button.get_id();
    var command_buffer_button_props = {
	icons: { primary: "ui-icon-play"},
	disabled: false,
	text: true
    };    
    jQuery(cbbid).button(command_buffer_button_props).click(read_buffer);

    // Bind buffer clear.
    function clear_buffer(){
	//jQuery('#' + logging_console_id).val('');
	jQuery('#' + command_buffer.get_id()).empty();
    }
    var cbuid = '#' + clear_buffer_button.get_id();
    var clear_buffer_button_props = {
	icons: { primary: "ui-icon-trash"},
	disabled: false,
	text: true
    };
    jQuery(cbuid).button(clear_buffer_button_props).click(clear_buffer);

    // Bind log clear.
    function clear_log(){
	//jQuery('#' + logging_console_id).val('');
	jQuery('#' + logging_console_id).empty();
    }
    var clbid = '#' + clear_log_button.get_id();
    var clear_log_button_props = {
	icons: { primary: "ui-icon-trash"},
	disabled: false,
	text: true
    };
    jQuery(clbid).button(clear_log_button_props).click(clear_log);

    ///
    /// Bootstrap session.
    ///

    log('// [Session start.]');

    // Evaluate what we initially put in the command buffer.
    jQuery(cbbid).click();

    /*
     * Function: destroy
     * 
     * Remove the autocomplete and functionality from the DOM.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.destroy = function(){
	jQuery('#' + anchor._interface_id).val('');
    };

};
