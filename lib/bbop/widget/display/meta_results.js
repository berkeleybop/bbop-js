/*
 * Package: meta_results.js
 * 
 * Namespace: bbop.widget.display.meta_results
 * 
 * Reusable HTML drop of Solr meta results.
 * 
 * Subclass of <bbop.html.tag>.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'html');
bbop.core.namespace('bbop', 'widget', 'display', 'meta_results');

/*
 * Constructor: meta_results
 *
 * Draw a typical meta results section for the response data.
 * 
 * Parameters:
 *  total - integer
 *  first - integer
 *  last - integer
 * 
 * Returns:
 *  <bbop.html.tag> subclass
 */
bbop.widget.display.meta_results = function (total, first, last){
    bbop.html.tag.call(this, 'div');

    // Add number slots.
    this.add_to('Total: ' + total + '&nbsp;&nbsp;&nbsp;');
    this.add_to('First: ' + first + '&nbsp;&nbsp;&nbsp;');
    this.add_to('Last: ' + last + '<br />');

    // // Add button slots.
    // this.add_to('<button />');
    ////<a id="for_paging_id_f0ccpl4zp0" href="#results_block">forward -&gt;</a>
};
bbop.widget.display.meta_results.prototype = new bbop.html.tag;
