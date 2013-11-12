/* 
 * Package: core.js
 * 
 * BBOP language extensions to JavaScript. CommonJS Modules 1.0
 * version.
 * 
 * Purpose: Helpful basic utilities and operations to fix common needs in JS.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.core == "undefined" ){ bbop.core = {}; }

/*
 * Function: crop
 *
 * Crop a string nicely.
 * 
 * Parameters:
 *  str - the string to crop
 *  lim - the final length to crop to (optional, defaults to 10)
 *  suff - the string to add to the end (optional, defaults to '')
 * 
 * Returns: Nothing. Side-effects: throws an error if the
 * namespace defined by the strings is not currently found.
 */
bbop.core.crop = function(str, lim, suff){
    var ret = str;
    
    var limit = 10;
    if( lim ){ limit = lim; }
    
    var suffix = '';
    if( suff ){ suffix = suff; }
    
    if( str.length > limit ){
	ret = str.substring(0, (limit - suffix.length)) + suffix;
    }
    return ret;
};

/*
 * Function: fold
 *
 * Fold a pair of hashes together, using the first one as an
 * initial template--only the keys in the default hash will
 * be defined in the final hash--and the second hash getting
 * precedence.
 * 
 * The can be quite useful when defining
 * functions--essentially allowing a limited default value
 * system for arguments.
 * 
 * Parameters:
 *  default_hash - Template hash.
 *  arg_hash - Argument hash to match.
 * 
 * Returns: A new hash.
 * 
 * Also see: <merge>
 */
bbop.core.fold = function(default_hash, arg_hash){

    if( ! default_hash ){ default_hash = {}; }
    if( ! arg_hash ){ arg_hash = {}; }
    
    var ret_hash = {};
    for( var key in default_hash ){
	if( bbop.core.is_defined(arg_hash[key]) ){
	    ret_hash[key] = arg_hash[key];
	}else{
	    ret_hash[key] = default_hash[key];
	}
    }
    return ret_hash;
};

/*
 * Function: merge
 *
 * Merge a pair of hashes together, the second hash getting
 * precedence. This is a superset of the keys both hashes.
 * 
 * Parameters:
 *  older_hash - first pass
 *  newer_hash - second pass
 * 
 * Returns: A new hash.
 * 
 * Also see: <fold>
 */
bbop.core.merge = function(older_hash, newer_hash){

    if( ! older_hash ){ older_hash = {}; }
    if( ! newer_hash ){ newer_hash = {}; }

    var ret_hash = {};
    function _add (key, val){
	 ret_hash[key] = val;
    }
    bbop.core.each(older_hash, _add);
    bbop.core.each(newer_hash, _add);
    return ret_hash;
};

/*
 * Function: get_keys
 *
 * Get the hash keys from a hash/object, return as an array.
 *
 * Parameters:
 *  arg_hash - the hash in question
 *
 * Returns: an array of keys
 */
bbop.core.get_keys = function (arg_hash){

    if( ! arg_hash ){ arg_hash = {}; }
    var out_keys = [];
    for (var out_key in arg_hash) {
	if (arg_hash.hasOwnProperty(out_key)) {
	    out_keys.push(out_key);
	}
    }
    
    return out_keys;
};

/*
 * Function: hashify
 *
 * Returns a hash form of the argument array/list. For example ['a',
 * 'b'] would become {'a': true, 'b': true} or [['a', '12'], ['b',
 * '21']] would become {'a': '12', 'b': '21'}. Using mixed sub-lists
 * is undefined.
 *
 * Parameters:
 *  list - the list to convert
 *
 * Returns: a hash
 */
bbop.core.hashify = function (list){
    var rethash = {};

    if( list && list[0] ){
	if( bbop.core.is_array(list[0]) ){
	    bbop.core.each(list,
			   function(item){
			       var key = item[0];
			       var val = item[1];
			       if( bbop.core.is_defined(key) ){
				   rethash[key] = val;
			       }
			   });
	}else{
	    bbop.core.each(list,
			   function(item){
			       rethash[item] = true;
			   });
	}
    }

    return rethash;
};

/*
 * Function: is_same
 *
 * Returns true if it things the two incoming arguments are value-wise
 * the same.
 * 
 * Currently only usable for simple (atomic single layer) hashes,
 * atomic lists, boolean, null, number, and string values. Will return
 * false otherwise.
 * 
 * Parameters:
 *  thing1 - thing one
 *  thing2 - thing two
 *
 * Returns: boolean
 */
bbop.core.is_same = function (thing1, thing2){

    var retval = false;

    // If is hash...steal the code from test.js.
    if( bbop.core.is_hash(thing1) && bbop.core.is_hash(thing2) ){
	
	var same_p = true;
	
	// See if the all of the keys in hash1 are defined in hash2
	// and that they have the same ==.
	for( var k1 in thing1 ){
	    if( typeof thing2[k1] === 'undefined' ||
		thing1[k1] !== thing2[k1] ){
		    same_p = false;
		    break;
		}
	}

	// If there is still no problem...
	if( same_p ){
	    
	    // Reverse of above.
	    for( var k2 in thing2 ){
		if( typeof thing1[k2] === 'undefined' ||
		    thing2[k2] !== thing1[k2] ){
			same_p = false;
			break;
		    }
	    }
	}

	retval = same_p;

    }else if( bbop.core.is_array(thing1) && bbop.core.is_array(thing2) ){
	// If it's an array convert and pass it off to the hash function.
	retval = bbop.core.is_same(bbop.core.hashify(thing1),
				   bbop.core.hashify(thing2));
    }else{
	
	// So, we're hopefully dealing with an atomic type. If they
	// are the same, let's go ahead and try.
	var t1_is = bbop.core.what_is(thing1);
	var t2_is = bbop.core.what_is(thing2);
	if( t1_is == t2_is ){
	    if( t1_is == 'null' ||
		t1_is == 'boolean' ||
		t1_is == 'null' ||
		t1_is == 'number' ||
		t1_is == 'string' ){
		    if( thing1 == thing2 ){
			retval = true;
		    }
		}
	}
    }

    return retval;
};

/*
 * Function: what_is
 *
 * Return the string best guess for what the input is, null if it
 * can't be identified. In addition to the _is_a property convention,
 * current core output strings are: 'null', 'array', 'boolean',
 * 'number', 'string', 'function', and 'object'.
 * 
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: a string
 */
bbop.core.what_is = function(in_thing){
    var retval = null;
    if( typeof(in_thing) != 'undefined' ){

	// If it's an object, try and guess the 'type', otherwise, let
	// typeof.
	if( in_thing == null ){
	    retval = 'null';
	}else if( typeof(in_thing) == 'object' ){
	    
	    // Look for the 'is_a' property that I should be using.
	    if( typeof(in_thing._is_a) != 'undefined' ){
		retval = in_thing._is_a;
	    }else{
		if( bbop.core.is_array(in_thing) ){
		    retval = 'array';
		}else{
		    retval = 'object';
		}		
	    }
	}else{
	    retval = typeof(in_thing);
	}
    }
    return retval;
};

/*
 * Function: is_array
 *
 * Return the best guess (true/false) for whether or not a given
 * object is being used as an array.
 *
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: boolean
 */
bbop.core.is_array = function(in_thing){
    var retval = false;
    if( in_thing &&
	typeof(in_thing) == 'object' &&
	typeof(in_thing.push) == 'function' &&
	typeof(in_thing.length) == 'number' ){
	retval = true;
    }
    return retval;
};

/*
 * Function: is_hash
 *
 * Return the best guess (true/false) for whether or not a given
 * object is being used as a hash.
 *
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: boolean
 */
bbop.core.is_hash = function(in_thing){
    var retval = false;
    if( in_thing &&
	typeof(in_thing) == 'object' &&
	(! bbop.core.is_array(in_thing)) ){
	retval = true;
    }
    return retval;
};

/*
 * Function: is_empty
 *
 * Return true/false on whether or not the object in question has any
 * items of interest (iterable?).
 *
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: boolean
 */
bbop.core.is_empty = function(in_thing){
    var retval = false;
    if( bbop.core.is_array(in_thing) ){
	if( in_thing.length == 0 ){
	    retval = true;
	}
    }else if( bbop.core.is_hash(in_thing) ){
	var in_hash_keys = bbop.core.get_keys(in_thing);
	if( in_hash_keys.length == 0 ){
	    retval = true;
	}
    }else{
	// TODO: don't know about this case yet...
	//throw new Error('unsupported type in is_empty');	
	retval = false;
    }
    return retval;
};

/*
 * Function: is_defined
 *
 * Return true/false on whether or not the passed object is defined.
 *
 * Parameters: 
 *  in_thing - the thing in question
 *
 * Returns: boolean
 */
bbop.core.is_defined = function(in_thing){
    var retval = true;
    if( typeof(in_thing) === 'undefined' ){
	retval = false;
    }
    return retval;
};

/*
 * Function: each
 *
 * Implement a simple iterator so I don't go mad.
 *  array - function(item, index)
 *  object - function(key, value)
 *
 *  TODO/BUG/WARNING?: This does not seem to work with the local
 *  function variable "arguments".
 * 
 * Parameters: 
 *  in_thing - hash or array
 *  in_function - function to apply to elements
 *
 * Returns:
 *  n/a
 */
bbop.core.each = function(in_thing, in_function){

    // Probably an not array then.
    if( typeof(in_thing) == 'undefined' ){
	// this is a nothing, to nothing....
    }else if( typeof(in_thing) != 'object' ){
	throw new Error('Unsupported type in bbop.core.each: ' +
			typeof(in_thing) );
    }else if( bbop.core.is_hash(in_thing) ){
	// Probably a hash...
	var hkeys = bbop.core.get_keys(in_thing);
	for( var ihk = 0; ihk < hkeys.length; ihk++ ){
	    var ikey = hkeys[ihk];
	    var ival = in_thing[ikey];
	    in_function(ikey, ival);
	}
    }else{
	// Otherwise likely an array.
	for( var iai = 0; iai < in_thing.length; iai++ ){
	    in_function(in_thing[iai], iai);
	}
    }
};

/*
 * Function: pare
 *
 * Take an array or hash and pare it down using a couple of functions
 * to what we want.
 * 
 * Both parameters are optional in the sense that you can set them to
 * null and they will have no function; i.e. a null filter will let
 * everything through and a null sort will let things go in whatever
 * order.
 *
 * Parameters: 
 *  in_thing - hash or array
 *  filter_function - hash (function(key, val)) or array (function(item, i)).
 *   This function must return boolean true or false.
 *  sort_function - function to apply to elements: function(a, b)
 *   This function must return an integer as the usual sort functions do.
 *
 * Returns: An array.
 */
bbop.core.pare = function(in_thing, filter_function, sort_function){

    var ret = [];
    
    // Probably an not array then.
    if( typeof(in_thing) == 'undefined' ){
	// this is a nothing, to nothing....
    }else if( typeof(in_thing) != 'object' ){
	throw new Error('Unsupported type in bbop.core.pare: ' +
			typeof(in_thing) );
    }else if( bbop.core.is_hash(in_thing) ){
	// Probably a hash; filter it if filter_function is defined.
	if( filter_function ){	
	    bbop.core.each(in_thing,
			   function(key, val){
			       if( filter_function(key, val) ){
				   // Remove matches to the filter.
			       }else{
				   ret.push(val);
			       }
			   });
	}else{
	    bbop.core.each(in_thing, function(key, val){ ret.push(val); });
	}
    }else{
	// Otherwise, probably an array; filter it if filter_function
	// is defined.
	if( filter_function ){	
	    bbop.core.each(in_thing,
			   function(item, index){
			       if( filter_function(item, index) ){
				   // filter out item if true
			       }else{
				   ret.push(item);
			       }
			   });
	}else{
	    bbop.core.each(in_thing, function(item, index){ ret.push(item); });
	}
    }

    // For both: sort if there is anything.
    if( ret.length > 0 && sort_function ){
	ret.sort(sort_function);	    
    }

    return ret;
};

/*
 * Function: clone
 *
 * Clone an object down to its atoms.
 *
 * Parameters: 
 *  thing - whatever
 *
 * Returns: a new whatever
 */
bbop.core.clone = function(thing){

    var clone = null;

    if( typeof(thing) == 'undefined' ){
	// Nothin' doin'.
	//print("looks undefined");
    }else if( typeof(thing) == 'function' ){
	// Dunno about this case...
	//print("looks like a function");
	clone = thing;
    }else if( typeof(thing) == 'boolean' ||
	      typeof(thing) == 'number' ||
	      typeof(thing) == 'string' ){
	// Atomic types can be returned as-is (i.e. assignment in
	// JS is the same as copy for atomic types).
	//print("cloning atom: " + thing);
	clone = thing;
    }else if( typeof(thing) == 'object' ){
	// Is it a hash or an array?
	if( typeof(thing.length) == 'undefined' ){
	    // Looks like a hash!
	    //print("looks like a hash");
	    clone = {};
	    for(var h in thing){
		clone[h] = bbop.core.clone(thing[h]);
	    }
	}else{
	    // Looks like an array!
	    //print("looks like an array");
	    clone = [];
	    for(var i = 0; i < thing.length; i++){
		clone[i] = bbop.core.clone(thing[i]);
	    }
	}
    }else{
	// Then I don't know what it is--might be platform dep.
	//print("no idea what it is");
    }
    return clone;
};

/*
 * Function: to_string
 *
 * Essentially add standard 'to string' interface to the string class
 * and as a stringifier interface to other classes. More meant for
 * output. Only atoms, arrays, and objects with a to_string function
 * are handled.
 *
 * Parameters: 
 *  in_thing - something
 *
 * Returns: string
 * 
 * Also See: <dump>
 */
bbop.core.to_string = function(in_thing){

    var what = bbop.core.what_is(in_thing);
    if( what == 'number' ){
	return in_thing.toString();
    }else if( what == 'string' ){
	return in_thing;
    }else if( what == 'array' ){
	return bbop.core.dump(in_thing);
    }else if( in_thing.to_string && typeof(in_thing.to_string) == 'function' ){
	return in_thing.to_string();
    }else{
	throw new Error('to_string interface not defined for this object');
    }
};

/*
 * Function: dump
 *
 * Dump an object to a string form as best as possible. More meant for
 * debugging. For a slightly different take, see to_string.
 *
 * Parameters: 
 *  in_thing - something
 *
 * Returns: string
 * 
 * Also See: <to_string>
 */
bbop.core.dump = function(thing){

    var retval = '';

    var what = bbop.core.what_is(thing);
    if( what == null ){
	retval = 'null';
    }else if( what == 'null' ){
	retval = 'null';
    }else if( what == 'string' ){
	retval = '"' + thing + '"';
    }else if( what == 'boolean' ){
	if( thing ){
	    retval = "true";
	}else{
	    retval = "false";
	}
    }else if( what == 'array' ){

	var astack = [];
	bbop.core.each(thing, function(item, i){
			   astack.push(bbop.core.dump(item));
		       });
	retval = '[' + astack.join(', ') + ']';

    }else if( what == 'object' ){

	var hstack = [];
	bbop.core.each(thing, function(key, val){
			   hstack.push('"'+ key + '": ' +
				       bbop.core.dump(val));
		       });
	retval = '{' + hstack.join(', ') + '}';

    }else{
	retval = thing;
    }

    return retval;
};

/*
 * Function: has_interface
 *
 * Check to see if all top-level objects in a namespace supply an
 * "interface".
 * 
 * Mostly intended for use during unit testing.
 *
 * Parameters: 
 *  iobj - the object/constructor in question
 *  interface_list - the list of interfaces (as a strings) we're looking for
 *
 * Returns: boolean
 *
 * TODO: Unit test this to make sure it catches both prototype (okay I
 * think) and uninstantiated objects (harder/impossible?).
 */
bbop.core.has_interface = function(iobj, interface_list){
    var retval = true;
    bbop.core.each(interface_list,
		   function(iface){
		       //print('|' + typeof(in_key) + ' || ' + typeof(in_val));
		       //print('|' + in_key + ' || ' + in_val);
		       if( typeof(iobj[iface]) == 'undefined' &&
			   typeof(iobj.prototype[iface]) == 'undefined' ){
			   retval = false;
			   throw new Error(bbop.core.what_is(iobj) +
					   ' breaks interface ' + 
					   iface);
                       }
		   });
    return retval;
};

/*
 * Function: get_assemble
 *
 * Assemble an object into a GET-like query. You probably want to see
 * the tests to get an idea of what this is doing.
 * 
 * The last argument of double hashes gets quoted (Solr-esque),
 * otherwise not. It will try and avoid adding additional sets of
 * quotes to strings.
 *
 * This does nothing to make the produced "URL" in any way safe.
 * 
 * WARNING: Not a hugely clean function--there are a lot of special
 * cases and it could use a good (and safe) clean-up.
 * 
 * Parameters: 
 *  qargs - hash/object
 *
 * Returns: string
 */
bbop.core.get_assemble = function(qargs){

    var mbuff = [];
    for( var qname in qargs ){
	var qval = qargs[qname];

	if( typeof qval == 'string' || typeof qval == 'number' ){
	    // Is standard name/value pair.
	    var nano_buffer = [];
	    nano_buffer.push(qname);
	    nano_buffer.push('=');
	    nano_buffer.push(qval);
	    mbuff.push(nano_buffer.join(''));
	}else if( typeof qval == 'object' ){
	    if( typeof qval.length != 'undefined' ){
		// Is array (probably).
		// Iterate through and double on.
		for(var qval_i = 0; qval_i < qval.length ; qval_i++){
		    var nano_buff = [];
		    nano_buff.push(qname);
		    nano_buff.push('=');
		    nano_buff.push(qval[qval_i]);
		    mbuff.push(nano_buff.join(''));
		}
	    }else{
		// // TODO: The "and" case is pretty much like
		// // the array, the "or" case needs to be
		// // handled carefully. In both cases, care will
		// // be needed to show which filters are marked.
		// Is object (probably).
		// Special "Solr-esque" handling.
		for( var sub_name in qval ){
		    var sub_vals = qval[sub_name];

		    // Since there might be an array down there,
		    // ensure that there is an iterate over it.
		    if( bbop.core.what_is(sub_vals) != 'array' ){
			sub_vals = [sub_vals];
		    }

		    var loop = bbop.core.each;
		    loop(sub_vals,
			 function(sub_val){
			     var nano_buff = [];
			     nano_buff.push(qname);
			     nano_buff.push('=');
			     nano_buff.push(sub_name);
			     nano_buff.push(':');
			     if( typeof sub_val !== 'undefined' && sub_val ){
				 // Do not double quote strings.
				 // Also, do not requote if we already
				 // have parens in place--that
				 // indicates a complicated
				 // expression. See the unit tests.
				 var val_is_a = bbop.core.what_is(sub_val);
				 if( val_is_a == 'string' &&
				     sub_val.charAt(0) == '"' &&
				     sub_val.charAt(sub_val.length -1) == '"' ){
				     nano_buff.push(sub_val);
				 }else if( val_is_a == 'string' &&
				     sub_val.charAt(0) == '(' &&
				     sub_val.charAt(sub_val.length -1) == ')' ){
				     nano_buff.push(sub_val);
				 }else{
				     nano_buff.push('"' + sub_val + '"');
				 }
			     }else{
				 nano_buff.push('""');
			     }
			     mbuff.push(nano_buff.join(''));
			 });
		}
	    }
	}else if( typeof qval == 'undefined' ){
	    // This happens in some cases where a key is tried, but no
	    // value is found--likely equivalent to q="", but we'll
	    // let it drop.
	    // var nano_buff = [];
	    // nano_buff.push(qname);
	    // nano_buff.push('=');
	    // mbuff.push(nano_buff.join(''));	    
	}else{
	    throw new Error("bbop.core.get_assemble: unknown type: " + 
			    typeof(qval));
	}
    }
    
    return mbuff.join('&');
};

/*
 * Function: randomness
 *
 * Random number generator of fixed length. Return a random number
 * string of length len.
 *
 * Parameters: 
 *  len - the number of random character to return.
 *
 * Returns: string
 */
bbop.core.randomness = function(len){

    var random_base =
	['1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
	 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
	 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    var length = len || 10;
    var cache = new Array();
    for( var ii = 0; ii < length; ii++ ){
	var rbase_index = Math.floor(Math.random() * random_base.length);
	cache.push(random_base[rbase_index]);
    }
    return cache.join('');
};

/*
 * Function: first_split
 *
 * Attempt to return a two part split on the first occurrence of a
 * character.
 *
 * Returns '' for parts not found.
 * 
 * Unit tests make the edge cases clear.
 * 
 * Parameters:
 *  character - the character to split on
 *  string - the string to split
 *
 * Returns:
 *  list of first and second parts
 */
bbop.core.first_split = function(character, string){

    var retlist = null;

    var eq_loc = string.indexOf(character);
    if( eq_loc == 0 ){
	retlist = ['', string.substr(eq_loc +1, string.length)];
    }else if( eq_loc > 0 ){
	var before = string.substr(0, eq_loc);
	var after = string.substr(eq_loc +1, string.length);
	retlist = [before, after];
    }else{
	retlist = ['', ''];
    }

    return retlist;
};

/*
 * Function: url_parameters
 *
 * Return the parameters part of a URL.
 *
 * Unit tests make the edge cases clear.
 * 
 * Parameters:
 *  url - url (or similar string)
 *
 * Returns:
 *  list of part lists
 */
bbop.core.url_parameters = function(url){

    var retlist = [];

    // Pull parameters.
    var tmp = url.split('?');
    var path = '';
    var parms = [];
    if( ! tmp[1] ){ // catch bad url--nothing before '?'
	parms = tmp[0].split('&');
    }else{ // normal structure
	path = tmp[0];
	parms = tmp[1].split('&');
    }

    // Decompose parameters.
    bbop.core.each(parms,
		  function(p){
		      var c = bbop.core.first_split('=', p);
		      if( ! c[0] && ! c[1] ){
			  retlist.push([p]);
		      }else{
			  retlist.push(c);		  
		      }
		  });
    
    return retlist;
};

/*
 * Function: resourcify
 *
 * Convert a string into something consistent for urls (getting icons,
 * etc.). Return a munged/hashed-down version of the resource.
 * Assembles, converts spaces to underscores, and all lowercases.
 * 
 * Parameters:
 *  base - base url for the resource(s)
 *  resource - the filename or whatever to be transformed
 *  extension - *[optional]* the extension of the resource
 *
 * Returns:
 *  string
 */
bbop.core.resourcify = function(base, resource, extension){

    var retval = base + '/' + resource;

    // Add the extension if it is there.
    if( extension ){
	retval += '.' + extension;	
    }

    // Spaces to underscores and all lowercase.
    return retval.replace(" ", "_", "g").toLowerCase();
};

/*
 * Function: uuid
 *
 * RFC 4122 v4 compliant UUID generator.
 * From: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#2117523
 *
 * Parameters:
 *  n/a
 *
 * Returns:
 *  string
 */
bbop.core.uuid = function(){

    // Replace x (and y) in string.
    function replacer(c) {
	var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	return v.toString(16);
    }
    var target_str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return target_str.replace(/[xy]/g, replacer);
};

/*
 * Function: numeric_sort_ascending
 *
 * A sort function to put numbers in ascending order.
 * 
 * Useful as the argument to .sort().
 * 
 * See: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
 * 
 * Parameters:
 *  a - the first number
 *  b - the second number
 *
 * Returns:
 *  number of their relative worth
 */
bbop.core.numeric_sort_ascending = function(a, b){
    return a - b;
};

/*
 * Function: numeric_sort_descending
 *
 * A sort function to put numbers in descending order.
 * 
 * Useful as the argument to .sort().
 * 
 * See: https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/sort
 * 
 * Parameters:
 *  a - the first number
 *  b - the second number
 *
 * Returns:
 *  number of their relative worth
 */
bbop.core.numeric_sort_descending = function(a, b){
    return b - a;
};

/*
 * Function: dequote
 *
 * Remove the quotes from a string.
 * 
 * Parameters:
 *  str - the string to dequote
 *
 * Returns:
 *  the dequoted string (or the original string)
 */
bbop.core.dequote = function(str){
    var retstr = str;

    if( bbop.core.is_defined(str) && str.length > 2 ){
	var end = str.length -1;
	if( str.charAt(0) == '"' && str.charAt(end) == '"' ){
	    retstr = str.substr(1, end -1);
	}
    }

    return retstr;
};

/*
 * Function: ensure
 *
 * Make sure that a substring exists at the beginning or end (or both)
 * of a string.
 * 
 * Parameters:
 *  str - the string to ensure that has the property
 *  add - the string to check for (and possibly add)
 *  place - *[optional]* "front"|"back", place to ensure (defaults to both)
 *
 * Returns:
 *  a new string with the property enforced
 */
bbop.core.ensure = function(str, add, place){

    // 
    var do_front = false;
    var do_back = false;
    if( ! bbop.core.is_defined(place) ){
	do_front = true;
	do_back = true;
    }else if( place == 'front' ){
	do_front = true;
    }else if( place == 'back' ){
	do_back = true;
    }else{
	// Don't know what it is, not doing anything.
    }

    //
    var strlen = str.length;
    var addlen = add.length;
    var front_substr = str.substr(0, addlen);
    var back_substr = str.substr((strlen - addlen), (strlen -1));

    //
    var front_add = '';
    if( do_front && front_substr != add ){
	front_add = add;
    }
    var back_add = '';
    if( do_back && back_substr != add ){
	back_add = add;
    }

    // print('do_front: ' + do_front);
    // print('do_back: ' + do_back);
    // print('str.length: ' + strlen);
    // print('add.length: ' + addlen);
    // print('front_substr: ' + front_substr);
    // print('back_substr: ' + back_substr);
    // print('front_add: ' + front_add);
    // print('back_add: ' + back_add);

    return front_add + str + back_add;
};

/*
 * Function: chomp
 *
 * Trim the leading and trailing whitespace from a string.
 * Named differently so as not to confuse with JS 1.8.1's trim().
 * 
 * Parameters:
 *  str - the string to ensure that has the property
 *
 * Returns:
 *  the trimmed string
 */
bbop.core.chomp = function(str){

    var retstr = '';

    retstr = str.replace(/^\s+/,'');
    retstr = retstr.replace(/\s+$/,'');

    return retstr;
};

/*
 * Function: splode
 *
 * Break apart a string on certain delimiter.
 * 
 * Parameters:
 *  str - the string to ensure that has the property
 *  delimiter - *[optional]* either a string or a simple regexp; defaults to ws
 *
 * Returns:
 *  a list of separated substrings
 */
bbop.core.splode = function(str, delimiter){

    var retlist = null;

    if( bbop.core.is_defined(str) ){
	if( ! bbop.core.is_defined(delimiter) ){
	    delimiter = /\s+/;
	}
	
	retlist = str.split(delimiter);
    }

    return retlist;
};

// // Giving up on this for now: the general case seems too hard to work with 
// // in so many different, contradictory, and changing environments.
// /*
//  * Function: evaluate
//  * 
//  * Getting a cross-platform that can evaluate to the global namespace
//  * seems a little bit problematic. This is an attempt to wrap that all
//  * away.
//  * 
//  * This is not an easy problem--just within browsers there are a lot
//  * of issues:
//  * http://perfectionkills.com/global-eval-what-are-the-options/ After
//  * that, the server side stuff tries various ways to keep you from
//  * affecting the global namespace in certain circumstances.
//  * 
//  * Parameters:
//  *  to_eval - the string to evaluate
//  * 
//  * Returns:
//  *  A list with the following fields: retval, retval_str, okay_p, env_type.
//  */
// bbop.core.evaluate = function(to_eval){

//     var retval = null;
//     var retval_str = '';
//     var okay_p = true;
//     var env_type = 'server';

//     // Try and detect our environment.
//     try{
// 	if( bbop.core.is_defined(window) &&
// 	    bbop.core.is_defined(window.eval) &&
// 	    bbop.core.what_is(window.eval) == 'function' ){
// 		env_type = 'browser';
// 	    }
//     } catch (x) {
// 	// Probably not a browser then, right? Hopefully all the
// 	// servers that we'll run into are the same (TODO: check
// 	// nodejs).
//     }
//     print('et: ' + env_type);

//     // Now try for the execution.
//     try{
// 	// Try and generically evaluate.
// 	if( env_type == 'browser' ){
// 	    print('eval as if (browser)');
// 	    retval = window.eval(to_eval);
// 	}else{
// 	    // TODO: Does this work?
// 	    print('eval as else (server)');
// 	    //retval = this.eval(to_eval);		
// 	    retval = bbop.core.global.eval(to_eval);
// 	}
//     }catch (x){
// 	// Bad things happened.
// 	print('fail on: (' + retval +'): ' + to_eval);
// 	retval_str = '[n/a]';
// 	okay_p = false;
//     }
	
//     // Make whatever the tmp_ret is prettier for the return string.
//     if( bbop.core.is_defined(retval) ){
// 	if( bbop.core.what_is(retval) == 'string' ){
// 	    retval_str = '"' + retval + '"';
// 	}else{
// 	    retval_str = retval;
// 	}
//     }else{
// 	// Return as-is.
//     }

//     return [retval, retval_str, okay_p, env_type];
// };

/*
 * Function: extend
 * 
 * What seems to be a typical idiom for subclassing in JavaScript.
 * 
 * This attempt has been scraped together from bits here and there and
 * lucid explanations from Mozilla:
 * 
 * https://developer.mozilla.org/en-US/docs/JavaScript/Introduction_to_Object-Oriented_JavaScript
 * https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Details_of_the_Object_Model
 * https://developer.mozilla.org/en-US/docs/JavaScript/Guide/Inheritance_Revisited
 * https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/new
 * 
 * Parameters:
 *  subclass - the subclass object
 *  superclass - the superclass object
 * 
 * Returns:
 *  n/a
 */
bbop.core.extend = function(subclass, baseclass){

    // Create a temporary nothing so that we don't fiddle the
    // baseclass's(?) with what we do to subclass later on.
    function tmp_object(){}

    // This nothings prototype gets the base class's.
    tmp_object.prototype = baseclass.prototype;

    // We instantiate the tmp_object, whose prototype is the
    // baseclass's; we make subclass's prototype this object, giving
    // us something that is very much like baseclass.
    subclass.prototype = new tmp_object; // same as: "new tmp_object();"

    // Now we go back and make the constructor of subclass actually
    // subclass again--we blew it away in the last step. Now we have a
    // subclass constructor with the protoype of baseclass.
    subclass.prototype.constructor = subclass;

    // // Create a property to allow access to the constructor of
    // // baseclass. This is useful when subclass needs access to
    // // baseclass's constructor for property setting.
    // subclass.base_constructor = baseclass;

    // // Create a property to
    // subclass.parent_class = baseclass.prototype;
};
/* 
 * Package: test.js
 * 
 * Namespace: bbop.test
 * 
 * A trivial testing framework for JS. See test.tests.js for usage.
 * 
 *  Note: this cannot depend on core.js (it tests that), so some stuff
 *  may be duped. On the other hand, we can test ourselves--see
 *  test.js.tests.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.test == "undefined" ){ bbop.test = {}; }

/*
 * Constructor: test
 * 
 * Contructor for the BBOP JS unit test system.
 * 
 * Arguments:
 *  n/a
 * 
 * Returns:
 *  BBOP test suite object
 */
bbop.test = function(){

    ///
    /// Accounting and reporting.
    ///

    var test_number = 1;
    var tests_passed = 0;
    var tests_failed = 0;
    function _incr_tests(){ test_number = test_number + 1; }
    function _incr_passed(){ tests_passed = tests_passed + 1; }
    function _incr_failed(){ tests_failed = tests_failed + 1; }
    function _incr_failed(){ tests_failed = tests_failed + 1; }
    function _complete(bool, msg){
	if( bool ){
	    if( msg ){
		print('Test ' + test_number + ' passed: ' + msg + '.');
	    }else{
		print('Test ' + test_number + ' passed.');
	    }
	    _incr_passed();
	}else{
	    if( msg ){
		print('FAIL: Test ' + test_number + ' failed: ' + msg + '.');
	    }else{
		print('FAIL: Test ' + test_number + ' failed.');
	    }
	    _incr_failed();
	}
	test_number++;	
    }

    /*
     * Function: report
     *
     * Print a report about what happened during the tests.
     *
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  n/a; but prints the report as a side-effect
     */
    this.report = function(){
	if( tests_passed + 1 == test_number ){
	    print('* All tests passed.');
	}else{
	    print('* Tests passed: ' + tests_passed);
	    print('* Tests failed: ' + tests_failed);
	}
    };

    ///
    /// Internal helper functions--different kinds of comparisions.
    ///

    //
    function _same_array(one, two){
	var retval = true;
	if( one.length != two.length ){
	    retval = false;
	}else{
	    for( var i = 0; i < one.length; i++ ){
		if( one[i] != two[i] ){
		    retval = false;
		    break;
		}
	    }
	}
	return retval;
    }

    // Looking at array as sets of...something.
    function _same_set(set1, set2){
	var h1 = {};
	var h2 = {};
	for( var h1i = 0; h1i < set1.length; h1i++ ){ h1[set1[h1i]] = 1; }
	for( var h2i = 0; h2i < set2.length; h2i++ ){ h2[set2[h2i]] = 1; }
	return _same_hash(h1, h2);
    }

    // NOTE/WARNING: This is a very shallow comparison function.
    function _same_hash(hash1, hash2){

	var same_p = true;
	
	// See if the all of the keys in hash1 are defined in hash2
	// and that they have the same ==.
	for( var k1 in hash1 ){
	    if( typeof hash2[k1] === 'undefined' ||
		hash1[k1] !== hash2[k1] ){
		same_p = false;
		break;
	    }
	}

	// If there is still no problem...
	if( same_p ){

	    // Reverse of above.
	    for( var k2 in hash2 ){
		if( typeof hash1[k2] === 'undefined' ||
		    hash2[k2] !== hash1[k2] ){
		    same_p = false;
		    break;
		}
	    }
	}
	
	return same_p;
    }

    // TODO: This could probably be done better.
    function _link_comp(str1, str2){

	// Decompose links and arguments.
	var tmp1 = str1.split('?');
	var head1 = '';
	var args1 = [];
	if( ! tmp1[1] ){ // nothing before '?'
	    args1 = tmp1[0].split('&');
	}else{ // normal structure
	    head1 = tmp1[0];
	    args1 = tmp1[1].split('&');
	}
	var sorted_args1 = args1.sort();

	var tmp2 = str2.split('?');
	var head2 = '';
	var args2 = [];
	if( ! tmp2[1] ){ // nothing before '?'
	    args2 = tmp2[0].split('&');
	}else{ // normal structure
	    head2 = tmp2[0];
	    args2 = tmp2[1].split('&');
	}
	var sorted_args2 = args2.sort();

	// var tmp2 = str2.split('?');
	// var head2 = tmp2[0];
	// var args2 = tmp2[1].split('&');
	// var sorted_args2 = args2.sort();

	// Compare heads and arguments.
	var retval = false;
	if( head1 == head2 &&
	    _same_array(sorted_args1, sorted_args2) ){
	    retval = true;
	}
	return retval;
    }

    // Walk through the list and see if it's there.
    // If compareator is not defined, just to atom comparison.
    function _in_list(in_item, list, comparator){

	var retval = false;
	for(var li = 0; li < list.length; li++ ){
	    var list_item = list[li];

	    if( comparator ){
		var comp_op = comparator(in_item, list_item);
		if( comp_op && comp_op == true ){
		    retval = true;
		}
	    }else{
		if( in_item == list_item ){
		    retval = true;
		}
	    }
	}

	return retval;
    }

    // Basically asking if you can make the target string from the
    // base string with the add_str added into it somewhere. Strange,
    // but another way of looking at URL creation in some cases.
    function _is_string_embedded(target_str, base_str, add_str){

	// Walk through all of ways of splitting base_str and add
	// add_str in there to see if we get the target_str.
	var retval = false;
	for(var si = 0; si <= base_str.length; si++ ){
	    
	    var car = base_str.substr(0, si);
	    var cdr = base_str.substr(si, base_str.length);
	    //print(car + "|" + add_str + "|" + cdr);
	    if( car + add_str + cdr == target_str){
		retval = true;
		break;
	    }
	}
	return retval;
    }

    ///
    /// End-user comparisions and assertions.
    ///

    /*
     * Function: is_same_atom
     *
     * Test whether two atoms are the same.
     *
     * Parameters: 
     *  question - the atom to test
     *  answer - the expected atom
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    function _is_simple_same(question, answer, msg){
	_complete(question == answer, msg);
    }
    this.is_same_atom = _is_simple_same;

    /*
     * Function: is_different_atom
     *
     * A negative version of <is_same_atom>.
     *
     * Parameters: 
     *  question - the atom to test
     *  answer - the unexpected atom
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_different_atom = function(question, answer, msg){
	_complete(question != answer, msg);
    };

    /*
     * Function: is_defined
     *
     * Test whether a value is defined.
     *
     * Parameters: 
     *  thing - the value to test for being defined
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_defined = function(thing, msg){
	if( thing ){
	    _complete(true, msg);
	}else{
	    _complete(false, msg);
	}
    };

    /*
     * Function: is_not_defined
     *
     * A negative version of <is_defined>.
     *
     * Parameters: 
     *  thing - the value to test for being undefined
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_not_defined = function(thing, msg){
	if( thing ){
	    _complete(false, msg);
	}else{
	    _complete(true, msg);
	}
    };

    /*
     * Function: is_true
     *
     * Test whether a value is true.
     *
     * Parameters: 
     *  bool - the variable to test
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_true = function(bool, msg){
	if( bool == true ){
	    _complete(true, msg);
	}else{
	    _complete(false, msg);
	}
    };

    /*
     * Function: is_false
     *
     * A negative version of <is_true>.
     *
     * Parameters: 
     *  bool - the variable to test
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_false = function(bool, msg){
	if( bool == false ){
	    _complete(true, msg);
	}else{
	    _complete(false, msg);
	}
    };

    /*
     * Function: is_x_greater_than_y
     *
     * Test whether one value is greate than another. Uses the
     * standard ">" operator.
     *
     * Parameters: 
     *  x_thing - the expected greater value
     *  y_thing - the expected lesser value
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_x_greater_than_y = function(x_thing, y_thing, msg){
	if( x_thing > y_thing ){
	    _complete(true, msg);
	}else{
	    _complete(false, msg);
	}
    };

    /*
     * Function: is_same_url
     *
     * Test whether two links are functionally equivalent.
     *
     * Parameters: 
     *  link1 - url
     *  link2 - url
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_same_url = function(link1, link2, msg){
	_complete(_link_comp(link1, link2), msg);
    };    

    /*
     * Function: is_different_url
     *
     * A negative version of <is_same_url>.
     *
     * Parameters: 
     *  link1 - url
     *  link2 - url
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_different_url = function(link1, link2, msg){
	_complete(! _link_comp(link1, link2), msg);
    };    

    // /*
    //  * Function: is_same_url_by_assembly
    //  *
    //  * Test whether two URLs are functionally equivalent.
    //  *
    //  * Parameters: 
    //  *  link - url
    //  *  base - string
    //  *  psuedo_assembly - hash 
    //  *  msg - *[optional]* informational message about test
    //  *
    //  * Returns: 
    //  *  n/a
    //  */
    // function _psuedo_assmble(assembly){
    // 	var retval = '';
    // 	for( var k2 in hash2 ){
    // 	return retval;
    // }
    // this.is_same_url_by_assembly = function(link, base,
    // 					    psuedo_assembly, msg){
    // 	_complete(_link_comp(link,
    // 			     base + bbop.core.get_assemble(assembly)),
    // 		  msg);
    // };    

    /*
     * Function: is_same_set
     *
     * Test whether two sets (as atomic arrays) are the same.
     *
     * Parameters: 
     *  set1 - set (as array)
     *  set2 - set (as array)
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_same_set = function(set1, set2, msg){
	_complete(_same_set(set1, set2), msg);
    };

    /*
     * Function: is_different_set
     *
     * A negative version of <is_same_set>.
     *
     * Parameters: 
     *  set1 - set (as array)
     *  set2 - set (as array)
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_different_set = function(set1, set2, msg){
	_complete(! _same_set(set1, set2), msg);
    };

    /*
     * Function: is_same_hash
     *
     * Test whether two simple atomic hashes are the same.
     *
     * Parameters: 
     *  hash1 - hash
     *  hash2 - hash
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_same_hash = function(hash1, hash2, msg){
	_complete(_same_hash(hash1, hash2), msg);
    };

    /*
     * Function: is_different_hash
     *
     * A negative version of <is_same_hash>.
     *
     * Parameters: 
     *  hash1 - hash
     *  hash2 - hash
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_different_hash = function(hash1, hash2, msg){
	_complete(! _same_hash(hash1, hash2), msg);
    };

    /*
     * Function: is_in_list
     *
     * Test whether an item is in a list (array).
     *
     * Parameters: 
     *  item - the value to test
     *  list - the array to test in
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_in_list = function(item, list, msg){
	_complete(_in_list(item, list), msg);
    };

    /*
     * Function: is_not_in_list
     *
     * A negative version of <is_in_list>.
     *
     * Parameters: 
     *  item - the value to test
     *  list - the array to test in
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_not_in_list = function(item, list, msg){
	_complete(! _in_list(item, list), msg);
    };

    /*
     * Function: is_in_list_diy
     *
     * A DIY version of is_in_list. In this case, you can pass your
     * own comparison function to check the item against the list.
     *
     * Parameters: 
     *  item - the value to test
     *  list - the array to test in
     *  comp - the comparison function; like: function(in_item, list_item){...}
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_in_list_diy = function(item, list, comp, msg){
	_complete(_in_list(item, list, comp), msg);
    };

    /*
     * Function: is_not_in_list_diy
     *
     * A negative version of <is_in_list_diy>.
     *
     * Parameters: 
     *  item - the value to test
     *  list - the array to test in
     *  comp - the comparison function; like: function(in_item, list_item){...}
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_not_in_list_diy = function(item, list, comp, msg){
	_complete(! _in_list(item, list, comp), msg);
    };

    /*
     * Function: is_string_embedded
     *
     * Test whether a target string (target_str) can be made by
     * embedding a string (added_str) into a base string (base_str).
     * 
     * Useful in certain cases when checking URLs.
     *
     * Parameters: 
     *  target_str - the value to test
     *  base_str - the expected value
     *  added_str - the expected value
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_string_embedded = function(target_str, base_str, added_str, msg){
	_complete(_is_string_embedded(target_str, base_str, added_str), msg);
    };

    /*
     * Function: is_string_not_embedded
     *
     * A negative version of <is_string_embedded>.
     *
     * Parameters: 
     *  target_str - the value to test
     *  base_str - the expected value
     *  added_str - the expected value
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.is_string_not_embedded =
	function(target_str, base_str, added_str, msg){
	    _complete(! _is_string_embedded(target_str, base_str, added_str),
		      msg);
	};

    /*
     * Function: pass
     *
     * Always return test as true--useful when testing using control
     * structures and the like.
     *
     * Parameters: 
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.pass = function(msg){
	_complete(true, msg);
    };

    /*
     * Function: fail
     *
     * Always return test as false--useful when testing using control
     * structures and the like.
     *
     * Parameters: 
     *  msg - *[optional]* informational message about test
     *
     * Returns: 
     *  n/a
     */
    this.fail = function(msg){
	_complete(false, msg);
    };
};

// Hmmm.
if( exports ){
    exports.bbop = bbop;    
}
