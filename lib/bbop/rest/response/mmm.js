/* 
 * Package: mmm.js
 * 
 * Namespace: bbop.rest.response.mmm
 * 
 * Generic BBOP handler for dealing with the gross parsing of
 * responses from the GO Molecular Model Manager REST server JSON
 * responses.
 * 
 * It will detect if the incoming response is structured correctly and
 * give safe access to fields and properties.
 * 
 * It is not meant to be a model for the parts in the data section.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.response == "undefined" ){ bbop.rest.response = {}; }

/*
 * Constructor: mmm
 * 
 * Contructor for a GO MMM REST JSON response object.
 * 
 * The constructor argument is an object or a string.
 * 
 * Arguments:
 *  raw_data - the JSON object as a string or object
 * 
 * Returns:
 *  response object
 */
bbop.rest.response.mmm = function(raw_data){
    bbop.rest.response.call(this);
    this._is_a = 'bbop.rest.response.mmm';

    // Add the required commentary, inconsistency, and data.
    this._commentary = null;
    this._data = null;

    // Start with the assumption that the response is bad, try and
    // prove otherwise.
    this.okay(false);

    // Raw will only be provided in that cases that it makes sense.
    this._raw = null;
    
    // If we have data coming in...
    if( ! raw_data ){
	
	this.message('empty response in handler');
	this.message_type('error');

    }else{

	// And it looks like something we might be able to deal with...
	var itsa = bbop.core.what_is(raw_data);
	if( itsa != 'string' && itsa != 'object' ){
	    
	    // No idea what this thing is...
	    this.message('bad argument type in handler');
	    this.message_type('error');

	}else{
	    
	    // Try to make the string an object.
	    if( itsa == 'string' ){
		try {
		    this._raw = bbop.json.parse(raw_data);
		}catch(e){
		    // Didn't make it--chuck it to create a signal.
		    this._raw = null;
		    this.message('handler could not parse string response');
		    this.message_type('error');
		}
	    }else{
		// Looks like somebody else got here first.
		this._raw = raw_data;
	    }

	    // If we managed to define some kind of raw incoming data
	    // that is, or has been parsed to, a model, probe it to
	    // see if it is structured correctly.
	    if( this._raw ){

		// Check required fields.
		var data = this._raw;
		// These must always be defined.
		if( data && data['message_type'] && data['message'] ){

		    var odata = data['data'] || null;
		    var cdata = data['commentary'] || null;

		    // If data, object or array.
		    if( odata && bbop.core.what_is(odata) != 'object' &&
			bbop.core.what_is(odata) != 'array' ){
			this.message('data not object');
			this.message_type('error');
		    }else{
			// If commentary, object.
			if( cdata && bbop.core.what_is(cdata) != 'object' ){
			    this.message('commentary not object');
			    this.message_type('error');
			}else{
			    // Looks fine then I guess.
			    this.okay(true);
			    this.message_type(data['message_type']);
			    this.message(data['message']);

			    // Add any additional fields.
			    if( cdata ){ this._commentary = cdata; }
			    if( odata ){ this._data = odata; }
			}
		    }
		}
	    }
	}
    }
};
bbop.core.extend(bbop.rest.response.mmm, bbop.rest.response);

/*
 * Function: commentary
 * 
 * Returns the commentary object (whatever that might be in any given
 * case).
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  copy of commentary object or null
 */
bbop.rest.response.mmm.prototype.commentary = function(){
    var ret = null;
    if( this._commentary ){
	ret = bbop.core.clone(this._commentary);
    }
    return ret;
};

/*
 * Function: data
 * 
 * Returns the data object (whatever that might be in any given
 * case). This grossly returns all response data, if any.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  copy of data object or null
 */
bbop.rest.response.mmm.prototype.data = function(){
    var ret = null;
    if( this._data ){
	ret = bbop.core.clone(this._data);
    }
    return ret;
};

/*
 * Function: model_id
 * 
 * Returns the model id of the response.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  string or null
 */
bbop.rest.response.mmm.prototype.model_id = function(){
    var ret = null;
    if( this._data && this._data['id'] ){
	ret = this._data['id'];
    }
    return ret;
};

/*
 * Function: inconsistent_p
 * 
 * Returns true or false on whether or not the returned model is
 * thought to be inconsistent. Starting assumption is that it is not.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  true or false
 */
bbop.rest.response.mmm.prototype.inconsistent_p = function(){
    var ret = false;
    if( this._data &&
	typeof(this._data['inconsistent_p']) !== 'undefined' &&
	this._data['inconsistent_p'] == true ){
	ret = true;
    }
    return ret;
};

/*
 * Function: facts
 * 
 * Returns a list of the facts in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbop.rest.response.mmm.prototype.facts = function(){
    var ret = [];
    if( this._data && this._data['facts'] && 
	bbop.core.is_array(this._data['facts']) ){
	ret = this._data['facts'];
    }
    return ret;
};

/*
 * Function: properties
 * 
 * Returns a list of the properties in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbop.rest.response.mmm.prototype.properties = function(){
    var ret = [];
    if( this._data && this._data['properties'] && 
	bbop.core.is_array(this._data['properties']) ){
	ret = this._data['properties'];
    }
    return ret;
};

/*
 * Function: individuals
 * 
 * Returns a list of the individuals in the response. Empty list if none.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbop.rest.response.mmm.prototype.individuals = function(){
    var ret = [];
    if( this._data && this._data['individuals'] && 
	bbop.core.is_array(this._data['individuals']) ){
	ret = this._data['individuals'];
    }
    return ret;
};

/*
 * Function: relations
 * 
 * Returns a list of the relations found in the response. Likely not
 * to be there, so check the return.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  list
 */
bbop.rest.response.mmm.prototype.relations = function(){
    var ret = [];
    if( this._data && this._data['relations'] && 
	bbop.core.is_array(this._data['relations']) ){
	ret = this._data['relations'];
    }
    return ret;
};
