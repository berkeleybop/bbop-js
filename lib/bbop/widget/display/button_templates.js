/*
 * Package: button_templates.js
 * 
 * Namespace: bbop.widget.display.button_templates
 * 
 * Template generators for various button "templates" that can be fed
 * into the <search_pane> widget.
 * 
 * These templates foten have functions that manipulate the
 * environment outside, such as window.*, etc. Be aware and look at
 * the code carefully--there is a reason they're in the
 * widgets/display area.
 * 
 * Note: this is a collection of methods, not a constructor/object.
 */

bbop.core.require('bbop', 'core');
//bbop.core.require('bbop', 'logger');
bbop.core.require('bbop', 'html');
bbop.core.namespace('bbop', 'widget', 'display', 'button_templates');

/*
 * Method: field_download
 * 
 * Generate the template for a simple download button.
 * 
 * Arguments:
 *  label - the text to use for the hover
 *  count - the number of items to download
 *  fields - the field to download
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.field_download = function(label,
							       count,
							       fields){
    var dl_props = {
	'entity_list': null,
	'rows': count
    };
    var field_download_button =
	{
	    label: label,
	    diabled_p: false,
	    text_p: false,
	    icon: 'ui-icon-document',
	    click_function_generator: function(manager){
		return function(event){
		    dl_props['entity_list'] = manager.get_selected_items();
		    var raw_gdl = manager.get_download_url(fields, dl_props);
		    window.open(raw_gdl, '_blank');
		};
	    }
	};
    return field_download_button;
};

/*
 * Method: bookmark
 * 
 * Generate the template for a simple bookmark button with pop-up.
 * 
 * Arguments:
 *  linker - the linker to be used for this bookmarking
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.bookmark = function(linker){
    
    var bookmark_button =
	{
	    label: 'Show URL/bookmark',
	    diabled_p: false,
	    text_p: false,
	    icon: 'ui-icon-link',
	    click_function_generator: function(manager){
		return function(event){
		    //alert('GAF download: ' + manager.get_query_url());
		    //alert('URL: ' + manager.get_query_url());
		    var raw_bookmark = manager.get_state_url();
		    var a_args = {
			// Since we're using the whole URI as a
			// parameter, we use the heavy hitter on top
			// of the already encoded URI.
			id: encodeURIComponent(raw_bookmark),
			label: 'this search'
		    };
		    new bbop.widget.dialog('<p>Bookmark for: ' + linker.anchor(a_args, 'search') + '</p><p>Please be aware that this bookmark does not save properties like currently selected items.</p>');
		};
	    }
	};
    return bookmark_button;
};

/*
 * Method: send_fields_to_galaxy
 * 
 * Generate the template for a button that sends fields to a Galaxy
 * instance.
 * 
 * Arguments:
 *  label - the text to use for the hover
 *  count - the number of items to download
 *  fields - the field to download
 *  galaxy - the url to the galaxy instance we're sending to
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.send_fields_to_galaxy = function(label,
								      count,
								      fields,
								      galaxy){
    var dl_props = {
	'entity_list': null,
	'rows': count
    };
    var galaxy_button =
	{
	    label: label,
	    diabled_p: false,
	    text_p: false,
	    icon: 'ui-icon-mail-closed',
	    click_function_generator: function(manager){
		return function(event){
		    
		    // If we have something, construct a form
		    if( ! galaxy || galaxy == "" ){
			alert('Sorry: could not find a usable Galaxy.');
		    }else{
			// We have a galaxy, so let's try and kick out
			// to it. Cribbing form POST from Gannet.
			var bval = '1 field';
			if( fields && fields.length > 1 ){
			    bval = fields.length + ' fields';
			}
			var input_su =
			    new bbop.html.input({name: 'submit',
						 type: 'submit',
						 value: bval});
			var input_um =
			    new bbop.html.input({name: 'URL_method',
						 type: 'hidden',
						 value: 'get'});

			// See GAF download button for more info.
			dl_props['entity_list'] = manager.get_selected_items();
			var raw_gdl =
			    manager.get_download_url(fields, dl_props);
			var input_url =
			    new bbop.html.input({name: 'URL',
						 type: 'hidden',
						 value: raw_gdl});

			var form =
			    new bbop.html.tag('form',
					      {
						  id: 'galaxyform',
						  name: 'galaxyform',
						  method: 'POST',
						  target: '_blank',
						  action: galaxy
					      },
					      [input_su, input_um, input_url]
					     );
			
			// Finally, bang out what we've constructed in
			// a form.
			new bbop.widget.dialog('Export to Galaxy: ' +
					       form.to_string());
		    }
		};
	    }
	};

  return galaxy_button;
};

/*
 * Method: open_facet_matrix
 * 
 * Generate the template for a button that sends the user to the
 * facet_matrix page with the current manager state and two facets.
 * 
 * TODO: The facet_matrix link should be handled by the linker, not
 * manually using the app_base info.
 * 
 * Arguments:
 *  gconf - a copy of the <golr_conf> for the currrent setup
 *  instance_data - a copy of an amigo.data.server() for app_base info
 * 
 * Returns:
 *  hash form of jQuery button template for consumption by <search_pane>.
 */
bbop.widget.display.button_templates.open_facet_matrix = function(gconf,
								  instance_data){

    // Aliases.
    var loop = bbop.core.each;

    var facet_matrix_button =
	{
	    label: 'Use a matrix to compare document counts for two facets (limit 50 on each axis).',
	    diabled_p: false,
	    text_p: false,
	    //icon: 'ui-icon-caret-2-e-w',
	    icon: 'ui-icon-calculator',
	    click_function_generator: function(manager){
		return function(event){
		    
		    // 
		    var pers = manager.get_personality();
		    var class_conf = gconf.get_class(pers);
		    if( class_conf ){
			
			var filter_list = 
			    class_conf.field_order_by_weight('filter');

			// Get a list of all the facets that we can
			// compare.
			var facet_list_1 = [];
			loop(filter_list,
			     function(filter_id, findex){
				 var cf = class_conf.get_field(filter_id);
				 var cname = cf.display_name();
				 var cid = cf.id();
				 var pset = [cname, cid];

				 // Make sure the first one is
				 // checked.
				 if( findex == 0 ){ pset.push(true); }

				 facet_list_1.push(pset);
			     });
			// We need two though.
			var facet_list_2 = bbop.core.clone(facet_list_1);

			// Stub sender.
			var lss_args = {
			    title: 'Select facets to compare',
			    blurb: 'This dialog will launch you into a tool in another window where you can examine the document counts for two selected facets in a matrix (grid) view.',
			    list_of_lists: [facet_list_1, facet_list_2],
			    title_list: ['Facet 1', 'Facet 2'],
			    action: function(selected_args){
				var f1 = selected_args[0] || '';
				var f2 = selected_args[1] || '';
				var jmp_state = manager.get_state_url();
				var mngr = encodeURIComponent(jmp_state);
				var jump_url = instance_data.app_base() +
				    '/facet_matrix?'+
				    [
					'facet1=' + f1,
					'facet2=' + f2,
					'manager=' + mngr
				    ].join('&');
				window.open(jump_url, '_blank');
			    }};
			new bbop.widget.list_select_shield(lss_args);
		    }
		};
	    }
	};
    return facet_matrix_button;
};
