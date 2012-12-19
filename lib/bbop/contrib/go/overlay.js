/*
 * Package: overlay.js
 * 
 * Namespace: bbop.contrib.go.overlay
 * 
 * This package contributes some very high-level functions to make
 * using things like the web REPL easier to use with GOlr data
 * sources.
 * 
 * It is suggested that you *[not]* use this if you are seriously
 * programming for BBOP JS since it plays fast and loose with the
 * dynamic environment, as well as polluting the global namespace.
 * 
 * NOTE: Again, this overlay is only usable in a (jQuery) browser
 * environment--the JS environments are too varied for this to work
 * arbitrarily, but similar approaches might work in other
 * envorinments.
 */

// Setup the internal requirements.
bbop.core.require('bbop', 'core');
bbop.core.namespace('bbop', 'contrib', 'go', 'overlay');

/*
 * Function: overlay
 * 
 * Put a set of useful functions into the global namespace for use
 * with REPLs and the like.
 * 
 * Arguments:
 *  manager_type - the manager type to use, or null (no sublcass)
 * 
 * Returns:
 *  boolean on whether any errors were thrown
 */
bbop.contrib.go.overlay = function(manager_type){

    //var anchor = this;
    var global_ret = true;

    // Either the base manager, or a manager subclass.
    var mtype = '';
    if( manager_type ){
	mtype = '.' + manager_type;
    }

    // Well, for now, this is what we will do--see bbop.core.evaluate
    // for a start on a more general ability. I could likely remove
    // the "var" and have everything out in the global, but it looks
    // like that might case errors too.
    if( manager_type != 'jquery' ){
	throw new Error('Cannot create non-jquery overlays at this time!');
    }

    var env = [
	'var loop = bbop.core.each;',
	'var dump = bbop.core.dump;',
	'var what_is = bbop.core.what_is;',

	// Defined a global logger.
	'var logger = new bbop.logger();',
	'logger.DEBUG = true;',
	'function ll(str){ return logger.kvetch(str); }',
	
	// Get our data env right.
	'var server_meta = new amigo.data.server();',
	'var gloc = server_meta.golr_base();',
	'var gconf = new bbop.golr.conf(amigo.data.golr);',

	// Support a call back to data.
	'var data = null;',
	"function callback(json){ ll('// Returned with \"data\".'); data = new bbop.golr.response(json); }",

	// Get a global manager.
	'var go = new bbop.golr.manager' + mtype + '(gloc, gconf);',
	"go.register('search', 's', callback);",

	// Add GO-specific methods to our manager.
	"bbop.golr.manager.prototype.gaf_url = function(){ return this.get_download_url(['source', 'bioentity_label', 'annotation_class', 'reference', 'evidence_type', 'evidence_with', 'taxon', 'date', 'annotation_extension_class', 'bioentity']); };",
	"bbop.golr.manager.prototype.doc_type = function(t){ return this.add_query_filter('document_type', t); };",
	"bbop.golr.manager.prototype.filter = function(f, t, p){ var pol = p || \'+'; return this.add_query_filter(f, t, [p]); };"
    ];

    var jquery_env = [
	"var empty = function(did){ jQuery('#' + did).empty(); };",
	"var append = function(did, str){ jQuery('#' + did).append(str); };"
    ];

    function _b_eval(to_eval){
	return window.eval(to_eval);
    }
    function _s_eval(to_eval){
	return eval(to_eval);
    }

    // The main evaluation function.
    function _eval(to_eval){
	
	var retval = '';

	// Try and detect our environment.
	var env_type = 'server';
	try{
	    if( bbop.core.is_defined(window) &&
		bbop.core.is_defined(window.eval) &&
		bbop.core.what_is(window.eval) == 'function' ){
		    env_type = 'browser';
		}
	} catch (x) {
	    // Probably not a browser then, right?
	}

	// Now try for the execution.
	try{
	    // Try and generically evaluate.
	    var tmp_ret = null;
	    if( env_type == 'browser' ){
		tmp_ret = _b_eval(to_eval);
	    }else{
		// TODO: Does this work?
		tmp_ret = _s_eval(to_eval);		
	    }

	    // Make whatever the tmp_ret is prettier for the return
	    // val.
	    if( bbop.core.is_defined(tmp_ret) ){
		if( bbop.core.what_is(tmp_ret) == 'string' ){
		    retval = '"' + tmp_ret + '"';
		}else{
		    retval = tmp_ret;
		}
	    }else{
		// ...
	    }
	}catch (x){
	    // Bad things happened.
	    //print('fail on: (' + tmp_ret +'): ' + to_eval);
	    retval = '[n/a]';
	    global_ret = false;
	}
	
	return retval;
    }

    // Now cycle through the command list.
    bbop.core.each(env,
		   function(line){
		       _eval(line);
		   });
    
    // Add a few specific things if we're in a jQuery REPL
    // environment.
    if( manager_type && manager_type == 'jquery' ){	
	bbop.core.each(jquery_env,
		       function(line){
			   _eval(line);
		       });
    }
    
    return global_ret;
};