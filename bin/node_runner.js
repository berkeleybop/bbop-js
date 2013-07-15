#!/home/sjcarbon/local/src/tarballs/node-v0.8.18-linux-x64/bin/node
/* 
 * Package: node_runner.js
 * 
 * This is a NodeJS script.
 * 
 * In short, get the global variable space/contexts straight to be
 * able to run things with proper namespacing (i.e. JavaScript as it
 * is everywhere in the universe besides NodeJS land.
 * 
 * In more detail, NodeJS has been a rather irritiating moving target,
 * and over time it seems to have become more restrictive in how
 * variable, globals, etc. are passed around, and practically this
 * means that the NodeJS scripts as examples frequently fall to
 * bitrot. The last case of which seemed terminal.
 * 
 * The core of the problems seems to have been three things. The first
 * is that NodeJS now goes out of it's way to prevent any kind of
 * global variables--only NodeJS has that ability, and then only
 * sometimes (this seems to have changed sometime after 0.7, and this
 * is being written at 0.8.1, where only some types of objects in the
 * global namespace are made available to child contexts). This is
 * done for reasonable security reasons probably, but highly
 * frustrating. The second is that globals and contexts behave very
 * differently depending on how things are run: interactive, shell,
 * eval, context, etc. Finally, there is almost no way to share these
 * and have the code look like normal JavaScript code.
 * 
 * To get around these issues, my current approach is to create a
 * shunt (this file) that creates a context and adds things too it
 * file by file to create an acceptable environment and then finally
 * run something in it. Unfortunately, this causes an extra layer of
 * redirection and polluting the context space (e.g. arglist as a
 * proxy to pass CLI variables), but it has the advantage of working
 * to some extent. Good enough for now, as long as it limps along.
 * 
 * Usage like:
 *  : node_runner.js get_children.js GO:0022008
 *  : node_runner.js node_repl.js
 */

var console = require('console');
function _ll(s){
//    console.log('RUNNER: ' + s);
};

// First, figure out our args.
var script_to_run = process.argv[2];
var script_arg_list = process.argv.slice(3) || [];
if( ! script_to_run || ! script_arg_list ){
    _ll('It looks like you have improper arguments.');
    process.kill();
}
_ll('Run: ' + script_to_run + '; with: ' + script_arg_list.join(', '));

// Prepare sandbox. We need to make sure to get http in there too
// since it is left out of child contexts as a security feature (at
// least right now, it wasn't always like that).
var http = require('http');
var sandbox = {
    repl: require('repl'),
    http: http,
    console: console,
    process: process.stdout.write,
    arglist: script_arg_list
};
_ll('Defined context.');

// Read in our various files to, including the script that we'll run.
var fs = require('fs');
var bbop_js = fs.readFileSync('../staging/bbop.js').toString();
var golr_js = fs.readFileSync('../_data/golr.js').toString();
var run_js = fs.readFileSync(script_to_run).toString();
_ll('Loaded files.');

var vm = require('vm');
var context = vm.createContext(sandbox);
var stcktr = '/tmp/node_runner.vm';
vm.runInContext(bbop_js, context, stcktr);
vm.runInContext(golr_js, context, stcktr);
vm.runInContext(run_js, context, stcktr);
