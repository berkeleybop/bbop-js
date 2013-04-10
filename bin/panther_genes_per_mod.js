#!/usr/bin/rhino
/* 
 * Package: panther_genes_per_mod.js
 * 
 * This is a Rhino script.
 * 
 * For every PANTHER family, return the number of genes per reference
 * genome mod.
 * 
 * Usage like:
 * : panther_genes_per_mod.js
 */

// // Load the necessary remote files.
// print('Downloading libraries...');
// eval(readUrl('http://cdn.berkeleybop.org/jsapi/bbop_0.9.min.js'));
// eval(readUrl('http://cdn.berkeleybop.org/jsapi/amigo_0.9.min.js'));
load('../staging/bbop.js');
load('../_data/golr.js');

// Aliases.
var each = bbop.core.each;

// Next, setup the manager environment.
//print('Setting up manager...');
var gconf = new bbop.golr.conf(amigo.data.golr);
var go = new bbop.golr.manager.rhino('http://golr.berkeleybop.org/', gconf);
go.add_query_filter('document_category', 'bioentity', ['*']);
go.set_personality('bbop_bio');
go.lite(true); // too much and rhino barfs
go.debug(false); // I think the default is still on?

// First, retrieve /all/ of the PANTHER families.
// go.set_facet_limit('panther_family_label', -1);
// var setup_resp = go.fetch();
// go.reset_facet_limit();
// var panther_families = setup_resp.facet_field('panther_family_label');
// var refgen_taxa = [
//     'NCBITaxon:9606',
//     'NCBITaxon:10090',
//     'NCBITaxon:10116',
//     'NCBITaxon:9031',
//     'NCBITaxon:7955',
//     'NCBITaxon:7227',
//     'NCBITaxon:6239',
//     'NCBITaxon:44689',
//     'NCBITaxon:3702',
//     'NCBITaxon:4932',
//     'NCBITaxon:4896',
//     'NCBITaxon:83333'
// ];
var refgen_taxa = [
    'Arabidopsis thaliana',
    'Caenorhabditis elegans',
    'Danio rerio',
    'Dictyostelium discoideum',
    'Drosophila melanogaster',
    'Escherichia coli',
    'Gallus gallus',
    'Homo sapiens',
    'Mus musculus',
    'Rattus norvegicus',
    'Saccharomyces cerevisiae',
    'Schizosaccharomyces pombe'
];

// Okay, data gets.
each(refgen_taxa,
     function(taxon){

	 // Reset filters.
	 go.reset_query_filters();		  

	 // New taxon.
	 go.add_query_filter('taxon_label', taxon);
	 
	 // Make sure our desired facet is unlimited.
	 go.set_facet_limit('panther_family_label', -1);
	 go.set('f.panther_family_label.facet.mincount', 0);
	 //print("run: [" + go.get_query_url() + "]");
	 var resp = go.fetch();
	 go.reset_facet_limit();

	 // Print out our response.
	 var panther_families = resp.facet_field('panther_family_label');
	 each(panther_families,
	      function(family_count_set){
		  var family = family_count_set[0]; // get family part
		  var cnt = family_count_set[1]; // get count part

		  print([family, taxon, cnt].join("\t"));
	      });
     });

//print('Done.');
