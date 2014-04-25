/* 
 * Package: json.js
 * 
 * Namespace: bbop.rest.response.json
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from a REST JSON server.
 * 
 * It will detect if the incoming response is a string, and if so, try
 * to parse it to JSON. Otherwise, if the raw return is already an
 * Object, we assume that somebody got to it before us (e.g. jQuery's
 * handling).
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.response == "undefined" ){ bbop.rest.response = {}; }

/*
 * Constructor: json
 * 
 * Contructor for a REST JSON response object.
 * 
 * The constructor argument is an object, not a string.
 * 
 * Arguments:
 *  json_data - the JSON object as a string (as returned from a request)
 * 
 * Returns:
 *  rest response object
 */
bbop.rest.response.json = function(json_data){
    bbop.rest.response.call(this);
    this._is_a = 'bbop.rest.response.json';

    // The raw incoming document.
    //this._raw_string = json_data_str;
    this._raw_string = null;
    this._okay = null;

    if( json_data ){

	if( bbop.core.what_is(json_data) == 'string' ){

	    // Try and parse out strings.
	    try {
		this._raw = bbop.json.parse(json_data);
		this._okay = true;
	    }catch(e){
		// Didn't make it, but still a string.
		this._raw = json_data;
		this._okay = false;
	    }

	}else if( bbop.core.what_is(json_data) == 'object' ||
		  bbop.core.what_is(json_data) == 'array' ){

	    // Looks like somebody else got here first.
	    this._raw = json_data;
	    this._okay = true;
	    
	}else{

	    // No idea what this thing is...
	    this._raw = null;
	    this._okay = null;
	}
    }
};
bbop.core.extend(bbop.rest.response.json, bbop.rest.response);

// /*
//  * Function: string
//  * 
//  * returns a string of the incoming response
//  * 
//  * Arguments:
//  *  n/a
//  * 
//  * Returns:
//  *  raw response string
//  */
// bbop.rest.response.json.prototype.string = function(){
//     return this._raw_string;
// };
