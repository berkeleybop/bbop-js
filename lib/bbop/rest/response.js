/* 
 * Package: response.js
 * 
 * Namespace: bbop.rest.response
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from a REST server. This is just an example pass-thru
 * handler that needs to be overridden (see subclasses).
 * 
 * You may note that things like status and status codes are not part
 * of the base response. The reason is is that not all methods of REST
 * in the environments that we use support them. For example: readURL
 * in rhino. For this reason, the "health" of the response is left to
 * the simple okay() function--just enought to be able to choose
 * between "success" and "failure" in the managers. To give a bit more
 * information in case of early error, there is message and
 * message_type.
 * 
 * Similarly, there are no toeholds in the returned data except
 * raw(). All data views and operations are implemented in the
 * subclasses.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }

/*
 * Constructor: response
 * 
 * Contructor for a REST query response object.
 * 
 * The constructor argument is an object, not a string.
 * 
 * Arguments:
 *  in_data - the string returned from a request
 * 
 * Returns:
 *  rest response object
 */
bbop.rest.response = function(in_data){
    this._is_a = 'bbop.rest.response';

    // The raw incoming document.
    this._raw = in_data;

    // Cache for repeated calls to okay().
    this._okay = null;
    this._message = null;
    this._message_type = null;
};

/*
 * Function: raw
 * 
 * Returns the initial response object, whatever it was.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  object
 */
bbop.rest.response.prototype.raw = function(){
    return this._raw;
};

/*
 * Function: okay
 * 
 * Simple return verification of sane response from server.
 * 
 * This okay() caches its return value, so harder probes don't need to
 * be performed more than once.
 * 
 * Arguments:
 *  okay_p - *[optional]* setter for okay
 * 
 * Returns:
 *  boolean
 */
bbop.rest.response.prototype.okay = function(okay_p){

    // Optionally set from the outside.
    if( bbop.core.is_defined(okay_p) ){
	this._okay = okay_p;
    }

    //print('a: ' + this._okay);
    if( this._okay == null ){ // only go if answer not cached
	//print('b: ' + this._raw);
	if( ! this._raw || this._raw == '' ){
	    //print('c: if');
	    this._okay = false;
	}else{
	    //print('c: else');
	    this._okay = true;
	}
    }
    
    return this._okay;
};

/*
 * Function: message
 * 
 * A message that the response wants to let you know about its
 * creation.
 * 
 * Arguments:
 *  message - *[optional]* setter for message
 * 
 * Returns:
 *  message string
 */
bbop.rest.response.prototype.message = function(message){
    if( bbop.core.is_defined(message) ){
	this._message = message;
    }
    return this._message;
};

/*
 * Function: message_type
 * 
 * A message about the message (a string classifier) that the response
 * wants to let you know about its message.
 * 
 * Arguments:
 *  message_type - *[optional]* setter for message_type
 * 
 * Returns:
 *  message type string
 */
bbop.rest.response.prototype.message_type = function(message_type){
    if( bbop.core.is_defined(message_type) ){
	this._message_type = message_type;
    }
    return this._message_type;
};
