/* 
 * Package: rhino.js
 * 
 * Namespace: bbop.rest.manager.rhino
 * 
 * Rhino BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * This may be madness.
 */

// Setup the internal requirements.
bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'registry');
bbop.core.require('bbop', 'rest', 'response');
bbop.core.require('bbop', 'rest', 'manager');
bbop.core.namespace('bbop', 'rest', 'manager', 'rhino');

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
 *  <get_query_url>
 */
bbop.rest.manager.rhino.prototype.update = function(callback_type){

    var qurl = this.resource();

    // Grab the data from the server and pick the right callback group
    // accordingly.
    var raw_str = readUrl(qurl); // in Rhino
    if( raw_str && raw_str != '' ){
	var response = new this._response_handler(raw_str);
	this.apply_callbacks(callback_type, [response, this]);
    }else{
	//this.apply_callbacks('error', ['no data', this]);
	throw new Error('explody');
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
 *  a <bbop.rest.response> or null
 * 
 * Also see:
 *  <update>
 */
bbop.rest.manager.rhino.prototype.fetch = function(url){
    
    var retval = null;

    // Update the url if necessary.
    var qurl = this.resource(url);
    
    // Grab the data from the server and pick the right callback group
    // accordingly.
    var raw_str = readUrl(qurl); // in Rhino
    if( raw_str && raw_str != '' ){
	retval = new this._response_handler(raw_str);
    }else{
	//this.apply_callbacks('error', ['no data', this]);
	throw new Error('explody');
    }

    return retval;
};

