/*
 * Package: template.js
 * 
 * Namespace: bbop.template
 * 
 * BBOP JS template object/enginette.
 * 
 * Some (nonsensical) usage is like:
 * 
 * : var tt = new bbop.template("{{foo}} {{bar}} {{foo}}");
 * : 'A B A' == tt.fill({'foo': 'A', 'bar': 'B'});
 */

// Setup the internal requirements.
bbop.core.require('bbop', 'core');
bbop.core.namespace('bbop', 'template');

/*
 * Constructor: template
 * 
 * Arguments:
 *  template_string - the string template to use for future fill calls
 * 
 * Returns:
 *  self
 */
bbop.template = function(template_string){
    this.is_a = 'bbop.template';

    var anchor = this;

    anchor._template_string = template_string;

    // First break the template string into ordered sections which we
    // will interleve later.
    var split_re = /\{\{[A-Za-z0-9_-]+\}\}/;
    anchor._template_split_strings =
	template_string.split(split_re);

    // Now map out which variables are at which locations.
    var var_id_re = /\{\{[A-Za-z0-9_-]+\}\}/g;
    anchor._var_id_matches =
	template_string.match(var_id_re);
    // Trim off the '{{' and '}}' from the matches.
    bbop.core.each(anchor._var_id_matches,
		  function(item, index){
		      var new_item = item.substring(2, item.length -2);
		      anchor._var_id_matches[index] = new_item;
		  });

    /*
     * Function: fill
     * 
     * Fill the template with the corresponding hash items. Undefined
     * variables are replaces with ''.
     * 
     * Arguments:
     *  fill_hash - the template with the hashed values
     * 
     * Returns:
     *  string
     */
    this.fill = function(fill_hash){
	var ret_str = '';

	bbop.core.each(anchor._template_split_strings,
		       function(str, index){

			   // Add the next bit.
			   ret_str += str;

			   // Add the replacement value if we can make
			   // sense of it.
			   if( index < anchor._var_id_matches.length ){
			       var use_str = '';
			       var varname = anchor._var_id_matches[index];
			       if( varname &&
				   bbop.core.is_defined(fill_hash[varname]) ){
				   use_str = fill_hash[varname];
			       }
			       ret_str += use_str;
			   }
		       });

	return ret_str;
    };

    /*
     * Function: variables
     * 
     * Return a hash of the variables used in the template.
     * 
     * Arguments:
     *  n/a
     * 
     * Returns:
     *  a hash like: {'foo': true, 'bar': true, ...}
     */
    this.variables = function(){
	return bbop.core.hashify(anchor._var_id_matches);
    };

};
