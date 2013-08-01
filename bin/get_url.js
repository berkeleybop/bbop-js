#!/usr/bin/ringo
/* 
 * Package: get_url.js
 * 
 * This is an example RingoJS script using a BBOP REST engine.
 * 
 * Usage like:
 *  : get_url.js
 */

// BUG: This all is a temporary kludge until we work out our CommonJS
// issues.
var bbop = require("./bbop-commonjs");
bbop = bbop.bbop; // yes, I know--just a temporary thing during dev...

// The target JSON response we'll use for the example.
var target = 'http://sourceforge.net/rest/p/geneontology/ontology-requests/';

// Example of asynchronous style.
var m1 = new bbop.rest.manager.ringo(bbop.rest.response.json);
m1.register('success', '0',
	    function(resp, man){
		console.log("page: " + resp.raw()['page'] + " (ex 1)");
	    });
//m1.resource(target);
//m1.update('success');
m1.get(target);

// Example of synchronous style.
var m2 = new bbop.rest.manager.ringo(bbop.rest.response.json);
var resp = m2.fetch(target);
console.log("page: " + resp.raw()['page'] + " (ex 2)");
