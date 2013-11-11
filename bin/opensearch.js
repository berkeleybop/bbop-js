#!/usr/bin/ringo
/*
 * Package: opensearch.js
 * 
 * This is a Ringo script.
 * 
 * Start an http service and return opensearch-style responses.
 * 
 * Usage like:
 *  : opensearch.js <host> <port>
 * 
 * See also:
 * <node_runner.js>
 */

function _ll(s){
   console.log(s);
};
// // Temp logger.
// var logger = new bbop.logger();
// logger.DEBUG = true;
// function _ll(str){ logger.kvetch('TT: ' + str); }

//exports.app = function(req) {
var app = function(req) {
    return {
        status: 200,
        headers: {"Content-Type": "text/plain"},
        body: ["Hello, World!"]
    };
};
//if (require.main == module) {
// require('ringo/httpserver').main(module.id);
var {Server} = require('ringo/httpserver');
    var server = new Server({app: app, port: 8910}); // default port can be changed with "--port PORT" argument
    server.start();

//}

// #!/home/sjcarbon/local/src/tarballs/node-v0.8.18-linux-x64/bin/node
// /* Package: opensearch.js
//  * 
//  * This is a node_runner.js script.
//  * 
//  * Start an http service and return opensearch-style responses.
//  * 
//  * Usage like:
//  *  : node_runner.js opensearch.js <port>
//  * 
//  * TODO: Maybe NodeJS isn't such a hot idea for scripting; how about
//  * Rhino?
//  * 
//  * See also:
//  * <node_runner.js>
//  */

// // Check our args from the outside world.
// //_ll('In.');
// //_ll('arglist: ' + arglist);
// var host = 'localhost';
// var port = 8910;
// if( arglist && arglist.length > 0 ){
//     if( arglist.length > 0 ){
// 	host = arglist[0];
//     }
//     if( arglist.length > 1 ){
// 	port = arglist[1];
//     }
// }

// // // Define what we do when our (async) information comes back.
// // function report(resp){

// //     //_ll('In report().');

// //     // Gather out info graph info from the first doc.
// //     var doc = resp.get_doc(0);
// //     var graph_json = doc['topology_graph_json'];
// //     var graph = new bbop.model.graph();
// //     graph.load_json(JSON.parse(graph_json));
// //     var kids = graph.get_child_nodes(term_acc);

// //     // Dump to STDOUT.
// //     //_ll(kids);
// //     var loop = bbop.core.each;
// //     loop(kids,
// // 	 function(kid){
// // 	     _ll(kid.id() + "\t" + kid.label());
// // 	 });
// // }

// // // Define the server, define the query, bind the callback, and
// // // trigger.
// // gconf = new bbop.golr.conf(amigo.data.golr);
// // go = new bbop.golr.manager.nodejs('http://golr.berkeleybop.org/', gconf);
// // go.set_personality('bbop_general');
// // go.register('search', 'do', _callback);
// // //_ll('get_query_url(): ' + go.get_query_url());
// // go.update('search');

// // Taken care of at higher-level context.
// //var http = require('http');
// var server = http.createServer(function (request, response) {
//   response.writeHead(200, {"Content-Type": "text/plain"});

//   var rq_str = bbop.core.dump(request);

//   response.end("Hello, World!\n" + rq_str);
// });

// // // Taken care of at higher-level context.
// // //var server = require('node-router').getServer();
// // server.get("/", function (request, response) {
// //   response.simpleText(200, "Hello World!");
// // });


// // Start server.
// server.listen(port, host);
// console.log("Server running at http://" + host + ":" + port + "/");
