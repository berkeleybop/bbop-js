/* 
 * Package: json.js
 * 
 * Namespace: bbop.rest.response.json
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from a REST JSON server.
 */

// Setup the internal requirements.
bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'json');
bbop.core.require('bbop', 'rest', 'response');
bbop.core.namespace('bbop', 'rest', 'response', 'json');

/*
 * Constructor: json
 * 
 * Contructor for a REST JSON response object.
 * 
 * The constructor argument is an object, not a string.
 * 
 * Arguments:
 *  json_data - the JSON data (as object) returned from a request
 * 
 * Returns:
 *  rest response object
 */
bbop.rest.response.json = function(json_data){
    bbop.rest.response.call(this);
    this._is_a = 'bbop.rest.response.json';

    // The raw incoming document.
    this._raw_string = json_data;
    this._okay = null;

    try {
	this._raw = bbop.json.parse(json_data);
	this._okay = true;
    }catch(e){
	// Didn't make it.
	this._raw = null;
	this._okay = false;
    }

};
bbop.core.extend(bbop.rest.response.json, bbop.rest.response);

/*
 * Function: raw
 * 
 * returns a pointer to the parsed response object
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  raw response
 */
bbop.rest.response.json.prototype.raw = function(){
    return this._raw;
};

/*
 * Function: string
 * 
 * returns a string of the incoming response
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  raw response string
 */
bbop.rest.response.json.prototype.string = function(){
    return this._raw_string;
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

    if( this._okay == null ){
	this._okay = false;
    }

    return this._okay;
};
