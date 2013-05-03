/*
 * Package: spinner.js
 * 
 * Namespace: bbop.widget.spinner
 * 
 * BBOP object to produce a self-constructing/self-destructing
 * spinner. It can display various spinner/throbber images and can
 * have a set timeout to deal with annoying servers and exotic race
 * conditions.
 * 
 * The class of the spinner image is "bbop_widget_spinner".
 * 
 * Visibility is controlled by the application and removal of
 * "bbop_widget_spinner_hidden".
 * 
 * This is a completely self-contained UI.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
bbop.core.require('bbop', 'html');
bbop.core.namespace('bbop', 'widget', 'spinner');

/*
 * Constructor: spinner
 * 
 * Contructor for the bbop.widget.spinner object.
 * 
 * A trivial invocation might be something like:
 * : var s = new bbop.widget.spinner("inf01", "http://localhost/amigo2/images/waiting_ajax.gif");
 * : s.hide();
 * : s.show();
 * 
 * The optional hash arguments look like:
 *  timeout - the number of seconds to wait before invoking <clear_waits>; 0 indicates waiting forever; defaults to 10
 *  visible_p - whether or not the spinner is visible on initialization; true|false; defaults to true
 *  classes - a string of space-separated classes that you want added to the spinner image
 * 
 * Arguments:
 *  host_elt_id - string id of the place to place the widget
 *  img_src - the URL for the image to use in the spinner
 *  argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  self
 */
bbop.widget.spinner = function(host_elt_id, img_src, argument_hash){
    
    this._is_a = 'bbop.widget.spinner';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (spinner): ' + str); }

    // Our argument default hash.
    var default_hash = {
	'timeout': 10,
	'visible_p': true
    };
    var folding_hash = argument_hash || {};
    var arg_hash = bbop.core.fold(default_hash, folding_hash);

    // Spin out arguments.
    var timeout = arg_hash['timeout'];
    var visible_p = arg_hash['visible_p'];
    var classes = arg_hash['classes'];

    ///
    /// Part 1: Append the image into the given element id.
    ///

    // Use the incoming arguments to help determine the default
    // classes on the element.'
    var spinner_classes = ['bbop_widget_spinner'];
    if( ! visible_p ){
	spinner_classes.push('bbop_widget_spinner_hidden');
    }

    // Create new element.
    var spinner_elt =
	new bbop.html.image({'generate_id': true,
			     'src': img_src,
			     'title': "Please wait...",
			     'class': spinner_classes.join(' '),
			     'alt': "[Wait spinner]"});
    var spinner_elt_id = spinner_elt.get_id();

    // Append img to end of given element.
    jQuery('#' + host_elt_id).append(spinner_elt.to_string());
    
    ///
    /// Part 2: Dynamic display management.
    ///

    // Counts and accounting.
    var current_waits = 0;

    /*
     * Function: show
     * 
     * Show the spinner if it is hidden (regardless of current waits).
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.show = function(){
	ll("show");
	jQuery('#' + spinner_elt_id).removeClass('bbop_widget_spinner_hidden');	
    };

    /*
     * Function: hide
     * 
     * Hide the spinner if it is showing (regardless of current waits).
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.hide = function(){
	ll("hide");
	jQuery('#' + spinner_elt_id).addClass('bbop_widget_spinner_hidden');	
    };

    /*
     * Function: start_wait
     * 
     * Displays the initial spinner if it is not already displayed and
     * adds one to the wait count.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.start_wait = function(){

	ll("Start outstanding waits: " + current_waits);

	// 
	if( current_waits == 0 ){
	    anchor.show();
	}

	current_waits++;
    };

    /*
     * Function: finish_wait
     * 
     * Removes one from the wait count and hides the spinner if the
     * number of outstanding waits has reached zero.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.finish_wait = function(){

	ll("Finish outstanding waits: " + current_waits);

	// Stay at least at 0--we might have stragglers or incoming
	// after a reset.
	if( current_waits > 0 ){
	    current_waits--;	    
	}

	// Gone if we are not waiting for anything.
	if( current_waits == 0 ){
	    anchor.hide();
	}
    };

    /*
     * Function: clear_waits
     * 
     * Hides the spinner and resets all the waiting counters. Can be
     * used during things like server errors or collisions.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns
     *  n/a
     */
    this.clear_waits = function(){
	current_waits = 0;
	anchor.hide();
    };
};
