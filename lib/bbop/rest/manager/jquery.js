/* 
 * Package: jquery.js
 * 
 * Namespace: bbop.rest.manager.jquery
 * 
 * TODO!
 * 
 * jQuery BBOP manager for dealing with actual ajax calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * This should still be able to limp along (no ajax and no error
 * parsing) even outside of a jQuery environment.
 * 
 * Use <use_jsonp> is you are working against a JSONP service instead
 * of a non-cross-site JSON service.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.manager == "undefined" ){ bbop.rest.manager = {}; }

/*
 * Constructor: jquery
 * 
 * Contructor for the jQuery REST manager
 * 
 * Arguments:
 *  response_handler
 * 
 * Returns:
 *  REST manager object
 * 
 * See also:
 *  <bbop.rest.manager>
 */
bbop.rest.manager.jquery = function(response_handler){
    bbop.rest.manager.call(this, response_handler);
    this._is_a = 'bbop.rest.manager.jquery';

    this._use_jsonp = false;

    // Before anything else, if we cannot find a viable jQuery library
    // for use, we're going to create a fake one so we can still test
    // and work in a non-browser/networked environment.
    var anchor = this;
    anchor.JQ = new bbop.rest.manager.jquery_faux_ajax();
    try{ // some interpreters might not like this kind of probing
    	if( typeof(jQuery) !== 'undefined' ){
    	    //JQ = jQuery;
    	    anchor.JQ = jQuery.noConflict();
    	}
    }catch (x){
    }finally{
    	var got = bbop.core.what_is(anchor.JQ);
    	if( got && got == 'bbop.rest.manager.jquery_faux_ajax'){
    	}else{
    	    got = 'jQuery';
    	}
    	ll('Using ' + got + ' for ajax calls.');
    }
};
bbop.core.extend(bbop.rest.manager.jquery, bbop.rest.manager);

/*
 * Function: use_jsonp
 *
 * Set the jQuery engine to use JSONP handling instead of the default
 * JSON. If set, the callback function to use will be given my the
 * argument "json.wrf" (like Solr), so consider that special.
 * 
 * Parameters: 
 *  use_p - *[optional]* external setter for 
 *
 * Returns:
 *  boolean
 */
bbop.rest.manager.jquery.prototype.use_jsonp = function(use_p){
    var anchor = this;
    if( bbop.core.is_defined(use_p) ){
	if( use_p == true || use_p == false ){
	    anchor._use_jsonp = use_p;
	}
    }
    return anchor._use_jsonp;
};

/*
 * Function: update
 *
 *  See the documentation in <manager.js> on update to get more
 *  of the story. This override function adds functionality for
 *  jQuery.
 * 
 * Parameters: 
 *  callback_type - callback type string (so far unused)
 *
 * Returns:
 *  the query url (with the jQuery callback specific parameters)
 */
bbop.rest.manager.jquery.prototype.update = function(callback_type){

    var anchor = this;
    
    // Assemble request.
    // Conditional merging of the remaining variant parts.
    var qurl = this.resource();
    var args = '';
    if( ! bbop.core.is_empty(this.payload()) ){
	var asm = bbop.core.get_assemble(this.payload());
	args = '?' + asm;
    }
    var final_url = qurl + args;

    // The base jQuery Ajax args we need with the setup we have.
    var jq_vars = {
    	url: final_url,
    	dataType: 'json',
    	type: "GET"
    };

    // If we're going to use JSONP instead of the defaults, set that now.
    if( anchor.use_jsonp() ){
	jq_vars['dataType'] = 'jsonp';
	jq_vars['jsonp'] = 'json.wrf';
    }

    // What to do if an error is triggered.
    // Remember that with jQuery, when using JSONP, there is no error.
    function on_error(xhr, status, error) {
	var response = new anchor._response_handler(null);
	response.okay(false);
	response.message(error);
	response.message_type(status);
	anchor.apply_callbacks('error', [response, anchor]);
    }

    function on_success(raw_data, status, xhr){
	var response = new anchor._response_handler(raw_data);
	if( response && response.okay() ){
	    anchor.apply_callbacks('success', [response, anchor]);
	}else{
	    // Make sure that there is something there to
	    // hold on to.
	    if( ! response ){
		response = new anchor._response_handler(null);
		response.okay(false);
		response.message_type(status);
		response.message('null response');
	    }else{
		response.message_type(status);
		response.message('bad response');
	    }
	    //anchor.apply_callbacks('error', [response, anchor]);
	    anchor.apply_callbacks('error', [raw_data, anchor]);
	}
    }

    // Setup JSONP for Solr and jQuery ajax-specific parameters.
    jq_vars['success'] = on_success;
    jq_vars['error'] = on_error;
    //done: _callback_type_decider, // decide & run search or reset
    //fail: _run_error_callbacks, // run error callbacks
    //always: function(){} // do I need this?
    anchor.JQ.ajax(jq_vars);
    //anchor.JQ.ajax(final_url, jq_vars);
    
    return final_url;
};

/*
 * Namespace: bbop.rest.manager.jquery_faux_ajax
 *
 * Constructor: faux_ajax
 * 
 * Contructor for a fake and inactive Ajax. Used by bbop.rest.manager.jquery
 * in (testing) environments where jQuery is not available.
 * 
 * Returns:
 *  faux_ajax object
 */
bbop.rest.manager.jquery_faux_ajax = function (){
    this._is_a = 'bbop.rest.manager.jquery_faux_ajax';

    /*
     * Function: ajax
     *
     * Fake call to jQuery's ajax.
     *
     * Parameters: 
     *  args - whatever
     *
     * Returns:
     *  null
     */
    this.ajax = function(args){
	return null;
    };
};
