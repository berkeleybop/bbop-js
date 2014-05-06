/* 
 * Package: collapsible.js
 * 
 * Namespace: bbop.html.collapsible
 * 
 * Implement the Bootstrap 3 collapse JS widget.
 * http://getbootstrap.com/javascript/#collapse
 * 
 * See also:
 *  <bbop.html>
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.html == "undefined" ){ bbop.html = {}; }

/*
 * Namespace: bbop.html.collapsible
 * 
 * Constructor: collapsible
 * 
 * Create the a frame for the functional part of a jQuery collapsible
 * structure.
 * 
 * :Input:
 * : [[title, string/*.to_string()], ...]
 * :
 * :Output:
 * :<div class="panel-group" id="accordion">
 * : <div class="panel panel-default">
 * :  <div class="panel-heading">
 * :   <h4 class="panel-title">
 * :    <a data-toggle="collapse" data-parent="#accordion" href="#collapseOne">
 * :     ...
 * :    </a>
 * :   </h4>
 * :  </div>
 * :  <div id="collapseOne" class="panel-collapse collapse in">
 * :   <div class="panel-body">
 * :    ...
 * :   </div>
 * :  </div>
 * : </div>
 * : ...
 * 
 * Parameters:
 *  in_list - collapsible frame headers: [[title, string/*.to_string()], ...]
 *  attrs - *[serially optional]* attributes to apply to the new top-level div
 * 
 * Returns:
 *  bbop.html.collapsible object
 * 
 * Also see: <tag>
 */
bbop.html.collapsible = function(in_list, attrs){
    this._is_a = 'bbop.html.collapsible';

    // Arg check--attrs should be defined as something.
    this._attrs = attrs || {};

    // We must add 'panel-group' to the class list.
    if( this._attrs['class'] ){
	this._attrs['class'] = this._attrs['class'] + ' panel-group';
    }else{
	this._attrs['class'] = 'panel-group';
    }

    // An id is necessary, and needs to be generated up front for
    // reference.
    this._cid = null;
    if( ! this._attrs['id'] ){
	this._attrs['id'] = 'gen_id-bbop-html-clps-' + bbop.core.randomness(20);
    }
    this._cid = this._attrs['id'];

    // Internal stack always starts with a div.
    this._div_stack = new bbop.html.tag('div', this._attrs);

    this._section_id_to_content_id = {};

    // Iterate over the incoming argument list.
    var collapsible_this = this;
    bbop.core.each(in_list, function(item){
		       var sect_title = item[0];
		       var content = item[1];
		       collapsible_this.add_to(sect_title, content);
		   });
};

/*
 * Function: to_string
 * 
 * Convert the collapsible object into a html-ized string.
 * 
 * Parameters: n/a
 * 
 * Returns:
 *  string
 */
bbop.html.collapsible.prototype.to_string = function(){
    return this._div_stack.to_string();
};

/*
 * Function: add_to
 * 
 * Add a contect section to the collapsible.
 * 
 * Parameters:
 *  section_info - a string or a hash with 'id', 'label', and 'description'
 *  content_blob - string or bbop.html object to put in a section
 * 
 * Returns: n/a
 */
bbop.html.collapsible.prototype.add_to = function(section_info,
						  content_blob){
	
    // If section_info isn't an object, assume it is a string and
    // use it for everything.
    var section_id = null;
    var section_label = null;
    var section_desc = null;
    if(typeof section_info != 'object' ){ // is a string
	section_id = section_info;
	section_label = section_info;
    }else{
	if( section_info['id'] ){ section_id = section_info['id']; }
	if( section_info['label'] ){ section_label = section_info['label']; }
	if( section_info['description'] ){
	    section_desc = section_info['description'];
	}
    }

    // Section ID and bookkeeping.
    var coll_id = 'collapsible-' + section_id + '-' + bbop.core.randomness(20);
    var cont_id = 'content-' + section_id + '-' + bbop.core.randomness(20);
    this._section_id_to_content_id[section_id] = cont_id;    

    // Inner-most header structure: label.
    //    <a data-toggle="collapse" data-parent="#this._cid" href="#cont_id">
    var title_a_attrs = {
    	'data-toggle': 'collapse',
    	'data-parent': '#' + this._cid,
    	'href': '#' + coll_id
    };
    // Cannot be null in assembly.
    if( section_desc ){	title_a_attrs['title'] = section_desc; }
    var title_a = new bbop.html.tag('a', title_a_attrs, section_label);
    
    //   <h4 class="panel-title">
    var h4_attrs = {
    	'class': 'panel-title'
    };
    var h4 = new bbop.html.tag('h4', h4_attrs, title_a);

    // Complete the panel heading.
    //  <div class="panel-heading">
    var divh_attrs = {
    	'class': 'panel-heading'
    };
    var divh = new bbop.html.tag('div', divh_attrs, h4);
    
    // Add the panel body.
    //    <div class="panel-body">
    var body_attrs = {
    	'class': 'panel-body',
	'style': 'overflow-x: auto;', // emergency overflow scrolling
    	'id': cont_id
    };
    var body = new bbop.html.tag('div', body_attrs, content_blob);

    // Add the collapsing frame around the panel body.
    //  <div id="collapseOne" class="panel-collapse collapse in">
    var divb_attrs = {
    	'class': 'panel-collapse collapse',
    	'id': coll_id
    };
    var divb = new bbop.html.tag('div', divb_attrs, body);

    // Add both to the local panel container.
    // <div class="panel panel-default">
    var divp_attrs = {
    	'class': 'panel panel-default'
    };
    var divp = new bbop.html.tag('div', divp_attrs, [divh, divb]);
    
    //
    this._div_stack.add_to(divp);
};

/*
 * Function: empty
 * 
 * Empty all sections from the collapsible.
 * 
 * Parameters: n/a
 * 
 * Returns: n/a
 */
bbop.html.collapsible.prototype.empty = function(){
    this._div_stack = new bbop.html.tag('div', this._attrs);
    this._section_id_to_content_id = {};
};

/*
 * Function: get_id
 * 
 * Return the id if extant, null otherwise.
 * 
 * Parameters: n/a
 * 
 * Returns: string or null
 */
bbop.html.collapsible.prototype.get_id = function(){
    return this._div_stack.get_id();
};

/*
 * Function: get_section_id
 * 
 * Get the "real" section id by way of the "convenience" section id?
 * 
 * Parameters:
 *  sect_id - TODO ???
 * 
 * Returns: TODO ???
 */
bbop.html.collapsible.prototype.get_section_id = function(sect_id){
	return this._section_id_to_content_id[sect_id];    
};
