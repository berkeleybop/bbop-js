/*
 * Package: message.js
 * 
 * Namespace: bbop.widget.message
 * 
 * TODO: Code needs to be cleaned with <bbop.html>.
 * 
 * BBOP object to produce a self-constructing/self-destructing
 * sliding message/announcments/warnings.
 * 
 * Note that this is a steal of some older code. We'll probably have
 * to clean this up a bit at some point.
 * 
 * These messages make use of the classes "bbop-js-message" and
 * "bbop-js-message-CTYPE", where CTYPE is one of "error",
 * "warning", or "notice".
 * 
 * Initial placement and the likes should be manipulated through
 * "bbop-js-message"--the created divs are append to the end of
 * the body and will not be particularly useful unless styled.
 * 
 * This is a completely self-contained UI.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: message
 * 
 * Contructor for the bbop.widget.message object.
 *
 * A trivial invocation might be something like:
 * : var m = new bbop.widget.message();
 * : m.notice("Hello, World!");
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  self
 */
bbop.widget.message = function(){
    
    this._is_a = 'bbop.widget.message';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (message): ' + str); }

    // Generate tags.
    function _generate_element(ctype, str){

	var message_classes = ['bbop-js-message',
			       'bbop-js-message-' + ctype];

	var message_elt =
	    new bbop.html.tag('div',
			      {'generate_id': true,
			       'class': message_classes.join(' ')},
			      '<h2>' + str + '</h2>');

    	jQuery("body").append(jQuery(message_elt.to_string()).hide());

	// jQuery-ify the element.
    	var elt = jQuery('#' + message_elt.get_id());
    	return elt;
    }

    // Destroy tags.
    function _destroy_element(){
    	jQuery(this).remove();
    }

    ///
    /// Notice and error handling.
    ///
    // elt.show().fadeIn('slow').fadeOut('slow', _destroy_element);

    /*
     * Function: notice
     * 
     * Temporarily display a messsage styled for notices.
     * 
     * Parameters:
     *  msg - the message
     * 
     * Returns
     *  n/a
     */
    this.notice = function(msg){
    	var elt = _generate_element('notice', msg);
    	elt.show().slideDown('slow').slideUp('slow', _destroy_element);
    };

    /*
     * Function: warning
     * 
     * Temporarily display a messsage styled for warnings.
     * 
     * Parameters:
     *  msg - the message
     * 
     * Returns
     *  n/a
     */
    this.warning = function(msg){
    	var elt = _generate_element('warning', msg);
    	elt.show().slideDown('slow').slideUp('slow', _destroy_element);
    };

    /*
     * Function: error
     * 
     * Temporarily display a messsage styled for errors.
     * 
     * Parameters:
     *  msg - the message
     * 
     * Returns
     *  n/a
     */
    this.error = function(msg){
    	var elt = _generate_element('error', msg);
    	elt.show().fadeTo(2500, 0.9).fadeOut(1000, _destroy_element);
    };

};
