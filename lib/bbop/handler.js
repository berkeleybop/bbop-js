/*
 * Package: handler.js
 * 
 * Namespace: bbop.handler
 * 
 * BBOP object to try and alleviate some of the issues with displaying
 * complext fields. The idea behind a handler is that...actually, we
 * will be removing this soon.
 * 
 * Anatomy of a bbop.handler argument.
 * 
 * : {handler:"bbop.handler.foo", WHATEVER}
 * 
 * WARNING: Since I don't have time to play with the ever increasingly
 * frustrating NodeJS right now, it's unknown whether or not this
 * would work properly.
 * 
 * NOTE: This system is not longer used in preference for the more
 * flexible (but somewhat less elegant) handler/dispatch spec, as
 * illustrated by by <amigo.handler>.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
bbop.core.namespace('bbop', 'handler');

/*
 * Constructor: handler
 * 
 * Contructor for the bbop.handler object. NOTE: during processing,
 * binary operators with a single argument cease to exist as they will
 * never make it to output.
 * 
 * Arguments:
 *  default_conjuntion - *[optional]* "and" or "or"; defaults to "and"
 * 
 * Returns:
 *  bbop handler object
 */
bbop.handler = function(){
    this._is_a = 'bbop.handler';

    // Add logging.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    //logger.DEBUG = false;
    function ll(str){ logger.kvetch(str); }

    var handler_anchor = this;

    /*
     * Function: dispatch
     * 
     * TODO
     * 
     * Parameters:
     *  bbop.handler argument object (see above)
     * 
     * Returns:
     *  {success: (true or false), results: ???};
     */
    this.dispatch = function(object_to_dispatch){
	var status = false;
	var retval = null;

	// First, check that the incoming thing is an object and
	// grossly correct.
	if( bbop.core.what_is(object_to_dispatch) != 'object' ){
	    ll("ERROR: argument not an object");
	}else if( ! bbop.core.is_defined(object_to_dispatch['handler']) ){
	    ll("ERROR: handler not defined");
	}else{
	    
	    // Make sure that the handler argument is defined and a
	    // string.
	    var handler_string = object_to_dispatch['handler'];
	    if( bbop.core.what_is(handler_string) != 'string' ||
		handler_string.length < 1 ){
		    ll("ERROR: no string argument apparent. ");
		}else{
		    
		    // Okay, now try running the function defined in
		    // handler with the dispatch object.
		    try{
			//retval = eval(handler_string + ';')(object_to_dispatch);
			retval = eval(handler_string)(object_to_dispatch);
			status = true;
		    }catch (x){
			// Note the error.
			ll("ERROR on: " + handler_string + " with " +
			   bbop.core.dump(object_to_dispatch));
			status = false;
			retval = "";
		    }
		}
	}
	
	return {success: status, results: retval};
    };
};
