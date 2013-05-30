/* 
 * Package: linker.js
 * 
 * Namespace: bbop.linker
 * 
 * This package contains a "useable", but utterly worthless reference
 * implementation of a linker.
 */

bbop.core.namespace('bbop', 'linker');

/*
 * Constructor: linker
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
bbop.linker = function(){
    this._is_a = 'bbop.linker';
};

/*
 * Function: url
 * 
 * Return a url string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id (context)
 * 
 * Returns:
 *  null -- always "fails""
 */
bbop.linker.prototype.url = function(id, xid){
    return null;
};

/*
 * Function: anchor
 * 
 * Return an html anchor string.
 * 
 * Arguments:
 *  args - id
 *  xid - *[optional]* an internal transformation id (context)
 * 
 * Returns:
 *  null -- always "fails""
 */
bbop.linker.prototype.anchor = function(id, xid){
    return null;
};
