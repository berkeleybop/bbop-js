/* 
 * Package: manager.js
 * 
 * Namespace: bbop.golr.manager
 * 
 * Generic BBOP manager for dealing with gross GOlr configuration and
 * management. Remember, this is actually a "subclass" of
 * <bbop.registry>. The defined events for this registry are: "reset",
 * "search", and "error".
 * 
 *  reset - functions for initializing and resetting
 *  search - functions for receiving standard search results
 *  error - functions to call when something goes very wrong
 * 
 * Both <bbop.golr.response> (or clean error data) and the manager
 * itself (this as anchor) should be passed to the callbacks.
 * 
 * TODO/BUG: <set_query> and <set_default_query> should both take
 * strings or <bbop.logic> as arguments. Those, as well as <get_query>
 * and <get_query> should only return <bbop.logic>.
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.golr == "undefined" ){ bbop.golr = {}; }

/*
 * Constructor: manager
 * 
 * Contructor for the GOlr query manager
 * 
 * Arguments:
 *  golr_loc - string url to GOlr server;
 *  golr_conf_obj - a <bbop.golr.conf> object
 * 
 * Returns:
 *  golr manager object
 * 
 * See also:
 *  <bbop.registry>
 */
bbop.golr.manager = function (golr_loc, golr_conf_obj){
    //bbop.registry.call(this, ['reset', 'search', 'error']);
    bbop.registry.call(this, ['reset', 'search', 'error']);
    this._is_a = 'bbop.golr.manager';

    // Get a good self-reference point.
    var anchor = this;

    // Per-manager logger.
    this._logger = new bbop.logger(this._is_a);
    //this._logger.DEBUG = true;
    this._logger.DEBUG = false;
    function ll(str){ anchor._logger.kvetch(str); }

    // To help keep requests from the past haunting us. Actually doing
    // something with this number is up to the UI.
    this.last_sent_packet = 0;
    //this.last_received_packet = 0;

    // Lightly check incoming arguments.
    // There should be a string url argument.
    // There could be a hash of pinned filters argument.
    if( ! golr_loc || ! golr_conf_obj ){
	ll('ERROR: no proper arguments');
    }
    if( typeof golr_loc != 'string' ){
	ll('ERROR: no proper golr url string argument');
    }
    if(	! golr_conf_obj._is_a || ! golr_conf_obj._is_a == 'bbop.golr.conf' ){
	    ll('ERROR: no proper bbop.golr.conf object argument');
	    throw new Error('boink! ' + bbop.core.what_is(golr_conf_obj) );
	}
    
    // Whether or not to prevent ajax events from going.
    // This may not be usable, or applicable, to all backends.
    this._safety = false;

    // Our default target url.
    this._solr_url = golr_loc;

    // Settle in the configurations.
    // this._golr_conf = new bbop.golr.conf(golr_conf_var);
    this._golr_conf = golr_conf_obj;

    // The current data batches that we are storing.
    this._batch_urls = [];
    this._batch_accumulator_func = function(){};
    this._batch_final_func = function(){};

    // The current state stack.
    this._excursions = [];

    // The current class/personality that we're using. It may be none.
    this._current_class = null;

    // Our (default) query and the real deal.
    this.fundamental_query = '*:*'; // cannot be changed
    this.default_query = '*:*'; // changable
    this.query = this.default_query; // current

    // Our (default) fl and whatever we have now.
    //this.default_fl = '*%2Cscore';
    this.default_fl = '*,score';
    this.current_fl = this.default_fl;

    // We remember defaults in the case of rows and start since they
    // are the core to any paging mechanisms and may change often.
    //this.default_rows = 25;
    //this.default_rows = 100;
    this.default_rows = 10;
    this.default_start = 0;
    this.current_rows = this.default_rows;
    this.current_start = this.default_start;

    // There is a reason for this...TODO: later (25+)
    this.default_facet_limit = 25;
    this.current_facet_limit = 25;
    // {facet_field_name: value, ...}
    this.current_facet_field_limits = {};
    // TODO: paging for facets;
    this.current_facet_offset = 25;
    this.current_facet_field_offsets = {};

    // Our default query args, with facet fields plugged in.
    this.query_variants =
	{
	    // Our default standard search type. This means we don't
	    // have to explicitly add fields to the search (although
	    // the query fields ('qf') are still necessary to make
	    // anything real happen).
	    defType: 'edismax',

	    // Things unlikely to be touched.
	    // There are unlikely to be messed with too much.
	    qt: 'standard',
	    indent: 'on',
	    wt: 'json',
	    //version: '2.2',
	    rows: anchor.current_rows,
	    start: anchor.current_start, // Solr is offset indexing
	    //fl: '*%2Cscore',
	    fl: anchor.default_fl,
    
	    // Deprecated: see query_filters
	    //fq: {},
	    
	    // Deprecated: see query_fields
	    //qf: {},
	    
	    // Deprecated: see query
	    //q: '*:*'

	    // Control of facets.
	    facet: 'true',
	    'facet.mincount': 1,
	    'facet.sort': 'count',
	    'json.nl': 'arrarr', // only in facets right now
	    'facet.limit': anchor.default_facet_limit
	    // TODO?: 'f.???.facet.limit': 50,
	    // TODO: 'json.nl': [flat|map|arrarr]

	    // Deprecated: see facet_fields
	    //'facet.field': []
	};

    // This is the 'qf' parameter. Although we keep it, it only needs
    // to be exposed when the query ('q') field is set.
    //this.query_fields = [];
    this.query_fields = {};

    // A richer way to handle the 'fq' query variant.
    // It should look like:
    // {<filter>: {<value>:{'sticky_p':(t|f), 'negative_p':(t|f)}, ...}}
    this.query_filters = {};

    // The engine for the facet.field list.
    this.facet_fields = {};

    /*
     * Function: debug
     * 
     * Turn on or off the verbose messages. Uses <bbop.logger>, so
     * they should come out everywhere.
     * 
     * Parameters: 
     *  p - *[optional]* true or false for debugging
     *
     * Returns: 
     *  boolean; the current state of debugging
     */
    this.debug = function(p){
	if( p == true || p == false ){
	    this._logger.DEBUG = p;
	    // TODO: add debug parameter a la include_highlighting
	}
	return this._logger.DEBUG;
    };

    /*
     * Function: lite
     * 
     * Limit the returns fields (the parameter "fl") to the ones
     * defined in the set of fields defined in results, label fields
     * if available (i.e. "_label", "_map" when "_label" is
     * multi=valued), and "score" and "id".
     * 
     * The default is "false".
     * 
     * Parameters: 
     *  use_lite_p - *[optional]* true or false, none just returns current
     *
     * Returns: 
     *  boolean; the current state of lite-ness
     */
    this.lite = function(use_lite_p){

	// Adjust the current state accordingly.
	if( use_lite_p == true || use_lite_p == false ){
	    if( use_lite_p == true ){
		
		// The actual collections and adjustment.
		// First, this only works if we have a personality, so
		// check to see if we have one.
		var per = anchor.get_personality();
		if( per ){
		    // Since we have a personality, collect all of the
		    // mentioned fields.
		    var field_collection = {};
		    var loop = bbop.core.each;
		    var union = bbop.core.merge;
		    var ccl = anchor._current_class;

		    // Fill field_collection with the fields
		    // in the given category.
		    //loop(['boost', 'result', 'filter'],
		    //loop(['result', 'filter'],
		    loop(['result'],
			 function(cat){
			     field_collection = 
				 union(field_collection, ccl.get_weights(cat));
			 });
		    
		    // Next, flatten into a list.
		    var flist = bbop.core.get_keys(field_collection);

		    // Now for all the fields in these categories, see
		    // if we can find additional "special" labels to
		    // go with them.
		    loop(flist,
		    	 function(flist_item){
			     loop(['_label'],
			     //loop(['_label', '_label_searchable'],
		    		   function(field_suffix){
				       var new_field = 
					   flist_item + field_suffix;
				       var nf_obj = ccl.get_field(new_field);
				       if( nf_obj ){
					   flist.push(new_field);

					   // There appears to be the
					   // thing label. If they are
					   // both multi-valued, then
					   // there will be a map as
					   // well.
					   if( nf_obj.is_multi() ){
					       flist.push(flist_item + '_map');
					   }
				       }
				   });
			 });


		    // Finally, set these fields (plus score) as the
		    // new return fields.
		    flist.push('score');
		    flist.push('id');
		    //anchor.current_fl = flist.join('%2C');
		    anchor.current_fl = flist.join(',');
		    anchor.set('fl', anchor.current_fl);
		}

	    }else{ // else false
		// Reset.
		anchor.current_fl = anchor.default_fl;
		anchor.set('fl', anchor.current_fl);
	    }
	}

	// Return the current state.
	var retval = false;
	if( anchor.default_fl != anchor.current_fl ){
	    retval = true;
	}
	return retval;
    };

    // An internal helper function to munge the name of a field into
    // the name of its corresponding facet field.
    function _field_to_facet_field(field){
	return 'f.' + field + '.facet.limit';
    }
    
    /*
     * Function: get_facet_limit
     * 
     * Get the limit for a specified facet or the global limit.
     * 
     * Parameters: 
     *  field - *[optional]* limit for a specific field; otherwise global value
     *
     * Returns: 
     *  integer or null
     */
    this.get_facet_limit = function(field){
	var retval = null;

	if( ! field ){
	    retval = anchor.current_facet_limit;
	}else{
	    var f = _field_to_facet_field(field);
	    var try_val = anchor.current_facet_field_limits[f];
	    if( bbop.core.is_defined(try_val) ){
		retval = try_val;
	    }
	}

	return retval;
    };

    /*
     * Function: set_facet_limit
     * 
     * Change the number of facet values returned per call.
     * The default is likely 25.
     * 
     * Just as in Solr, a -1 argument is how to indicate unlimted
     * facet returns.
     * 
     * This setting does not survive things like <resets_facet_limit>.
     * 
     * Parameters: 
     *  arg1 - (integer) set the global limit
     *
     * Parameters: 
     *  arg1 - (string) the name of the field to check
     *  arg2 - (integer) set the limit for this field
     *
     * Returns: 
     *  boolean on whether something was set
     */
    this.set_facet_limit = function(arg1, arg2){
	var retval = false;

	// Decide which form of the function we're using.
	if( ! bbop.core.is_defined(arg2) && 
	    bbop.core.what_is(arg1) == 'number' ){ // form one
		
		// Set
		var nlimit = arg1;
		anchor.current_facet_limit = nlimit;
		anchor.set('facet.limit', anchor.current_facet_limit);
		
		retval = true;
	
	}else if( bbop.core.is_defined(arg1) && 
		  bbop.core.is_defined(arg2) &&
		  bbop.core.what_is(arg1) == 'string' &&
		  bbop.core.what_is(arg2) == 'number' ){
		      
		      var field = _field_to_facet_field(arg1);
		      var limit = arg2;
		      anchor.current_facet_field_limits[field] = limit;
		      
		      retval = true;
	}

	return retval;
    };

    /*
     * Function: set_default_facet_limit
     * 
     * Permanently change the default number of facet values returned
     * per call. The default's default is likely 25.
     * 
     * Just as in Solr, a -1 argument is how to indicate unlimted
     * facet returns.
     * 
     * Parameters: 
     *  lim - (integer) set the global default limit
     *
     * Returns: 
     *  old default
     */
    this.set_default_facet_limit = function(lim){

	// Capture ret.
	var retval = anchor.default_facet_limit;

	// Set
	anchor.default_facet_limit = lim;
	//anchor.set('facet.limit', anchor.default_facet_limit);
		
	return retval;
    };

    /*
     * Function: reset_facet_limit
     * 
     * Either reset the global limit to the original (likely 25)
     * and/or remove the specified filter. Sets everything back to the
     * original values or whatever was set by
     * <set_default_facet_limit>.
     * 
     * Parameters: 
     *  field - *[optional]* remove limit for a field; otherwise all and global
     *
     * Returns: 
     *  boolean on whether something was reset
     */
    this.reset_facet_limit = function(field){
	var retval = false;

	if( ! bbop.core.is_defined(field) ){
	    // Eliminate all fields by blowing them away.
	    anchor.current_facet_limit = anchor.default_facet_limit;
	    anchor.set('facet.limit', anchor.current_facet_limit);
	    anchor.current_facet_field_limits = {};
	    retval = true;
	}else{ // eliminate just the one field
	    var f = _field_to_facet_field(field);
	    if( bbop.core.is_defined(anchor.current_facet_field_limits[f]) ){
		delete anchor.current_facet_field_limits[f];
		retval = true;
	    }
	}

	return retval;
    };

    /*
     * Function: get_results_count
     * 
     * Get the current number of results that will be returned.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  integer
     */
    this.get_results_count = function(field){
	return anchor.get('rows');
    };

    /*
     * Function: set_results_count
     * 
     * Change the number of result documents returned per call.
     * The default is likely 10.
     * 
     * Parameters: 
     *  count - (integer) set the global results count
     *
     * Returns:
     *  the count set
     */
    this.set_results_count = function(count){
	anchor.set('rows', count);
	anchor.current_rows = count;
	return anchor.current_rows;
    };

    /*
     * Function: reset_results_count
     * 
     * Reset the number of documents to their original setting, likely
     * 10.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the new count
     */
    this.reset_results_count = function(){
	anchor.set('rows', anchor.default_rows);
	anchor.current_rows = anchor.default_rows;
	return anchor.current_rows;
    };

    /*
     * Function: plist_to_property_hash
     *
     * Turn a plist to a hash containing the different properties that
     * can be defined for a query filter. Possible values are: '+'
     * (positive filter), '-' (negative filter), '*' (sticky filter),
     * '$' (transient). If mutually exclusive properties are defined
     * (e.g. both '+' and '-'), the last one will be used. Or, since
     * that is a call to silliness, let's say the behavior is
     * undefined.
     *
     * Parameters: 
     *  plist - *[optional]* a list of properties to apply to the filter
     *
     * Returns: 
     *  A hash version of the plist; otherwise, the default property hash
     */
    this.plist_to_property_hash = function(plist){

	// Let's start with the default values.
	var phash = {
	    //'positive_p': true,
	    'negative_p': false,
	    //'transient_p': true
	    'sticky_p': false
	};

	// If not defined, just return the default list.
	if( plist ){	    
	    bbop.core.each(plist,
			   function(item){
			       if( item == '+' ){
				   phash['negative_p'] = false;
				   //phash['positive_p'] = true;
			       }else if( item == '-' ){
				   phash['negative_p'] = true;
				   //phash['positive_p'] = false;
			       }else if( item == '*' ){
				   phash['sticky_p'] = true;
				   //phash['transient_p'] = false;
			       }else if( item == '$' ){
				   phash['sticky_p'] = false;
				   //phash['transient_p'] = true;
			       }
			   });
	}

	return phash;
    };

    /*
     * Function: add_query_filter_as_string
     *
     * Setter for query filters ('fq'). Acts as a 
     *
     * Parameters: 
     *  filter_string - filter (type) string (e.g. "-type:gene")
     *  plist - *[optional]* list of properties of the filter
     *
     * Returns: 
     *  (TODO) The current query filter hash.
     * 
     * See also:
     *  <add_query_filter>
     */
    this.add_query_filter_as_string = function(filter_string, plist){
	
	// Split the incoming filter string into its component parts.
	var f_v = bbop.core.first_split(':', filter_string);
	var fname = f_v[0];
	var fval = f_v[1];

	// Need to shuck the value from the quotes, as in load_url.
	fval = bbop.core.dequote(fval);

	//var props = plist || ['$'];
	var props = plist;

	// Only continue on sensible inputs.
	var ret = {};
	if( fname != '' && fval != '' ){

	    // Similar to the URL loader.
	    var lead_char = fname.charAt(0);
	    if( lead_char == '-' || lead_char == '+' ){
		props.push(lead_char);
		fname = fname.substr(1, fname.length -1);
	    }
	    
	    ret = this.add_query_filter(fname, fval, props);
	}

	return ret;
    };

    /*
     * Function: add_query_filter
     *
     * Setter for query filters ('fq').
     *
     * Parameters: 
     *  filter - filter (type) string
     *  value - filter value string (or TODO: defined logic hash)
     *  plist - *[optional]* list of properties of the filter
     *
     * Returns: 
     *  (TODO) The current query filter hash.
     * 
     * See also:
     *  <plist_to_property_hash>
     */
    this.add_query_filter = function(filter, value, plist){
	
	// Make sure we've defined the group.
	if( ! bbop.core.is_defined(this.query_filters[filter]) ){
	    this.query_filters[filter] = {};
	}

	this.query_filters[filter][value] = this.plist_to_property_hash(plist);
	
	//ll("Current state: " + bbop.core.dump(this.query_filters));

	return {}; // TODO
    };

    /*
     * Function: remove_query_filter
     *
     * Remover for query filters ('fq'), is a plist is specified, it
     * will only remove if all of the listed criteria are met.
     *
     * Parameters: 
     *  filter - filter (type) string
     *  value - filter value string (TODO: or defined logic hash)
     *  plist - *[optional]* list of properties of the filter
     *
     * Returns: 
     *  boolean (on success)
     */
    this.remove_query_filter = function(filter, value, plist){

	// Default return value.
	var retval = false;

	// Internal helper to delete a low level key, and then if the
	// top-level is empty, get that one too.
	function _full_delete(hash, key1, key2){
	    if( key1 && key2 && hash &&
		hash[key1] && hash[key1][key2] ){
		    delete hash[key1][key2];
		}
	    if( bbop.core.is_empty(hash[key1]) ){
		delete hash[key1];
	    }
	}

	// If we have a filter, a value, and it's there...
	if( filter && value &&
	    anchor.query_filters[filter] &&
	    anchor.query_filters[filter][value] ){

		// If no real plist hash been defined, just go ahead
		// and get rid of that. Otherwise, make sure that the
		// defined plist and the stored properties are the
		// same before deleting.
		if( ! plist || bbop.core.is_empty(plist) ){
		    _full_delete(anchor.query_filters, filter, value);
		    retval = true;
		}else{
		    
		    var filter_phash = anchor.query_filters[filter][value];
		    var in_phash = anchor.plist_to_property_hash(plist);
		    
		    if( bbop.core.is_same(filter_phash, in_phash) ){		
			_full_delete(anchor.query_filters, filter, value);
			retval = true;
		    }
		}
	    }

	return retval;
    };

    /*
     * Function: reset_query_filters
     *
     * Reset the query filters ('fq'); but leave sticky filters alone.
     *
     * Parameters: 
     *  n/a
     * 
     * Returns: 
     *  (TODO) The current query filter hash.
     */
    this.reset_query_filters = function(){

	// Drill down and delete all non-stickies.
	var loop = bbop.core.each;
	loop(anchor.query_filters,
	     function(filter, values){
		 //ll('filter: ' + filter);
		 loop(values,
		      function(value, props){
			  //ll('  value: ' + value);
			  var sticky_p = props['sticky_p'];
			  if( ! sticky_p ){
			      //ll('hit: ' + filter + ', ' + value);
			      anchor.remove_query_filter(filter, value);
			  }
		      });
	     });

	return {}; // TODO
    };

    /*
     * Function: get_query_filter_properties
     *
     * Get a hash representing a query filter ('fq').
     *
     * Parameters: 
     *  key - filter string (TODO: or defined logic hash)
     *
     * Returns: 
     *  The current query filter hash for key.
     */
    this.get_query_filter_properties = function(filter, value){

	// Default return value.
	var retobj = null;
	
	// If we have a key and it's there...
	var aqf = anchor.query_filters;
	if( filter && value && aqf[filter] && aqf[filter][value] ){
	    retobj =
		{
		    'filter' : filter,
		    'value' : value,
		    //'polarity': aqf[filter][value]['negative_p'],
		    'negative_p': aqf[filter][value]['negative_p'],
		    'sticky_p': aqf[filter][value]['sticky_p']
		};
	}

	return retobj;
    };

    /*
     * Function: get_query_filters
     *
     * Get a list of hashes representing the query filters ('fq'). The
     * return lists look like:
     *
     * : [{'filter': A, 'value': B, 'negative_p': C, 'sticky_p': D}, ...]
     *
     * Where A and B are strings and C and D are booleans.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  A list of the current query filter hashs.
     */
    this.get_query_filters = function(){

	var retlist = [];	
	var loop = bbop.core.each;
	loop(anchor.query_filters,
	     function(f, values){
		 loop(values,
		      function(v, props){
			  retlist.push(anchor.get_query_filter_properties(f,v));
		      });
	     });

	return retlist;
    };

    /*
     * Function: get_sticky_query_filters
     *
     * Get a list of hashes representing the current stucky query
     * filters ('fq'). See <get_query_filters> for a specification of
     * what the return type looks like.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns: 
     *  A list of the current sticky query filter hashs.
     * 
     * See also:
     *  <get_query_filters>
     */
    this.get_sticky_query_filters = function(){

	var retlist = [];	
	var loop = bbop.core.each;
	loop(anchor.query_filters,
	     function(f, values){
		 loop(values,
		      function(v, props){
			  var qfp = anchor.get_query_filter_properties(f,v);
			  if( qfp['sticky_p'] == true ){
			      retlist.push(qfp);			      
			  }
		      });
	     });

	return retlist;
    };

    // A little extra thing that we might need sometimes.
    this.query_extra = null;

    // Spaces can cause problems in URLs in some environments.
    //final_qurl = final_qurl.replace(/ /g, '%20');
    // Convert the URL into something more usable.
    // Because we internally use %09 as a special case, make sure
    // we don't double-up on it.
    this._query_encode = function(str_to_encode){

	var fs1 = encodeURI(str_to_encode);
	var fs2 = fs1.replace(/\%2509/g, '%09');

	var final_encoding = fs2;
	return final_encoding;
    };

    // The callback function called after a successful AJAX
    // intialization/reset call. First it runs some template code,
    // then it does all of the callbacks.
    this._run_reset_callbacks = function(json_data){
	ll('run reset callbacks...');
	var response = new bbop.golr.response(json_data);
	anchor.apply_callbacks('reset', [response, anchor]);
    };

    // The main callback function called after a successful AJAX call in
    // the update function.
    this._run_search_callbacks = function(json_data){
	ll('run search callbacks...');
	var response = new bbop.golr.response(json_data);
	anchor.apply_callbacks('search', [response, anchor]);
    };

    // This set is called when we run into a problem.
    this._run_error_callbacks = function(json_data){
	ll('run error callbacks...');
	var response = new bbop.golr.response(json_data);
	anchor.apply_callbacks('error', [response, anchor]);
    };

    /*
     * Function: filter_list_to_assemble_hash
     *
     * Get all of our query filter variables and try and make
     * something of them that <get_assemble> can understand.
     *
     * Sticky doesn't matter here, but negativity does. However, we
     * can be pretty naive since the hashing should have already taken
     * out mutually exclusive dupes.
     * 
     * The argument is a list of query filter properties, as returned
     * by <get_query_filters> and <get_sticky_query_filters>.
     *
     * Parameters:
     *  flist - a list of query filter properties (see above)
     *
     * Returns:
     *  hash of filter names to value lists
     * 
     * See also:
     *  <get_query_filters>
     *  <get_sticky_query_filters>
     */
    this.filter_list_to_assemble_hash = function(flist){
	var h = {};
	bbop.core.each(flist,
		       function(filter_property){

			   // Grab only the properties that affect the
			   // URL.
			   var filter = filter_property['filter'];
			   var value = filter_property['value'];
			   var negative_p = filter_property['negative_p'];

			   // We need to alter at the filter level.
			   if( negative_p ){
			       filter = '-' + filter;
			   }

			   // Make sure it is defined.
			   if( ! bbop.core.is_defined(h[filter]) ){
			       h[filter] = [];
			   }
			   h[filter].push(value);
		       });
	return h;
    };

    /*
     * Function: sensible_query_p
     * 
     * Simply ask the manager if a free text query ('q') makes sense
     * at this point.
     * 
     * This currently means that the query text ('q') is three (3) or
     * longer and that query fields ('qf') are defined.
     * 
     * This is an overridable opinion of the manager.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  boolean
     */
    this.sensible_query_p = function(qfs){
	var retval = false;
	var q = anchor.get_query();
	var qf = anchor.query_field_set();
	if( q && q.length >= 3 && qf && ! bbop.core.is_empty(qf) ){
	    retval = true;
	}
	return retval;
    };

    /*
     * Function: last_packet_sent
     *
     * It is up to the UI to do something interesting with this number.
     * 
     * Also remember that this number only rises through calls to
     * <update> or one of its wrappers. Calls to <get_query_url> and
     * the like will not affect this number.
     * 
     * Parameters:
     *  n/a 
     *
     * Returns:
     *  integer
     * 
     * See also:
     *  <update>
     */
    this.last_packet_sent = function(){
    	return anchor.last_sent_packet;
    };

    /*
     * Function: clear
     *
     * Clear all non-sticky query parameters to get back to a more
     * "original" state.
     * 
     * Not to be confused with <reset>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  n/a
     */
    this.clear = function(){

	// Reset 'q'.
	anchor.query = anchor.default_query;

	// Reset 'fq', all but sticky.
	anchor.reset_query_filters();
    };

    /*
     * Function: reset
     *
     * Manually trigger the "reset" chain of events.
     *
     * This is a curried wrapper for <update> and should be preferred
     * over a direct call to update.
     *
     * Note to be confused with <clear>.
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <update>
     */
    this.reset = function(){
	return anchor.update('reset');
    };

    /*
     * Function: search
     *
     * Trigger the "search" chain of events.
     * Takes a field-keyed hash of bbop.logics as an argument.
     * 
     * This is a curried wrapper for <update> and should be preferred
     * over a direct call to update.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <update>
     */
    this.search = function(){
	return anchor.update('search');
    };

    /*
     * Function: page
     *
     * Re-trigger the "search" chain of events, but with the variables
     * set for a different section of the results.
     * 
     * Note that this operates independently of any impossibilites in
     * the results--just how such paging would look and
     * triggering. Ths UI should handle impossibilities and the like.
     * 
     * This is a wrapper for <update> and should be preferred over a
     * direct call to update.
     * 
     * Parameters: 
     *  rows - the number of rows to return
     *  start - the offset of the rows to return
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <update>
     */
    this.page = function(rows, start){
	anchor.set('rows', rows);
	anchor.set('start', start);
	return anchor.update('search', rows, start);
    };

    /*
     * Function: page_first
     *
     * Currently a convenience alias for <search>. Think about it--it
     * makes sense.
     * 
     * This is a wrapper for <page> and should be preferred over a
     * direct call to page.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  n/a
     * 
     * See also:
     *  <page>
     */
    this.page_first = anchor.search;
    
    /*
     * Function: page_previous
     * 
     * This is a wrapper for <page> and should be preferred over a
     * direct call to page.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <page>
     */
    this.page_previous = function(){
	var do_rows = anchor.get_page_rows();
	var do_offset = anchor.get_page_start() - do_rows;
	return anchor.page(do_rows, do_offset);
    };
    
    /*
     * Function: page_next
     * 
     * This is a wrapper for <page> and should be preferred over a
     * direct call to page.
     * 
     * Parameters: 
     *  the query url (with the jQuery callback specific parameters)
     *
     * Returns:
     *  n/a
     * 
     * See also:
     *  <page>
     */
    this.page_next = function(){
	var do_rows = anchor.get_page_rows();
	var do_offset = anchor.get_page_start() + do_rows;
	return anchor.page(do_rows, do_offset);
    };
    
    /*
     * Function: page_last
     * 
     * Trigger search on last page parameters.
     * 
     * Since the manager has no idea about what is actually being
     * returned, the real world number of total documents needs to be
     * added as an argument.
     * 
     * This is a wrapper for <page> and should be preferred over a
     * direct call to page.
     * 
     * Parameters: 
     *  total_document_count - integer for the total number of docs found
     *
     * Returns:
     *  the query url (with the jQuery callback specific parameters)
     * 
     * See also:
     *  <page>
     */
    this.page_last = function(total_document_count){
	var do_rows = anchor.get_page_rows();
	var mod = total_document_count % do_rows;
	var do_offset = total_document_count - mod;
	// ll("page_last: " + total_document_count + " " +
	//    do_rows + " " + mod + " " + do_offset);
	var ret = null;
	if( mod == 0 ){
	    ret = anchor.page(do_rows, do_offset - do_rows);
	}else{
	    ret = anchor.page(do_rows, do_offset);
	}
	return ret;
    };

    /*
     * Function: get_page_rows
     *
     * Return the number of rows the manager is currently set
     * to. Useful as an argument to <page>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  integer; the number of rows the manager is currently set to
     * 
     * See also:
     *  <page>
     */
    this.get_page_rows = function(){
	return anchor.get('rows');
    };

    /*
     * Function: get_page_start
     *
     * Return the rows offset the manager is currently set to. Useful
     * as an argument to <page>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  integer; the offset the manager is currently set to
     * 
     * See also:
     *  <page>
     */
    this.get_page_start = function(){
	return anchor.get('start');
    };

    /*
     * Function: add_query_field
     * 
     * Add a new query field to the query. 
     * 
     * This does not go through and expand into searchable fields, for
     * that see: <query_field_set>.
     *
     * Parameters: 
     *  qf - the query field to add
     *  boost - *[optional]* defaults to 1.0
     *
     * Returns:
     *  true or false on whether or not it is a new field
     * 
     * See also:
     *  <query_field_set>
     */
    this.add_query_field = function(qf, boost){
	
	var retval = false;

	// Make sure that some boost is there.
	if( ! bbop.core.is_defined(boost) ){
	    boost = 1.0;
	}

	// Check.
	if( ! bbop.core.is_defined(anchor.query_fields[qf]) ){
	    retval = true;
	}

	// Add.
	anchor.query_fields[qf] = boost;

	return retval;
    };

    /*
     * Function: query_field_set
     *
     * Bulk getter/setter for the query fields--the fields that are
     * searched (and by what weight) when using a query ('q' or
     * set_query(), i.e. the 'qf' field).
     * 
     * This will always use searchable fields if possible,
     * automatically replacing the non-searchable versions (I can't
     * think of any reason to use non-searchable versions unless you
     * want your searches to not work) if a personality is set. If no
     * personality is set, it will just use the arguments as-is.
     * 
     * The argument replaces the current set.
     *
     * The qfs argument should be a hash like:
     * 
     *  {'field01': value01, ...}
     * 
     * Parameters: 
     *  qfs - *[optional]* query fields to set
     *
     * Returns:
     *  the current query_fields array (e.g. ["field01^value01", ...])
     */
    this.query_field_set = function(qfs){

	// Covenience.
	var loop = bbop.core.each;
	var cclass = anchor._current_class;

	// Only do something if we have a query field set.
	if( qfs ){
	    
	    // Only do the probing if a personality has been set.
	    if( cclass ){

		// Get the current searchable extension string from
		// the personality class.
		//var s_ext = cclass.searchable_extension();
		// Actually, we're going to make this non-variable.
		var s_ext = '_searchable';

		// Probe the input to see if there are any searchable
		// alternatives to try, use those instead.
		var searchable_qfs = {};
		loop(qfs,
	    	     function(filter, value){
			 // If the probe fails, just put in
			 // whatever is there.
			 var cfield = cclass.get_field(filter);
			 if( cfield && cfield.searchable() ){
			     //ll('filter/value:');
			     var new_f = filter + s_ext;
			     searchable_qfs[new_f] = value;
			 }else{
			     searchable_qfs[filter] = value;
			 }
	    	     });
		qfs = searchable_qfs;
	    }	    

	    // Overwrite the current.
	    anchor.query_fields = qfs;
	}
	
	// Using the original information, convert them to the
	// proper output format.
	var output_format = [];
	loop(anchor.query_fields,
	     function(filter, value){
		 output_format.push(filter + '^' + value);
	     });
	return output_format;
    };

    /*
     * Function: facets
     *
     * Bulk getter/setter for facets (technically 'facet.field').
     *
     * Parameters: 
     *  key - *[optional]* facet to add to the facet list
     *
     * Parameters: 
     *  list - *[optional]* list to replace the current list with
     *
     * Returns:
     *  the current facets hash.
     */
    this.facets = function(list_or_key){
	if( list_or_key ){
	    if( bbop.core.what_is(list_or_key) != 'array' ){
		// Arrayify it.
		list_or_key = [list_or_key];
	    }else{
		// When there is a list, we are replacing the whole
		// thing, so let's just poof it out of existance.
		anchor.facet_fields = {};
	    }
	    bbop.core.each(list_or_key,
			   function(item){
			       anchor.facet_fields[item] = true;
			   });
	}
	return bbop.core.get_keys(anchor.facet_fields);
    };

    /*
     * Function: set_default_query
     *
     * Setter for the default query for the query variable ('q').
     * 
     * Call <reset_query> if you want to affect query immediately.
     * 
     * Parameters: 
     *  new_default_query - new default query string (or TODO: <bbop.logic>)
     *
     * Returns:
     *  the current setting of default query for ('q')
     */
    this.set_default_query = function(new_default_query){
	anchor.default_query = new_default_query;
	return anchor.default_query;
    };

    // /*
    //  * Function: set_first_run_query
    //  *
    //  * Setter for a first run query.  Normally, when <reset_query>, or
    //  * related method, is executed, we reset back to the default
    //  * query. This method sets a one time variable so a non empty
    //  * value can be used for the first reset.
    //  * 
    //  * Call <reset_query> if you want to affect query immediately.
    //  * 
    //  * Parameters: 
    //  *  first_run_query - query_string (or TODO: <bbop.logic>)
    //  *
    //  * Returns:
    //  *  the current setting of default query for ('q')
    //  */
    // this.set_first_run_query = function(first_run_query){
    // 	anchor.default_query = new_default_query;
    // 	return anchor.default_query;
    // };

    /*
     * Function: reset_default_query
     *
     * Reset the default query back to "*:*".
     * 
     * Call <reset_query> if you want to affect query immediately.
     * 
     * Parameters:
     *  n/a
     *
     * Returns:
     *  the current setting of default query ('q')
     */
    this.reset_default_query = function(){
	anchor.default_query = anchor.fundamental_query;
	return anchor.default_query;
    };

    /*
     * Function: set_query
     *
     * Setter for the query variable ('q').
     * 
     * Parameters: 
     *  new_query - new value for the query string (or TODO: <bbop.logic>)
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_comfy_query>
     */
    this.set_query = function(new_query){
	anchor.query = new_query;
	return anchor.query;
    };

    /*
     * Function: set_comfy_query
     *
     * A specialized setter for the query variable ('q'), as follows:
     *
     * If the input is all alphanum or space, the input is
     * tokenized. The last token, if it is at least three characters,
     * gets a wildcard '*'.
     * 
     * This might be a more comfortable way to search for most naive
     * (non-power user) interfaces.
     * 
     * Parameters: 
     *  new_query - new value for the query string (or TODO: <bbop.logic>)
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_query>
     */
    this.set_comfy_query = function(new_query){

	var comfy_query = new_query;

	// Check that there is something there.
	if( new_query && new_query.length && new_query.length > 0 ){

	    // That it is alphanum+space-ish
	    var alphanum = new RegExp(/^[a-zA-Z0-9 ]+$/);
	    if( alphanum.test(new_query) ){
	    
		// Break it into tokens and get the last.
		var tokens = new_query.split(new RegExp('\\s+'));
		var last_token = tokens[tokens.length -1];
		//ll('last: ' + last_token);
		
		// If it is three or more, add the wildcard.
		if( last_token.length >= 3 ){
		    tokens[tokens.length -1] = last_token + '*';

		    // And join it all back into our comfy query.
		    comfy_query = tokens.join(' ');
		}
	    }
	}

	// Kick it back to the normal set_query.
	return anchor.set_query(comfy_query);
    };

    /*
     * Function: set_id
     *
     * A limited setter, removing whatever else is on query. This is
     * for when you want to lock into one (unique) document by id
     * (essentially 'q=id:"foo"'). All other query operations behave
     * as they should around it.
     * 
     * Parameters: 
     *  new_id - string id
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_ids>
     */
    this.set_id = function(new_id){
	anchor.query = 'id:' + bbop.core.ensure(new_id, '"');
	return anchor.query;
    };

    // Function to unwind and lock a list if identifiers onto a field.
    function _lock_map(field, id_list){
	var fixed_list = [];
	bbop.core.each(id_list,
		       function(item){
			   fixed_list.push(bbop.core.ensure(item, '"'));
		       });

	var base_id_list = '(' + fixed_list.join(' OR ') + ')';

	var ret_query = field + ':' + base_id_list;
	return ret_query;
	
    }

    /*
     * Function: set_ids
     *
     * Like <set_id>, a limited setter. It removes whatever else is on
     * query and replaces it with something like:
     * 
     * : gm.set_ids(['GO:1', 'GO:2'])
     * 
     * This is for when you want to lock into a set of documents by id. All
     * other query operations behave as they should around it.
     * 
     * Parameters: 
     *  id_list - a list of ids to search for
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_ids>
     */
    this.set_ids = function(id_list){
	anchor.query = _lock_map('id', id_list);
	return anchor.query;
    };

    /*
     * Function: set_targets
     *
     * Like a more generalized version of <set_ids>, a limited. It
     * removes whatever else is on query and replaces it with
     * something like:
     * 
     * : gm.set_targets(['GO:1', 'GO:2'], ['field_1', 'field_2'])
     * 
     * This is for when you want to lock into a set of documents by
     * locking onto identifiers in some set of search fields. All
     * other query operations behave as they should around it.
     * 
     * Parameters: 
     *  id_list - a list of ids to search for
     *  field_list - a list of fields ids to search across
     *
     * Returns:
     *  the current setting of query ('q')
     * 
     * Also see:
     *  <set_ids>
     */
    this.set_targets = function(id_list, field_list){

	var fixed_list = [];
	bbop.core.each(field_list, function(field){
	    fixed_list.push(_lock_map(field, id_list));
	});

	var sum = fixed_list.join(' OR ');

	anchor.query = sum;
	return anchor.query;
    };

    /*
     * Function: get_query
     *
     * Getter for the query variable ('q').
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of extra
     */
    this.get_query = function(){
	return anchor.query;
    };

    /*
     * Function: get_default_query
     *
     * Getter for what the query variable 'q' will be set to on a
     * <reset_query>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of the default query
     */
    this.get_default_query = function(){
	return anchor.default_query;
    };

    /*
     * Function: get_fundamental_query
     *
     * Getter for what the query variable 'q' will be set to on a
     * <reset_default_query>.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of the fundamental default query
     */
    this.get_fundamental_query = function(){
	return anchor.fundamental_query;
    };

    /*
     * Function: get_query
     *
     * Getter for the query variable ('q').
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of extra
     */
    this.get_query = function(){
	return anchor.query;
    };

    /*
     * Function: reset_query
     *
     * Remove/reset the query variable ('q'); this set it back to the
     * default query.
     *
     * Parameters:
     *  none
     *
     * Returns:
     *  the current value of query
     * 
     * Also see:
     *  <set_default_query>
     *  <reset_default_query>
     */
    this.reset_query = function(){
	anchor.query = anchor.default_query;
	ll('reset query to default: ' + anchor.query);
	return anchor.query;
    };

    /*
     * Function: set_extra
     *
     * Setter for the internal string variable to be appended to the
     * end of a query. For special use cases only (e.g. extend
     * functionality of the API safely).
     * 
     * Parameters: 
     *  new_extra - *[optional]* new value for the extras string
     *
     * Returns:
     *  the current setting of extra
     */
    this.set_extra = function(new_extra){
	anchor.query_extra = new_extra;
	return anchor.query_extra;
    };

    /*
     * Function: get_extra
     *
     * Getter for the internal string variable to be appended
     * to the end of a query.
     *
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  the current setting of extra
     */
    this.get_extra = anchor.set_extra;

    /*
     * Function: remove_extra
     *
     * Remove/reset the extra bit.
     *
     * Parameters:
     *  none
     *
     * Returns:
     *  ""
     */
    this.remove_extra = function(){
	anchor.query_extra = "";
	return anchor.query_extra;
    };

    /*
     * Function: set
     *
     * Set an internal variable for the query. The internal variables
     * are typically things like 'qt', 'indent', etc.--things that you
     * might set and forget a while. It does /not/ include highly
     * dynamic variables (like callback and packet) or querying
     * variables like 'q' and 'fq'; for those you need to use the API.
     *
     * Parameters: 
     *  key - the name of the parameter to change
     *  new_val - what you want the new value to be
     *
     * Returns:
     *  n/a
     */
    this.set = function(key, new_val){
	anchor.query_variants[key] = new_val;
    };

    /*
     * Function: get
     *
     * Get an internal variable for the query.
     *
     * See <set> for the kinds of parameters that can be read.
     * 
     * Parameters: 
     *  key - the name of the parameter to get
     *
     * Returns:
     *  The found value of the key.
     */
    this.get = function(key){
	return anchor.query_variants[key];
    };

    /*
     * Function: unset
     *
     * Unset (remove) an internal variable for the query. Only usable on certain types of 
     * 
     * Only use is you really know what you're doing.
     *
     * Parameters: 
     *  key - the name of the parameter to unset/remove
     *
     * Returns:
     *  boolean; true false on whether the key was found
     */
    this.unset = function(key){
	var retval = false;

	if( bbop.core.is_defined(anchor.query_variants[key]) ){
	    retval = true;
	    delete anchor.query_variants[key];
	}

	return retval;
    };

    /*
     * Function: include_highlighting
     *
     * Turn hilighting on or off (with true or false).
     * 
     * This essentially adds the parameters to the query string to
     * make sure that basic highlighting on the search is returned.
     * 
     * It starts off as false. The optional html_elt_str argument
     * defaults to:
     *  : <em class="hilite">
     *
     * Parameters: 
     *  hilite_p - *[optional]* boolean
     *  html_elt_str - *[serially optional]* the HTML element string to use
     *
     * Returns:
     *  either false or the current string being used for the return element
     */
    this.include_highlighting = function(hilite_p, html_elt_str){
	var retval = false;

	if( bbop.core.is_defined(hilite_p) &&
	    (hilite_p == true || hilite_p == false) ){
	    if( hilite_p == true ){

		// Set the default string if necessary.
		if( ! html_elt_str ){ html_elt_str = '<em class="hilite">'; }

		// Set the parameters.
		anchor.set('hl', 'true');
		anchor.set('hl.simple.pre', html_elt_str);

		// And the retval is not longer false.
		retval = html_elt_str;

	    }else{
		
		// Unset the parameters.
		anchor.unset('hl');
		anchor.unset('hl.simple.pre');
	    }

	}else{
	    // Otherwise, just discover the current state and return
	    // it.
	    var cl_tmp = anchor.get('hl.simple.pre');
	    if( bbop.core.is_defined(cl_tmp) ){
		retval = cl_tmp;
	    }
	}

	return retval;
    };

    /*
     * Function: set_personality
     *
     * While we are always contacting the same Solr instance, we
     * sometimes want to have different weights, facets, etc. This
     * function allows us to use the pre-set ones defined in the
     * constructor configuration argument.
     * 
     * Currently, this only sets the 'facet.field' internal variable.
     *
     * Parameters: 
     *  personality_id - string
     *
     * Returns:
     *  Will return false if personality doesn't exist
     */
    this.set_personality = function(personality_id){
	var retval = false;

	// This sets the facet.field internal variable.
	var cclass = anchor._golr_conf.get_class(personality_id);
	if( cclass ){

	    // Remember what our personality is.
	    // WARNING: this line must go before the query_field_set
	    // line below, or else we won't get the "smart" search.
	    this._current_class = cclass;

	    // Set the facets for our class.
	    anchor.facets(cclass.field_order_by_weight('filter'));

	    // Set the query field weights ('qf') necessary to make
	    // queries run properly.
	    anchor.query_field_set(cclass.get_weights('boost'));
	    
	    // Show that we did indeed set a personality.
	    retval = true;
	}

	return retval;
    };

    /*
     * Function: get_personality
     *
     * Returns the current personality, null if none.
     * 
     * Parameters: 
     *  n/a
     *
     * Returns:
     *  Returns the current personality as a string, null if none is set
     */
    this.get_personality = function(){
	var retval = null;

	if( bbop.core.is_defined(anchor._current_class) &&
	    bbop.core.what_is(anchor._current_class) == 'bbop.golr.conf_class'){
	    retval = anchor._current_class.id();
	}

	return retval;
    };

    /*
     * Function: get_query_url
     *
     * Get the current invariant state of the manager returned as a
     * encoded URL string (using encodeURI()).
     * 
     * This means the URL for the current query to the GOlr store, but
     * without extra information about packets, callbacks, and the
     * like.
     * 
     * This is generally appropriate for getting data, but maybe not
     * for things like high-speed autocomplete where races can
     * occur. For those, you might want to consider <update> or
     * <search>.
     *
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  URL string
     * 
     * Also see:
     *  <update>, <search>
     */
    this.get_query_url = function(){

	// Structure of the necessary invariant parts.	
	var qurl = anchor._solr_url + 'select?';

	// Filters to assemble.
	var assemf = anchor.get_query_filters();
	var fq = anchor.filter_list_to_assemble_hash(assemf);

	// Add all of our different specialized hashes.
	var things_to_add = [
	    //bbop.core.get_assemble(anchor.query_invariants),
	    //bbop.core.get_assemble(anchor.query_facets),
	    bbop.core.get_assemble(anchor.query_variants),
	    bbop.core.get_assemble(anchor.current_facet_field_limits),
	    //bbop.core.get_assemble({'fq': anchor.query_sticky_filters}),
	    bbop.core.get_assemble({'fq': fq}),
	    bbop.core.get_assemble({'facet.field':
				    bbop.core.get_keys(anchor.facet_fields)}),
	    bbop.core.get_assemble({'q': anchor.query}),
	    anchor.query_extra
	];
	// Add query_fields ('qf') iff query ('q') is set and it is
	// not length 0.
	if( anchor.query &&
	    anchor.query.length &&
	    anchor.query.length != 0 &&
	    anchor.query != anchor.fundamental_query ){
		var in_qf =
		    bbop.core.get_assemble({'qf': anchor.query_field_set()});
		things_to_add.push(in_qf);
	    }
	
	// Assemble the assemblies into a single URL, throw out
	// everything that seems like it isn't real to keep the URL as
	// clean a possible.
	var filtered_things = 
	    bbop.core.pare(things_to_add,
			   function(item, index){
			       var retval = true;
			       if( item && item != '' ){
				   retval = false;
			       }
			       return retval;
			   });

	var final_qurl = qurl + filtered_things.join('&');
	final_qurl = anchor._query_encode(final_qurl);
	ll('qurl: ' + final_qurl);
    	return final_qurl;
    };

    /*
     * Function: push_excursion
     *
     * Save the current state of the manager--data and sticky filter
     * information--onto an internal stack. Batch information is not
     * stored.
     * 
     * Useful for gettinginto a state, doing something else, then
     * returning to the original state.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  the number of items on the excursion stack
     * 
     * Also see:
     *  <get_query_url>
     *  <pop_excursion>
     */
    this.push_excursion = function(){
	
	var now = {
	    // Save current state (data).
	    data_url: anchor.get_query_url(),
	    // Save current state (session).
	    session: {
		// Get the sticky filters.
		sticky_filters: anchor.get_sticky_query_filters()
	    }
	};

	// Save.
	anchor._excursions.push(now);

	// ...
    	return anchor._excursions.length;
    };

    /*
     * Function: pop_excursion
     *
     * Return to a previously pushed state. Batch items are not
     * recovered.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  boolean on whether a state was recovered
     * 
     * Also see:
     *  <get_query_url>
     *  <gpush_excursion>
     */
    this.pop_excursion = function(){
	
	var retval = false;

	var then = anchor._excursions.pop();
	if( then ){
	    retval = true;

	    // Recover data state.
	    var then_data_url = then['data_url'];
	    anchor.load_url(then_data_url);

	    // Recover the session state.
	    var then_session_stickies = then['session']['sticky_filters'];
	    // Add the sticky filters.
	    bbop.core.each(then_session_stickies,
			   function(sticky){
			       var flt = sticky['filter'];
			       var fvl = sticky['value'];
			       var fpl = [];
			       if( sticky['negative_p'] == true ){
				   fpl.push('-');
			       }
			       if( sticky['sticky_p'] == true ){
				   fpl.push('*');
			       }
			       anchor.add_query_filter(flt, fvl, fpl);
			   });	    
	}

    	return retval;
    };

    /*
     * Function: get_download_url
     *
     * Get the current invariant state of the manager returned as a
     * URL string.
     * 
     * This differs from <get_query_url> in that the generated string
     * is intended for text-processing uses rather than computerized
     * searching uses. The idea where is to create a TSV file for
     * downloading and consumption.
     * 
     * Instead of downloading all of the results, a limited listed set
     * can be downloaded using entity_list, which identifies documents by id.
     * 
     * The optional argument hash looks like:
     *  rows - the number of rows to return; defaults to: 1000
     *  encapsulator - how to enclose whitespace fields; defaults to: ""
     *  separator - separator between fields; defaults to: "%09" (tab)
     *  header - whether or not to show headers; defaults to: "false"
     *  mv_separator - separator for multi-valued fields; defaults to: "|"
     *  entity_list - list of specific download items in results; default null
     * 
     * With the entity list, keep in mind that null and an empty list
     * are handled in pretty much the same way--they are an indication
     * that we are going after nothing specific, and so all results
     * are game.
     * 
     * Parameters:
     *  field_list - a list of fields to return
     *  in_arg_hash - *[optional]* additional optional arguments
     * 
     * Returns:
     *  URL string
     * 
     * Also see:
     *  <get_query_url>
     */
    this.get_download_url = function(field_list, in_arg_hash){
	
	// Save current state.
	anchor.push_excursion();

	// Deal with getting arguments in properly.
	var default_hash =
	    {
		rows : 1000,
		encapsulator : '',
		separator : "%09",
		header : 'false',
		mv_separator : "|",
		entity_list : []
	    };
	var arg_hash = bbop.core.fold(default_hash, in_arg_hash);

	// Make the changes we want.
	anchor.set('wt', 'csv');
	anchor.set('start', 0);
	anchor.set('fl', field_list.join(','));
	anchor.set('rows', arg_hash['rows']);
	anchor.set('csv.encapsulator', arg_hash['encapsulator']);
	anchor.set('csv.separator', arg_hash['separator']);
	anchor.set('csv.header', arg_hash['header']);
	anchor.set('csv.mv.separator', arg_hash['mv_separator']);

	// A little more tricky, jimmy the entity list into the query
	// if it's viable.
	var entity_list = arg_hash['entity_list'];
	if( bbop.core.is_defined(entity_list) &&
	    bbop.core.is_array(entity_list) &&
	    entity_list.length > 0 ){
		anchor.set_ids(entity_list);
	}

	// Get url.
	var returl = anchor.get_query_url();

	// Reset the old state.
	anchor.pop_excursion();

    	return returl;
    };

    /*
     * Function: get_filter_query_string
     *
     * Get the current state of the manager, as defined by the current
     * gross filter set--query, sticky filters, and standard filters--
     * returned as a URL query string (sans the '?').
     * 
     * This differs from <get_query_url> and <get_state_url> in that
     * the generated string is intended for applications that may want
     * just enough information to recover filter state when the
     * personality, and other types of information, are already
     * known. It is intended to be part of a light RESTy bookmarking
     * mechanism in larger application.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  query string for current filters (sans the '?')
     * 
     * Also see:
     *  <get_query_url>
     *  <get_state_url>
     */
    this.get_filter_query_string = function(){
	
	// // Save current state.
	// anchor.push_excursion();

	var q = anchor.get_query();

	// Get the filters and sort them into sticky and "normal"
	// sets.
	var filters = anchor.get_query_filters();
	var std_filters = [];
	var sticky_filters = [];
	bbop.core.each(filters,
		       function(filter){
			   if( filter['sticky_p'] ){
			       sticky_filters.push(filter);
			   }else{
			       std_filters.push(filter);
			   }
		       });

	var fq = anchor.filter_list_to_assemble_hash(std_filters);
	var sfq = anchor.filter_list_to_assemble_hash(sticky_filters);

	var things_to_add = [];
	if( q ){
	    things_to_add.push(bbop.core.get_assemble({'q': q}));
	}
	if( ! bbop.core.is_empty(fq) ){
	    things_to_add.push(bbop.core.get_assemble({'fq': fq}));
	}
	if( ! bbop.core.is_empty(sfq) ){
	    things_to_add.push(bbop.core.get_assemble({'sfq': sfq}));
	}
	    
	// // Reset the old state.
	// anchor.pop_excursion();

	var final_qstr = things_to_add.join('&');
	final_qstr = anchor._query_encode(final_qstr);
    	return final_qstr;
    };

    /*
     * Function: get_state_url
     *
     * Get the current invariant state of the manager, plus the
     * current personality as a parameter, returned as a URL string.
     * 
     * This differs from <get_query_url> in that the generated string
     * is intended for applications that may want a little more
     * information and hinting over just what the current search
     * is. This method essentially parameterizes some of the "hidden
     * state" of the manager.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  URL string
     * 
     * Also see:
     *  <get_query_url>
     */
    this.get_state_url = function(){
	
	// Save current state.
	anchor.push_excursion();

	// Make the changes we want. First, physically set the
	// "personality", then set pins for jump-in recovery.
	anchor.set('personality', anchor.get_personality());

	// Explicitly set sticky pins for later recovery.
	// Do this pretty much exactly like we do for get_query_url().
	var sticky_filters = anchor.get_sticky_query_filters();
	var sfq = anchor.filter_list_to_assemble_hash(sticky_filters);
	anchor.set('sfq', sfq);
	
	// Get url.
	var returl = anchor.get_query_url();

	// Reset the old state.
	anchor.pop_excursion();

    	return returl;
    };

    /*
     * Function: load_url
     *
     * Makes a a best attempt to recover the state of a manager from
     * the clues left in a data url. This can also (and probably
     * should) be thought of as a "load bookmark"
     * function. Theoretically, you should even be able to use
     * "bookmarks" from alien installations.
     * 
     * Note that while this recovers enough to get the same data,
     * certain "session"/"preference" type things that are not encoded
     * in the url (e.g. filter stickiness, the contents of batch
     * queues, non-default base queries, etc.) will not be replayed
     * and must be recovered or guessed on an app by app basis..
     * 
     * Warning: this currently only replays a small subset of possible
     * parameters. Currently: personality, q, fq, ???. In the future,
     * this should no all non-session information.
     * 
     * Warning: Because there is more to bookmarks than just the major
     * stuff, variants not supplied in the bookmark will be removed.
     * 
     * This returns true if the parameter portions of the new and
     * bookmark urls match. However, this is often not the case--think
     * shifting personalities, etc.
     * 
     * Parameters:
     *  url - A URL string generated by a manager's get_query_url (or similar)
     * 
     * Returns:
     *  boolean
     */
    this.load_url = function(url){

	var loop = bbop.core.each;

	// // Some Regexps that would be nice to just compile once.
	// var regexp_url_space = /\%20/g; // '%20' == ' '
	// var regexp_url_quote = /\%22/g; // '%22' == '"'
	// var regexp_url_left_paren = /\%28/g; // '%28' == '('
	// var regexp_url_right_paren = /\%29/g; // '%29' == ')'

	// We are assuming that we are consuming our own URLs from
	// get_query_url(), so we start by attempting to decode it
	// (TODO: need a tab watch here)?
	var decoded_url = decodeURI(url);

	// Break down url.
	var in_params = bbop.core.url_parameters(decoded_url);

	// First, look for the personality setting and invoke it if
	// it's there--it will dominate unless we take care of it first.
	// Also note the all the keys that we see (for later erasure
	// of excess).
	var seen_params = {};
	loop(in_params,
	     function(ip){
		 var key = ip[0];
		 var val = ip[1];
		 if( key == 'personality' && val && val != '' ){
		     anchor.set_personality(val);
		 }
		 seen_params[key] = true;
	     });
	
	// Now cycle through the the parameters again and invoke the
	// appropriate functions to bring them in line.
	var sticky_cache = {};
	loop(in_params,
	     function(ip){
		 var key = ip[0];
		 var val = ip[1];
		 if( bbop.core.is_defined(val) && val != '' ){
		     if( key == 'personality' ){
			 // Already did it, skip.
		     }else if( key == 'q' ){
			 anchor.set_query(val);
		     }else if( key == 'fq' || key == 'sfq' ){
			 // Split the fq (or sfq) parameter.
			 var fnv = bbop.core.first_split(':', val);
			 var fname = fnv[0];
			 var fval = fnv[1];
			 //ll('HERE: fname: ' + fname);
			 //ll('HERE: fval: ' + fval);
			 if( fname && fval ){

			     var plist = [];

			     // Remove leading sign on a filter and
			     // add it to the plist.
			     var lead_char = fname.charAt(0);
			     if( lead_char == '-' || lead_char == '+' ){
				 plist.push(lead_char);
				 fname = fname.substr(1, fname.length -1);
			     }

			     // // TODO: 
			     // // If the fval looks like it has not been
			     // // decoded (like from a URL-safe
			     // // bookmark), go ahead and do so.
			     // fval = fval.replace(regexp_url_space, ' ');
			     // fval = fval.replace(regexp_url_quote, '"');
			     // fval = fval.replace(regexp_url_left_paren, '(');
			     // fval = fval.replace(regexp_url_right_paren,')');

			     // Do not allow quotes in--they will be
			     // added by the assembler.
			     fval = bbop.core.dequote(fval);

			     // Make it sticky it it came in on "sfq".
			     // Note if this is the sticky form.
			     var skey = fname + '^' + fval;
			     if( key == 'sfq' ){
				 sticky_cache[skey] = true;
				 plist.push('*');
			     }

			     // Add the query filter properly, but
			     // only if we have not already added the
			     // sticky form (prevent clobbering).
			     if( ! bbop.core.is_defined(sticky_cache[skey]) ||
				 key == 'sfq'){
				 anchor.add_query_filter(fname, fval, plist);
				 
			     }
			 }
		     }else if( key == 'qf' ){
			 // qf is handles a little strangely...
			 var foo = bbop.core.first_split('^', val);
			 //ll('qf: key: '+ key +', val: '+ val +', foo: '+ foo);
			 anchor.add_query_field(foo[0], foo[1]);
		     }else if( key == 'facet.field' ){
		      	 anchor.facets(val);
		     }else if( key == 'start' || key == 'rows' ){
			 // Numbers need to be handled carefully.
			 if( bbop.core.what_is(val) == 'string' ){
			     val = parseFloat(val);
			 }
		      	 anchor.set(key, val);
		     }else{
			 // This one catches all of the non-special
			 // parameters and resets them using .set().
			 anchor.set(key, val);
			 // if( key == 'fq' ){
			 //     throw new Error("OI");			     
			 // }
		     }
		 }
	     });

	// Now go through and remove all of the query variant
	// parameters that were not seen in the bookmark.
	loop(anchor.query_variants,
	     function(key, val){
		 if( ! bbop.core.is_defined(seen_params[key]) ){
		     anchor.unset(key);
		 }
	     });

	// Produce our own url from what we've done. If the parameters
	// match with the incoming argument's return true.
	var curr_url = anchor.get_query_url();
	var curr_params = bbop.core.url_parameters(curr_url);
	var differences = 0;
	if( in_params.length == curr_params.length ){
	    loop(in_params,
		 function(in_p, i){
		     var curr_p = curr_params[i];
		     if( in_p.length == curr_p.length ){
			 if( in_p.length == 1 ){
			     if( in_p[0] == curr_p[0] ){
				 // match!
			     }else{
				 differences++;
			     }
			 }else if( in_p.length == 2 ){
			     if( in_p[0] == curr_p[0] && in_p[1] == curr_p[1] ){
				 // match!
			     }else{
				 differences++;
			     }
			 }
		     }else{
			 differences++;
		     }
		 });
	}else{
	    differences++;
	}

	// Tally the differences and decides if they're the same.
	var retval = false;
	if( differences == 0 ){
	    retval = true;
	}
    	return retval;
    };

    /*
     * Function: add_to_batch
     *
     * "Save" the current manager state to run later in serial batch
     * mode.
     * 
     * The actual job of running these batches is left to the
     * implementation of the sub-managers; probably in "run_batch".
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  state url
     */
    this.add_to_batch = function(){
	var qurl = anchor.get_query_url();
	anchor._batch_urls.push(qurl);
    	return qurl;
    };

    /*
     * Function: batch_urls
     *
     * Return a pointer to the current batch urls.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  array
     */
    this.batch_urls = function(){
    	return anchor._batch_urls;
    };

    /*
     * Function: next_batch_url
     *
     * Return the next data to be processed, removing it from the
     * batch queue in the process.
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  state url or null
     */
    this.next_batch_url = function(){
    	return anchor._batch_urls.shift() || null;
    };

    /*
     * Function: reset_batch
     *
     * Clear the currently queued data batch.
     * 
     * The actual job of running these batches is left to the
     * implementation of the sub-managers; probably in "run_batch".
     * 
     * Parameters:
     *  n/a
     * 
     * Returns:
     *  the number of items cleared
     */
    this.reset_batch = function(){
	var num = anchor._batch_urls.length;
	anchor._batch_urls = [];
    	return num;
    };
};
bbop.core.extend(bbop.golr.manager, bbop.registry);

/*
 * Function: to_string
 *
 * Output writer for this object/class.
 * See the documentation in <core.js> on <dump> and <to_string>.
 * 
 * Parameters: 
 *  n/a
 *
 * Returns:
 *  string
 */
bbop.golr.manager.prototype.to_string = function (){
    return '<' + this._is_a + '>';
};

/*
 * Function: update
 *
 * The user code to select the type of update (and thus the type
 * of callbacks to be called on data return).
 * 
 * This mechanism adds a couple of variables over other methods
 * for bookkeeping: packet (incremented every time) and callback_type.
 * 
 * The currently recognized callback types are "reset" (for when you
 * are starting or starting over) and "search" (what you typically
 * want when you get new data) and "error" for when something went
 * wrong. But only "search" and "reset" manipulate the system.
 * 
 * If rows or start are not set, they will both be reset to their
 * initial values--this is to allow for paging on "current"
 * results and then getting back to the business of searching with
 * as little fuss as possible. Because of things like this, one
 * should avoid calling this directly whenever possible and prefer
 * simpler functionality of the wrapper methods: <search>,
 * <reset>, and <page>.
 * 
 * Parameters: 
 *  callback_type - callback type string; 'search', 'reset' and 'error'
 *  rows - *[optional]* integer; the number of rows to return
 *  start - *[serially optional]* integer; the offset of the returned rows
 *
 * Returns:
 *  the query url (with the jQuery callback specific parameters)
 * 
 * Also see:
 *  <get_query_url>
 */
bbop.golr.manager.prototype.update = function(callback_type, rows, start){

    //function ll(s){ this._logger.kvetch(s); }

    // Handle paging in this main section by resetting to
    // the defaults if rows and offset are not explicitly
    // defined.
    if( ! bbop.core.is_defined(rows) || ! bbop.core.is_defined(start) ){
    	this.set('rows', this.current_rows);
    	this.set('start', this.current_start);
    }
    
    // Our bookkeeping--increment packet.
    this.last_sent_packet = this.last_sent_packet + 1;
    
    // Necessary updated query variants.
    var update_query_variants = {
    	packet: this.last_sent_packet,
    	callback_type: callback_type
    };
    var update_qv = bbop.core.get_assemble(update_query_variants);
    
    // Structure of the necessary invariant parts.	
    //var qurl = this.get_query_url();
    var qurl = null;
    
    // Conditional merging of the remaining variant parts.
    if( callback_type == 'reset' ){
	
    	// Take everything back to the initial state--this means
    	// resetting the query and removing all non-sticky
    	// filters.
	
    	// Reset and do completely open query.
    	//ll('reset assembly');
	
    	// Save the q vals, do a fundamental get, then reset to
    	// what we had.
    	//var tmp_save = this.get_query();
    	//this.reset_default_query();
    	this.reset_query();
    	this.reset_query_filters();
    	qurl = this.get_query_url();
    	qurl = qurl + '&' + update_qv;
    	//this.set_query(tmp_save);
	
    }else if( callback_type == 'search' ){
	
    	//ll('search assembly');
    	qurl = this.get_query_url();
    	qurl = qurl + '&' + update_qv;
	
    }else{
    	throw new Error("Unknown callback_type: " + callback_type);
    }
    
    //ll('qurl: ' + qurl);
    return qurl;
};
