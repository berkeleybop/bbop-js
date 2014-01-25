/* 
 * Package: rhino.js
 * 
 * Namespace: bbop.rest.manager.rhino
 * 
 * Rhino BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * This is a very simple subclass that does not get into the messiness
 * of errors and codes since we're using the trivial readURL method.
 * 
 * TODO/BUG: Does not handle "error" besides giving an "empty"
 * response.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.manager == "undefined" ){ bbop.rest.manager = {}; }

/*
 * Constructor: rhino
 * 
 * Contructor for the REST query manager; Rhino-style.
 * 
 * Be aware that this version is a synchronous call.
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
bbop.rest.manager.rhino = function(response_handler){
    bbop.rest.manager.call(this, response_handler);
    this._is_a = 'bbop.rest.manager.rhino';
};
bbop.core.extend(bbop.rest.manager.rhino, bbop.rest.manager);

/*
 * Function: update
 *
 *  See the documentation in <bbop/rest/manager.js> on update to get more
 *  of the story. This override function adds functionality to Rhino.
 *
 * Parameters: 
 *  callback_type - callback type string
 *
 * Returns:
 *  the query url (with any Rhino specific paramteters)
 * 
 * Also see:
 *  <fetch>
 */
bbop.rest.manager.rhino.prototype.update = function(callback_type){

    // 
    var qurl = this.assemble();

    // Grab the data from the server and pick the right callback group
    // accordingly.
    var raw_str = readUrl(qurl); // in Rhino
    if( raw_str && raw_str != '' ){
	var response = new this._response_handler(raw_str);
	this.apply_callbacks(callback_type, [response, this]);
    }else{
	var response = new anchor._response_handler(null);
	this.apply_callbacks('error', [response, this]);
	//throw new Error('explody');
    }

    return qurl;
};

/*
 * Function: fetch
 *
 * This is the synchronous data getter for Rhino--probably your best
 * bet right now for scripting.
 * 
 * Parameters:
 *  n/a 
 *
 * Returns:
 *  a <bbop.rest.response> (or subclass) or null
 * 
 * Also see:
 *  <update>
 */
bbop.rest.manager.rhino.prototype.fetch = function(url, payload){
    
    var retval = null;

    // Update if necessary.
    if( url ){ this.resource(url); }
    if( payload ){ this.payload(payload); }

    var qurl = this.assemble();
    
    // Grab the data from the server and pick the right callback group
    // accordingly.
    var raw_str = readUrl(qurl); // in Rhino
    if( raw_str && raw_str != '' ){
	retval = new this._response_handler(raw_str);
    }else{
	retval = new anchor._response_handler(null);
	//this.apply_callbacks('error', ['no data', this]);
	//throw new Error('explody');
    }

    return retval;
};

