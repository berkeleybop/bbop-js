/* 
 * Package: node.js
 * 
 * Namespace: bbop.rest.manager.node
 * 
 * NodeJS BBOP manager for dealing with remote calls. Remember,
 * this is actually a "subclass" of <bbop.rest.manager>.
 * 
 * TODO/BUG: Does not handle "error" besides giving an "empty"
 * response.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.rest == "undefined" ){ bbop.rest = {}; }
if ( typeof bbop.rest.manager == "undefined" ){ bbop.rest.manager = {}; }

/*
 * Constructor: node
 * 
 * Contructor for the REST query manager; NodeJS-style.
 * 
 * This assumes we're in a node environment so that the require
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
bbop.rest.manager.node = function(response_handler){
    bbop.rest.manager.call(this, response_handler);
    this._is_a = 'bbop.rest.manager.node';

    // Grab an http client.
    this._http_client = require('http');
    this._url_parser = require('url');
};
bbop.core.extend(bbop.rest.manager.node, bbop.rest.manager);

/*
 * Function: update
 *
 *  See the documentation in <bbop.rest.manager.js> on update to get more
 *  of the story. This override function adds functionality to NodeJS.
 *
 * Parameters: 
 *  callback_type - callback type string (so far unused)
 *
 * Returns:
 *  the query url (with any NodeJS specific parameters)
 */
bbop.rest.manager.node.prototype.update = function(callback_type){

    var anchor = this;

    // What to do if an error is triggered.
    function on_error(e) {
	console.log('problem with request: ' + e.message);
	var response = new anchor._response_handler(null);
	response.okay(false);
	response.message(e.message);
	response.message_type('error');
	anchor.apply_callbacks('error', [response, anchor]);
    }

    // Two things to do here: 1) collect data and 2) what to do with
    // it when we're done (create response).
    function on_connect(res){
	//console.log('STATUS: ' + res.statusCode);
	//console.log('HEADERS: ' + JSON.stringify(res.headers));
	res.setEncoding('utf8');
	var raw_data = '';
	res.on('data', function (chunk) {
	    //console.log('BODY: ' + chunk);
	    raw_data = raw_data + chunk;
	});
	// Throw to .
	res.on('end', function () {
	    //console.log('END with: ' + raw_data);
	    var response = new anchor._response_handler(raw_data);
	    if( response && response.okay() ){
		anchor.apply_callbacks('success', [response, anchor]);
	    }else{
		// Make sure that there is something there to
		// hold on to.
		if( ! response ){
		    response = new anchor._response_handler(null);
		    response.okay(false);
		    response.message_type('error');
		    response.message('null response');
		}else{
		    response.message_type('error');
		    response.message('bad response');
		}
		anchor.apply_callbacks('error', [response, anchor]);
	    }
	});
    }

    // Conditional merging of the remaining variant parts.
    var qurl = this.resource();
    var args = '';
    if( ! bbop.core.is_empty(this.payload()) ){
	var asm = bbop.core.get_assemble(this.payload());
	args = '?' + asm;
    }

    //qurl = 'http://amigo2.berkeleybop.org/cgi-bin/amigo2/amigo/term/GO:0022008/json';
    var final_url = qurl + args;

    // http://nodejs.org/api/url.html
    var purl = anchor._url_parser.parse(final_url);
    var req_opts = {
    	//'hostname': 'localhost',
    	//'path': '/cgi-bin/amigo2/amigo/term/GO:0022008/json',
	'port': 80,
	'method': 'GET'
    };
    // Tranfer the intersting bit over.
    bbop.core.each(['protocol', 'hostname', 'port', 'path'],
		   function(purl_prop){
		       if( purl[purl_prop] ){
			   req_opts[purl_prop] = purl[purl_prop];
		       }
		   });
    // And the method.
    var mth = anchor.method();
    if( mth && mth != 'get' ){
    	req_opts['method'] = mth;
    }
    var req = anchor._http_client.request(req_opts, on_connect);
    // var req = anchor._http_client.request(final_url, on_connect);

    req.on('error', on_error);
    
    // write data to request body
    //req.write('data\n');
    //req.write('data\n');
    req.end();
    
    return final_url;
};
