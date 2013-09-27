/* 
 * Package: response.js
 * 
 * Namespace: bbop.rest.response
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from a REST server. This is just an example pass-thru
 * handler that needs to be overridden (see subclasses).
 */

// Setup the internal requirements.
bbop.core.require('bbop', 'core');
bbop.core.namespace('bbop', 'rest', 'response');

/*
 * Constructor: response
 * 
 * Contructor for a REST query response object.
 * 
 * The constructor argument is an object, not a string.
 * 
 * Arguments:
 *  in_data - the JSON data (as object) returned from a request
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
};

/*
 * Function: raw
 * 
 * returns a pointer to the initial response object
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
 * Okay caches its return value.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  boolean
 */
bbop.rest.response.prototype.okay = function(){

    if( this._raw != null ){
	this._okay = true;
    }else{
	this._okay = false;
    }

    return this._okay;
};
