/* 
 * Package: ringo.js
 * 
 * Namespace: bbop.rest.manager.ringo
 * 
 * RingoJS BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * This may be madness.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.manager == "undefined" ){ bbop.rest.manager = {}; }

/*
 * Constructor: ringo
 * 
 * Contructor for the REST query manager; RingoJS-style.
 * 
 * Be aware that this version is a synchronous call. Also be aware
 * that this assumes we're in a ringo environment so that the require
 * for commonjs is around.
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
bbop.rest.manager.ringo = function(response_handler){
    bbop.rest.manager.call(this, response_handler);
    this._is_a = 'bbop.rest.manager.ringo';

    // Grab an http client.
    this._http_client = require("ringo/httpclient");
};
bbop.core.extend(bbop.rest.manager.ringo, bbop.rest.manager);

/*
 * Function: update
 *
 *  See the documentation in <bbop.rest.manager.js> on update to get more
 *  of the story. This override function adds functionality to RingoJS.
 *
 * Parameters: 
 *  callback_type - callback type string
 *
 * Returns:
 *  the query url (with any RingoJS specific paramteters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.rest.manager.ringo.prototype.update = function(callback_type){

    var anchor = this;
    var qurl = anchor.resource();
    //console.log('qurl: ' + qurl);

    // Grab the data from the server and pick the right callback group
    // accordingly.
    //anchor._callbacker = function(exchange){
    anchor._callbacker = function(data, status, contentType, exchange){
	// console.log('callback_type: ' + callback_type);
	// console.log('data: ' + data);
	// console.log('status: ' + status);
	// console.log('contentType: ' + contentType);
	// console.log('exchange: ' + exchange);

	var raw_str = exchange.content;
	//var raw_str = data;
	if( raw_str && raw_str != '' ){
	    var response = new anchor._response_handler(raw_str);
	    // console.log('response okay?: ' + response.okay());
	    anchor.apply_callbacks(callback_type, [response, this]);
	}else{
	    //this.apply_callbacks('error', ['no data', this]);
	    throw new Error('explody');
	}
    };
    // In RingoJS.
    var exchange = this._http_client.get(qurl, null, anchor._callbacker);
    // console.log('exchange.done: ' + exchange.done);

    return qurl;
};

/*
 * Function: fetch
 *
 * This is the synchronous data getter for RingoJS--probably your best
 * bet right now for scripting.
 * 
 * NOTE:
 * 
 * Parameters:
 *  url - url to get the data from
 *
 * Returns:
 *  a <bbop.rest.response> or null
 * 
 * Also see:
 *  <update>
 */
bbop.rest.manager.ringo.prototype.fetch = function(url){
    
    var retval = null;

    var qurl = this.resource(url);

    // Grab the data from the server and pick the right callback group
    // accordingly.
    var exchange = this._http_client.get(qurl); // in RingoJS
    // BUG/TODO: until I figure out sync.
    var raw_str = exchange.content;
    if( raw_str && raw_str != '' ){
	retval = new this._response_handler(raw_str);
    }else{
	//this.apply_callbacks('error', ['no data', this]);
	throw new Error('explody');
    }

    return retval;
};

