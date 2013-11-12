/* #!/home/sjcarbon/local/src/tarballs/node-v0.8.18-linux-x64/bin/node
 *  
 * Package: get_children.js
 * 
 * This is a node_runner.js script.
 * 
 * Get the ids and labels of the children of the specified term.
 * 
 * Usage like:
 *  : node_runner.js get_children.js GO:0022008
 * 
 * This is also a bit of a unit test for the NodeJS update function.
 * 
 * TODO: Maybe NodeJS isn't such a hot idea for scripting; how about
 * Rhino?
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


// Check our args from the outside world.
//_ll('In.');
//_ll('arglist: ' + arglist);
var term_acc = null;
if( arglist && arglist.length > 0 ){
    term_acc = arglist[0];
}
if( ! term_acc ){
    _ll('no proper argument');
    process.kill();
}
//_ll('term_acc: ' + term_acc);

// Define what we do when our (async) information comes back.
function report(resp){

    //_ll('In report().');

    // Gather out info graph info from the first doc.
    var doc = resp.get_doc(0);
    var graph_json = doc['topology_graph_json'];
    var graph = new bbop.model.graph();
    graph.load_json(JSON.parse(graph_json));
    var kids = graph.get_child_nodes(term_acc);

    // Dump to STDOUT.
    //_ll(kids);
    var loop = bbop.core.each;
    loop(kids,
	 function(kid){
	     _ll(kid.id() + "\t" + kid.label());
	 });
}

// Define the server, define the query, bind the callback, and
// trigger.
var gconf = new bbop.golr.conf(amigo.data.golr);
var go = new bbop.golr.manager.nodejs('http://golr.berkeleybop.org/', gconf);
go.set_id(term_acc);
go.register('search', 'do', report);
//_ll('get_query_url(): ' + go.get_query_url());
go.update('search');
