/* #!/home/sjcarbon/local/src/tarballs/node-v0.8.18-linux-x64/bin/node
 * 
 * Package: node_repl.js
 * 
 * This is a node_runner.js script.
 * 
 * Start a REPL in a sane GOlr environment.
 * 
 * Usage like: node_runner.js node_repl.js 
 * : golr> go.get_query_url()
 * : golr> go.set_personality('bbop_ann')
 * : golr> go.get_query_url()
 * 
 * See also:
 * <node_runner.js>
 */

// Setup the environment a little bit.
var gconf = new bbop.golr.conf(amigo.data.golr);
var go = new bbop.golr.manager.nodejs('http://golr.berkeleybop.org/', gconf);
//go.set_personality('bbop_ont');

// Start the REPL and drop out.
//var repl = require("repl"); // actually, set this in parent context now
// Start the local STDIN REPL.
repl.start({
	       //useGlobal: true,
	       prompt: "golr> ",
	       input: process.stdin,
	       output: process.stdout
	   }).context.go = go;
