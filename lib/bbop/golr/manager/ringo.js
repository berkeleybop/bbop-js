/* 
 * Package: ringo.js
 * 
 * Namespace: bbop.golr.manager.ringo
 * 
 * Ringo BBOP manager for dealing with remote GOlr calls. Remember,
 * this is actually a "subclass" of <bbop.golr.manager>.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }
if ( typeof bbop.golr.manager == "undefined" ){ bbop.golr.manager = {}; }

/*
 * Constructor: ringo
 * 
 * Contructor for the GOlr query manager; Ringo flavor. YMMV.
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 * 
 * Returns:
 *  golr manager object
 * 
 * See also:
 *  <bbop.golr.manager>
 */
bbop.golr.manager.ringo = function (golr_loc, golr_conf_obj){

    // We are a registry like this:
    bbop.golr.manager.call(this, golr_loc, golr_conf_obj);
    this._is_a = 'bbop.golr.manager.ringo';

    // Grab the http client.
    this._http_client = require("ringo/httpclient");
};
bbop.core.extend(bbop.golr.manager.ringo, bbop.golr.manager);

/*
 * Function: update
 *
 *  See the documentation in <golr_manager.js> on update to get more
 *  of the story. This override function adds functionality to Ringo.
 *
 * Parameters: 
 *  callback_type - callback type string
 *  rows - *[serially optional]* integer; the number of rows to return
 *  start - *[serially optional]* integer; the offset of the returned rows
 *
 * Returns:
 *  the query url (with any Ringo specific paramteters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.golr.manager.ringo.prototype.update = function(callback_type,
						    rows, start){
    // Get "parents" url first.
    var parent_update = bbop.golr.manager.prototype.update;
    var qurl = parent_update.call(this, callback_type, rows, start);

    // // 
    // var logger = new bbop.logger(this._is_a);
    // //this._logger = new bbop.logger(this._is_a);
    // logger.DEBUG = true;
    // function ll(str){ logger.kvetch(str); }

    var anchor = this;
    
    // Grab the data from the server and pick the right callback group
    // accordingly.
    anchor._callbacker = function(data, status, contentType, exchange){

	// 
	var raw_str = exchange.content;
	var json_data = null;
	if( raw_str && raw_str != '' ){
	    json_data = JSON.parse(raw_str);
	    if( json_data ){
		var response = new bbop.golr.response(json_data);
		anchor.apply_callbacks(callback_type, [response, this]);
	    }else{
		this.apply_callbacks('error', ['unparsable data', this]);
	    }
	}else{
	    this.apply_callbacks('error', ['no data', this]);
	}
    };
    var exchange = this._http_client.get(qurl, null, anchor._callbacker);
    
    return qurl;
};
