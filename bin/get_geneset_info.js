#!/usr/bin/rhino
/* 
 * Package: get_geneset_info.js
 * 
 * This is a Rhino script.
 * 
 * Return the annotations for a given set of genes
 * within certain areas of the ontology
 * 
 * Usage like:
 * : rhino ./get_geneset_info.js -g FMR1 DLG2  ACTR5 CNKSR2 -t GO:0045202 GO:0097458
 *
 * For the 4 gene symbols, it will show all annotations under each of the two terms
 *
 * For now it is hardcoded to human and to use gene symbols, but this should
 * be trivial to change
 *
 * In future this should be turned into something like the matrix view
 */

load('../staging/bbop.js');
load('../_data/golr.js');

// First, collect all of our input.
print('Collecting input.');
var gene_symbols = ['DLG2', 'ACTR5', 'CNKSR2'];
var term_ids = ['GO:0045202', 'GO:0097458'];
var mode = 'g';
bbop.core.each(arguments, function(arg) {
    if (arg == '-g' || arg == '--genes') {
        gene_symbols = [];
        mode = 'g';
    }
    else if (arg == '-t' || arg == '--terms') {
        term_ids = [];
        mode = 't';
    }
    else {
        if (mode == 'g') {
            gene_symbols.push(arg);
        }
        else if (mode == 't') {
            term_ids.push(arg);
        }
    }
});

// TODO - make configurable
var tax_id = "NCBITaxon:9606";

// Next, setup the manager environment.
print('Setting up manager.');
var gconf = new bbop.golr.conf(amigo.data.golr);
var go = new bbop.golr.manager.rhino('http://a2-proxy2.stanford.edu/solr/', gconf);
go.add_query_filter('document_category', 'annotation', ['*']);
go.set_personality('bbop_ann');
go.debug(false); // I think the default is still on?

// Now, cycle though all of the posible pairs of terms while setting
// and unsetting the query filter on the manager. Print the output as
// we progress.
print('Gathering data...');
bbop.core.each(gene_symbols, function(g) {
    bbop.core.each(term_ids, function(t_id) {

        // Set the next query.
        go.reset_query_filters(); // reset from the last iteration

        go.add_query_filter('bioentity_label', g);
        go.add_query_filter('taxon', tax_id);
        go.add_query_filter('isa_partof_closure', t_id);

        //print(go.get_query_url());
        var resp = go.fetch();
        var count = resp.total_documents();
        
        print("SYMBOL: "+g + " TERM:" + t_id + " NUMBER = "+count);
        
        bbop.core.each(resp.documents(), function(d) {
            print("    "+d.annotation_class+" "+d.annotation_class_label);
        });
    });
});

print('Done.');
