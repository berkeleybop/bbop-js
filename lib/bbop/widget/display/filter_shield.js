/*
 * Package: filter_shield.js
 * 
 * Namespace: bbop.widget.display.filter_shield
 * 
 * BBOP object to produce a self-constructing/self-destructing shield
 * to support very large filter selection in the live search/search
 * pane genre.
 */

bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'logger');
//bbop.core.require('bbop', 'model');
//bbop.core.require('bbop', 'model', 'graph', 'bracket');
bbop.core.require('bbop', 'html');
bbop.core.require('bbop', 'golr', 'manager', 'jquery');
bbop.core.namespace('bbop', 'widget', 'display', 'filter_shield');

/*
 * Constructor: filter_shield
 * 
 * Contructor for the bbop.widget.display.filter_shield object.
 * 
 * Support for <bbop.widget.search_pane> by way of
 * <bbop.widget.display.live_search>
 * 
 * Arguments:
 *  filter_list - a list of [[filter_id, filter_count], ...]
 *  manager - the manager that we'll use for the callbacks
 * 
 * Returns:
 *  self
 */
bbop.widget.display.filter_shield = function(filter_list, manager){
    this._is_a = 'bbop.widget.display.filter_shield';

    var anchor = this;

    // Per-UI logger.
    var logger = new bbop.logger();
    logger.DEBUG = true;
    function ll(str){ logger.kvetch('W (filter_shield): ' + str); }

    /*
     * Function: draw
     * 
     * Render a temporary modal filter shield.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  n/a
     */
    this.draw = function(item){
	//ll(doc['id']);
	var txt = 'No filters...';
	// if( doc && cclass ){
	
	//     var tbl = new bbop.html.table();
	//     var results_order = cclass.field_order_by_weight('result');
	//     var each = bbop.core.each; // conveience
	//     each(results_order,
	// 	 function(fid){
	// 	     // 
	// 	     var field = cclass.get_field(fid);
	// 	     var val = doc[fid];
	// 	     //var link = linker.anchor({id: val}, 'term');
	// 	     var link = null;
	// 	     if( val ){
	// 		 link = linker.anchor({id: val});
	// 		 if( link ){ val = link; }
	// 	     }else{
	// 		 val = 'n/a';
	// 	     }
	// 	     tbl.add_to([field.display_name(), val]);
	// 	     //tbl.add_to(['link', linker.anchor({id: doc['id']})]);
	// 	 });
	// txt = tbl.to_string();
	//}
	
	// Create div.
	var div = new bbop.html.tag('div', {'generate_id': true});
	var div_id = div.get_id();
    
	// Append div to body.
	jQuery('body').append(div.to_string());
    
	// Add text to div.
	jQuery('#' + div_id).append(txt);

	var diargs = {
	    modal: true,
	    draggable: false,
	    width: 800,
	    height: 600,
	    close:
	    function(){
		// TODO: Could maybe use .dialog('destroy') instead?
		jQuery('#' + div_id).remove();
	    }	    
	};
	var dia = jQuery('#' + div_id).dialog(diargs);
    };

};
