/* 
 * Package: handler.js
 * 
 * Namespace: bbop.handler
 * 
 * This package contains a "useable", but utterly worthless reference
 * implementation of a handler.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: handler
 *
 * Partial version for this library; revision (major/minor version numbers)
 * information.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  n/a
 */
bbop.handler = function(){
    this._is_a = 'bbop.handler';
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  data - the incoming thing to be handled
 *  name - the field name to be processed
 *  context - *[optional]* a string to add extra context to the call
 *  fallback - *[optional]* a fallback function to call in case nothing is found
 * 
 * Returns:
 *  null
 */
bbop.handler.prototype.dispatch = function(data, name, context, fallback){
    return null;
};
