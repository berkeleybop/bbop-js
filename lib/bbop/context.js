/*
 * Package: context.js
 * 
 * Namespace: bbop.context
 * 
 * This package contains an often used set of tools to tease apart a
 * specially structured hash to get things like readable names and
 * colors.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }

/*
 * Constructor: context
 * 
 * Initial take from go-mme/js/bbop-mme-context.js
 * 
 * Arguments:
 *  entities - a hash defining all of the properties to unscramble
 * default_color - the color to use when a color cannot be found (#800800)
 * 
 * Returns:
 *  aiding object
 */

bbop.context = function(entities, default_color){
    
    // Make sure some kind of color is there.
    if( ! default_color ){
	default_color = '#808080'; // grey
    }
    
    // Compile entity aliases.
    var entity_aliases = {};
    bbop.core.each(entities,
		   function(ekey, eobj){
		       entity_aliases[ekey] = ekey; // identity
		       bbop.core.each(eobj['aliases'],
				      function(alias){
					  entity_aliases[alias] = ekey;
				      });
		   });

    // Helper fuction to go from unknown id -> alias -> data structure.
    this._dealias_data = function(id){
	
	var ret = null;
	if( id ){
	    if( entity_aliases[id] ){ // directly pull
		var tru_id = entity_aliases[id];
		ret = entities[tru_id];
	    }
	}

	return ret;
    };

    /* 
     * Function: readable
     *
     * Returns a human readable form of the inputted string.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  readable string or original string
     */
    this.readable = function(ind){
	var ret = ind;

	var data = this._dealias_data(ind);
	if( data && data['readable'] ){
	    ret = data['readable'];
	}
	
	return ret;
    };

    /* 
     * Function: color
     *
     * Return the string of a color of a rel.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or 'grey'
     */
    this.color = function(ind){
	
	var ret = default_color;

	var data = this._dealias_data(ind);
	if( data && data['color'] ){
	    ret = data['color'];
	}
	
	return ret;
    };

    /* 
     * Function: relation_glyph
     *
     * Return the string indicating the glyph to use for the edge marking.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate color string or null
     */
    this.glyph = function(ind){
	
	var ret = null; // default

	var data = this._dealias_data(ind);
	if( data && data['glyph'] ){
	    ret = data['glyph'];
	}
	
	return ret;
    };

    /* 
     * Function: priority
     *
     * Return a number representing the relative priority of the
     * entity under consideration.
     *
     * Parameters: 
     *  ind - incoming data id
     *
     * Returns:
     *  appropriate integer or 0
     */
    this.priority = function(ind){
	
	var ret = 0;

	var data = this._dealias_data(ind);
	if( data && data['priority'] ){
	    ret = data['priority'];
	}
	
	return ret;
    };

    /* 
     * Function: all_entities
     *
     * Return a list of the currently known entities.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.all_entities = function(){	
	var rls = bbop.core.get_keys(entities);
	return rls;
    };

    /* 
     * Function: all_known
     *
     * Return a list of the currently known entities and their aliases.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  list
     */
    this.all_known = function(){	
	var rls = bbop.core.get_keys(entity_aliases);
	return rls;
    };
};
