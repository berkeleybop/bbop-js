/* 
 * Package: manager.js
 * 
 * Namespace: bbop.rest.manager
 * 
 * Generic BBOP manager for dealing with basic generic REST calls.
 * This specific one is designed to be overridden by its subclasses.
 * This one pretty much just uses its incoming resource string as the data.
 * Mostly for testing purposes.
 * 
 * Both a <bbop.rest.response> (or clean error data) and the manager
 * itself (this as anchor) should be passed to the callbacks.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }

/*
 * Constructor: manager
 * 
 * Contructor for the REST manager
 * 
 * Arguments:
 *  response_parser - the response handler class to use for each call
 * 
 * Returns:
 *  rest manager object
 * 
 * See also:
 *  <bbop.registry>
 */
bbop.rest.manager = function(response_handler){
    bbop.registry.call(this, ['success', 'error']);
    this._is_a = 'bbop.rest.manager';

    // Get a good self-reference point.
    var anchor = this;

    // Per-manager logger.
    this._logger = new bbop.logger(this._is_a);
    //this._logger.DEBUG = true;
    this._logger.DEBUG = false;
    function ll(str){ anchor._logger.kvetch(str); }

    // Handler instance.
    this._response_handler = response_handler;

    // The URL to query.
    this._qurl = null;

    // The argument payload to deliver to the URL.
    this._qpayload = {};

    // The way to do the above.
    this._qmethod = null;

    // Whether or not to prevent ajax events from going.
    // This may not be usable, or applicable, to all backends.
    this._safety = false;

    /*
     * Function: debug
     * 
     * Turn on or off the verbose messages. Uses <bbop.logger>, so
     * they should come out everywhere.
     * 
     * Parameters: 
     *  p - *[optional]* true or false for debugging
     *
     * Returns: 
     *  boolean; the current state of debugging
     */
    this.debug = function(p){
	if( p == true || p == false ){
	    this._logger.DEBUG = p;
	    // TODO: add debug parameter a la include_highlighting
	}
	return this._logger.DEBUG;
    };

    // The main callback function called after a successful AJAX call in
    // the update function.
    this._run_success_callbacks = function(in_data){
	ll('run success callbacks...');
	//var response = anchor.(in_data);
	var response = new anchor._response_handler(in_data);
	anchor.apply_callbacks('success', [response, anchor]);
    };

    // This set is called when we run into a problem.
    this._run_error_callbacks = function(in_data){
	ll('run error callbacks...');
	var response = new anchor._response_handler(in_data);
	anchor.apply_callbacks('error', [response, anchor]);
    };

    /*
     * Function: resource
     *
     * The base target URL for our operations.
     * 
     * Parameters:
     *  url - *[optional]* update resource target with string
     *
     * Returns:
     *  the url as string (or null)
     */
    this.resource = function(url){
	if( bbop.core.is_defined(url) && 
	    bbop.core.what_is(url) == 'string' ){
	    anchor._qurl = url;
	}
	return anchor._qurl;
    };

    /*
     * Function: payload
     *
     * The information to deliver to the resource.
     * 
     * Parameters:
     *  payload - *[optional]* update payload information
     *
     * Returns:
     *  a copy of the current payload
     */
    this.payload = function(payload){
	if( bbop.core.is_defined(payload) && 
	    bbop.core.what_is(payload) == 'object' ){
	    anchor._qpayload = payload;
	}
	return bbop.core.clone(anchor._qpayload);
    };

    /*
     * Function: method
     *
     * The method to use to get the resource, as a string.
     * 
     * Parameters:
     *  method - *[optional]* update aquisition method with string
     *
     * Returns:
     *  the string or null
     */
    this.method = function(method){
	if( bbop.core.is_defined(method) && 
	    bbop.core.what_is(method) == 'string' ){
	    anchor._qmethod = method;
	}
	return anchor._qmethod;
    };

    /*
     * Function: action
     *
     * This method is the most fundamental operation. It should
     * combine the URL, payload, and method in the ways appropriate to
     * the subclass engine. This one merely combines the string.
     * 
     * The method argument is naturally ignored in this dummy class.
     * 
     * Parameters:
     *  url - *[optional]* update resource target with string
     *  payload - *[serially optional]* object to represent arguments
     *  method - *[serially optional]* (GET, POST, etc.)
     *
     * Returns:
     *  the combined URL argument as string
     * 
     * See also:
     *  <update>
     */
    this.action = function(url, payload, method){
	if( bbop.core.is_defined(url) ){ anchor.resource(url); }
	if( bbop.core.is_defined(payload) ){ anchor.payload(payload); }
	if( bbop.core.is_defined(method) ){ anchor.method(method); }

	// Since there is no AJAX/REST in our case, we just loop back
	// with the argument string.
	if( bbop.core.is_defined(anchor.resource()) ){
	    return anchor.update('success');
	}else{
	    return anchor.update('error');
	}
    };
};
bbop.core.extend(bbop.rest.manager, bbop.registry);

/*
 * Function: update
 *
 * The user code to select the type of update (and thus the type
 * of callbacks to be called on data return).
 * 
 * Parameters: 
 *  callback_type - callback type string; 'success' and 'error'
 *
 * Returns:
 *  the query url
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.rest.manager.prototype.update = function(callback_type){

    // Conditional merging of the remaining variant parts.
    var qurl = this.resource();
    if( ! bbop.core.is_empty(this.payload()) ){
	var asm = bbop.core.get_assemble(this.payload());
	qurl = qurl + '?' + asm;
    }

    // Callbacks accordingly.
    if( callback_type == 'success' ){
	this._run_success_callbacks(qurl);
    }else if( callback_type == 'error' ){
	this._run_error_callbacks(qurl);
    }else{
    	throw new Error("Unknown callback_type: " + callback_type);
    }
    
    //ll('qurl: ' + qurl);
    return qurl;
};
