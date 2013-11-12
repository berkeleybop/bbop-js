/* 
 * Package: response.js
 * 
 * Namespace: bbop.rest.response
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from a REST server. This is just an example pass-thru
 * handler that needs to be overridden (see subclasses).
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

    print('a: ' + this._okay);
    if( this._okay == null ){ // only go if answer not cached
	print('b: ' + this._raw);
	if( ! this._raw || this._raw == '' ){
	    print('c: if');
	    this._okay = false;
	}else{
	    print('c: else');
	    this._okay = true;
	}
    }
    
    return this._okay;
};
