/*
 * Package: live_pager.js
 * 
 * Namespace: bbop.widget.live_pager
 * 
 * BBOP JS object to allow the the paging/downloading etc. of a GOlr
 * manager.
 * 
 * Very much like a separated pager from the search pane.
 * 
 * This is a Bootstrap 3 widget.
 * 
 * See Also:
 *  <search_pane.js>
 *  <live_search.js>
 *  <live_filters.js>
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }

/*
 * Constructor: live_pager
 * 
 * Contructor for the bbop.widget.live_pager object.
 * 
 * Display a manager response. Not a manager itself, but can use the
 * argument manager to page, download, etc.
 *
 * Arguments:
 *  interface_id - string id of the element to build on
 *  manager - a manager object to probe for display and use for remoting
 *  in_argument_hash - *[optional]* optional hash of optional arguments
 * 
 * Returns:
 *  this object
 */
bbop.widget.live_pager = function(interface_id, manager, in_argument_hash){
    this._is_a = 'bbop.widget.live_pager';

    var anchor = this;
    var each = bbop.core.each;

    // TODO:
    // will consume results_table_by_class_conf_bs3.js
    
};
