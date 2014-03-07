if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.phylo == "undefined" ){ bbop.widget.phylo = {}; }

(function() {

bbop.widget.phylo.renderer = renderer;

function renderer(parent, golr_loc, golr_conf, config) {
    this.parent = parent;

    var default_config = {
        // these are in pixels
        // row vertical height, including padding and borders
        row_height: 18,
        // vertical space between the contents of adjacent rows
        row_spacing: 2,
        font: "Helvetica, Arial, sans-serif",
        mat_cell_width: 15,
        transition_time: "0.8s"
    };

    this.config = ("object" == typeof config
                   ? bbop.core.merge(default_config, config)
                   : default_config);

    this.phylo_facet_list = [
        "panther_family_label",
        "phylo_graph_json",
        "score"
    ].join(",");
    this.ann_facet_list = [
        "id",
        "bioentity",
        "bioentity_label",
        "taxon_label",
        "bioentity_name",
        "annotation_class_list_map",
        "score"
    ].join(",");

    var golr = new bbop.golr.manager.jquery(golr_loc, golr_conf);
    golr.set_personality('bbop_bio');
    golr.add_query_filter('document_category', 'bioentity', ['*']);
    this.golr = golr;
}

renderer.prototype.show_family = function(family_id) {
    var self = this;
    var pgraph;

    function phyloCallback(response) {
        // make sure we don't show the phylo tree before the doc is ready
        jQuery(document).ready(function() {
            if (response.documents().length > 0) {
                var pgraph_json = response.documents()[0].phylo_graph_json;
                pgraph = (JSON.parse(pgraph_json));

                self.golr.register('search', 's', annCallback);
                self.golr.set_query("panther_family:" + family_id);
                self.golr.current_fl = self.ann_facet_list;
                self.golr.set("fl", self.ann_facet_list);
                self.golr.page(response.total_documents(), 0);
            } else {
                console.log("no documents received");
            }
        });
    }

    function annCallback(response) {
        if (response.documents().length > 0) {
            self.bioentity_map = 
                self.match_pnodes(pgraph.nodes, response.documents());
            self.show_pgraph(pgraph);
        } else {
            console.log("no documents received");
        }
    }
        
    this.golr.register('search', 's', phyloCallback);
    this.golr.set_query("panther_family:" + family_id);
    this.golr.current_fl = this.phylo_facet_list;
    this.golr.set("fl", this.phylo_facet_list);
    this.golr.page(1, 0);
};

renderer.prototype.match_pnodes = function(pnodes, bioentities) {
    var bioent_id_map = {};
    var bioents_by_pthr_id = {};
    var bioents_matched = 0;

    for (var b = 0; b < bioentities.length; b++) {
        bioent_id_map[bioentities[b].id] = bioentities[b];
    }

    for (var n = 0; n < pnodes.length; n++) {
        if ("annotations" in pnodes[n].meta) {
            var pgraph_bioent_ids = pnodes[n].meta.annotations.split("|");
            for (var pbi = 0; pbi < pgraph_bioent_ids.length; pbi++) {
                if (pgraph_bioent_ids[pbi] in bioent_id_map) {
                    bioents_by_pthr_id[pnodes[n].id] =
                        bioent_id_map[pgraph_bioent_ids[pbi]];
                    bioents_matched++;
                    //console.log("found bioentity for " + pnodes[n].id + " (" + pgraph_bioent_ids[pbi] + ")");

                }
            }
            if (! (pnodes[n].id in bioents_by_pthr_id)) {
                //console.log("no bioentity for " + pnodes[n].id + " (" + pgraph_bioent_ids.join(",") + ")");
            }
        } else {
            // this is typically the case for internal nodes
            //console.log("no non-panther IDs for " + pnodes[n].id);
        }
    }
    //console.log(pnodes.length + " phylo nodes");
    //console.log(bioentities.length + " bioentities");
    
    //console.log(bioents_matched + " matched");
    return bioents_by_pthr_id;
};

renderer.prototype.show_pgraph = function(pgraph) {
    var self = this;
    this.parent = ( ( "string" == typeof this.parent )
		    ? document.getElementById(this.parent)
		    : this.parent );

    jQuery(this.parent).empty();

    var parentPos = getStyle(this.parent, "position");
    if (! (("absolute" == parentPos) || ("relative" == parentPos))) {
        this.parent.style.position = "relative";
    }

    this.tree_container = document.createElement("div");
    this.tree_container.style.cssText = "position: absolute; top: 0px; bottom: 100%; left: 0px;";
    
    this.mat_container = document.createElement("div");
    this.mat_container.style.cssText = "position: absolute; top: 0px; bottom: 100%;";

    var all_go_terms = {};
    var go_term_list = [];
    var node_go_annots = {};
    for (var nid in this.bioentity_map) {
        var bioent = this.bioentity_map[nid];
        var annots = JSON.parse(bioent.annotation_class_list_map);
        node_go_annots[nid] = annots;
        for (var goterm in annots) {
            var term_desc = all_go_terms[goterm];
            if (term_desc === undefined) {
                term_desc = {
                    count: 0,
                    id: goterm,
                    name: annots[goterm]
                };
                all_go_terms[goterm] = term_desc;
                go_term_list.push(term_desc);
            }
            term_desc.count += 1;
        }            
    }

    go_term_list.sort( function(a, b) { return b.count - a.count; } );
    var coldescs = go_term_list.map( function(x) { return x.id; } );
    //console.log(coldescs);

    var mat_width = coldescs.length * this.config.mat_cell_width;
    var tree_width = 500;
    this.tree_container.style.width = tree_width + "px";
    this.mat_container.style.width = mat_width + "px";
    this.mat_container.style.left = tree_width + "px";
    //this.parent.style.width = (tree_width + mat_width) + "px";

    this.parent.appendChild(this.tree_container);
    this.parent.appendChild(this.mat_container);
    var tree_renderer = new bbop.widget.phylo_tree.renderer(this.tree_container, {
        box_height: this.config.row_height,
        box_spacing: this.config.row_spacing,
        leaf_font: this.config.font,
        leaf_border: 0,
        leaf_padding: 3,
        node_size: 8,
        transition_time: this.config.transition_time
    });
    tree_renderer.leaf_style.background = "none";
    tree_renderer.leaf_style.cursor = "pointer";
    tree_renderer.node_style.cursor = "pointer";

    var nodes = pgraph.nodes;
    var edges = pgraph.edges;
    //console.log(nodes.length + " nodes");
    //console.log(edges.length + " edges");
    function node_label(node) {
        var bioe =
            node.id in self.bioentity_map ?
            self.bioentity_map[node.id] :
            null;

        var label = node.lbl;
        // abbreviate genus
        if (bioe) {
            var taxon_words = [];
            if (bioe.taxon_label) taxon_words = bioe.taxon_label.split(/\s+/);
            // sometimes there are more than two taxon words (strain name?)
            // but taxon_words[0] appears to be the genus name
            if (taxon_words.length >= 2) {
                taxon_words[0] = taxon_words[0].substr(0, 1) + ".";
            }
            label = taxon_words.join(" ") + ":" + bioe.bioentity_label;
        }
        return label
    }
        

    for (var i = 0; i < nodes.length; i++) {
        tree_renderer.add_node(nodes[i].id,
                               node_label(nodes[i]),
                               nodes[i].meta);
    }

    for (var i = 0; i < edges.length; i++) {
        tree_renderer.add_edge(edges[i].sub,
                               edges[i].obj,
                               parseFloat(edges[i].meta.distance));
    }
    
    tree_renderer.set_sort(function(a, b) {
        return parseInt(a.meta.layout_index) - parseInt(b.meta.layout_index);
    });

    tree_renderer.node_clicked = function(node, node_elem) {
        self.show_node_menu(node, node_elem);
    };

    var node_colors = {};
    var cur_color = 1;
    tree_renderer.traverse(
        function(node, down_data) {
            if (node.id in node_colors) {
                down_data = node_colors[node.id]
            }
            if ("true" == node.meta.duplication_p) {
                var have_grandchildren = false;
                var nearest_child_dist = Infinity;
                var nearest_child;
                for (var i = 0; i < node.children.length; i++) {
                    if (node.children[i].parent_distance < nearest_child_dist) {
                        nearest_child = node.children[i];
                        nearest_child_dist = nearest_child.parent_distance;
                    }
                    have_grandchildren =
                        have_grandchildren
                        || (! node.children[i].is_leaf() );
                }
                if (have_grandchildren) {
                    // under duplication nodes, we give new colors to
                    // all children other than the nearest
                    for (var i = 0; i < node.children.length; i++) {
                        if (node.children[i] === nearest_child) {
                            node_colors[node.children[i].id] = down_data;
                        } else {
                            node_colors[node.children[i].id] = cur_color++;
                        }
                    }
                }
            }
            if (! (node.id in node_colors)) {
                node_colors[node.id] = down_data;
            }
            return node_colors[node.id];
        },
        0,
        function() {}
    );
    this.node_colors = node_colors;

    this.tree_renderer = tree_renderer;
    this.render_tree();

    var node_id_list = tree_renderer.leaves().map(function(x) { return x.id });
    var node_id_map = {};
    for (var i = 0; i < nodes.length; i++) {
        node_id_map[nodes[i].id] = nodes[i];
    }

    function cell_renderer(cell, row, col) {
        var node_go = node_go_annots[row];
        if ((node_go !== undefined) && (col in node_go)) {
            var cell = document.createElement("div");
            cell.style.backgroundColor = "#555";
            cell.title =
                node_label(node_id_map[row]) + " - " + all_go_terms[col].name;
            return cell;
        }
        return null;
    }
    
    var mat_config = {
        cell_width: this.config.mat_cell_width,
        cell_height: this.config.row_height + 2,
        header_height: 0,
        show_headers: false,
        transition_time: this.config.transition_time
    };
    var mat_renderer =
        new bbop.widget.matrix.renderer(this.mat_container, node_id_list,
                                        coldescs, cell_renderer, mat_config);

    var leaf_id_list = tree_renderer.leaves().map(
        function(x) { return x.id }
    );
    mat_renderer.show_rows(leaf_id_list);
    this.parent.style.transition =
        "height " + this.config.transition_time + " ease-in-out";
    this.update_heights();
    
    this.mat_renderer = mat_renderer;
};

renderer.prototype.toggle_subtree_shown = function(node_id) {
    if (this.tree_renderer.subtree_hidden(node_id)) {
        this.tree_renderer.show_subtree(node_id);
    } else {
        this.tree_renderer.hide_subtree(node_id);
    }
    this.show_mat_rows_for_tree_leaves();
};

renderer.prototype.show_global_root = function(node_id) {
    this.tree_renderer.show_global_root();
    this.show_mat_rows_for_tree_leaves();
};

renderer.prototype.show_only_subtree = function(node_id) {
    this.tree_renderer.show_only_subtree(node_id);
    this.show_mat_rows_for_tree_leaves();
};

renderer.prototype.show_mat_rows_for_tree_leaves = function() {
    var leaf_id_list = jQuery.map( this.tree_renderer.leaves(),
                                   function(x) { return x.id; } );
    this.mat_renderer.show_rows(leaf_id_list);
    this.update_heights();
};

renderer.prototype.update_heights = function() {
    this.parent.style.height = this.tree_renderer.tree_height + "px";
};

renderer.prototype.show_node_menu = function(node, node_elem) {
    var buttons = [];
    var jqElem = jQuery(node_elem);
    var self = this;

    var podata = jqElem.data("bs.popover");
    if (podata) {
        jqElem.popover("destroy");
        return;
    }

    jqElem.popover({
        html: true,
        placement: "auto top",
        container: "body",
        title: node.label
    });
    var podata = jqElem.data("bs.popover");

    if (! node.is_leaf()) {
        podata.tip().append("&nbsp;");

        var hideButton = jQuery("<button type='button' class='btn btn-primary btn-xs'></button>");
        hideButton.click(function() {
            jqElem.popover("destroy");
            self.toggle_subtree_shown(node.id);
        });

        hideButton.text( self.tree_renderer.subtree_hidden(node.id)
                         ? "Show subtree" : "Hide subtree" );
        podata.tip().append(hideButton);
    }

    podata.tip().append("&nbsp;");
    var rootButton = jQuery("<button type='button' class='btn btn-primary btn-xs'></button>");
    rootButton.click(function() {
        jqElem.popover("destroy");
        if (self.tree_renderer.only_subtree_shown(node.id)) {
            self.show_global_root();
        } else {
            self.show_only_subtree(node.id);
        }
    });
    rootButton.text( self.tree_renderer.only_subtree_shown(node.id)
                     ? "Show global root" : "Show only subtree" );
    podata.tip().append(rootButton);
    podata.tip().append("&nbsp;");

    jqElem.popover("show");
};

renderer.prototype.render_tree = function() {
    this.tree_renderer.display();

    this.tree_renderer.iterate_preorder(
        function(id, label, meta, dom_elem, children) {
            if ("true" == meta.speciation_p) {
                dom_elem.style.borderRadius = "6px";
            } else if ("true" == meta.duplication_p) {
                var has_children = children.length > 0;
                if (has_children) {
                    dom_elem.style.backgroundColor = "black";
                }
            }
        }
    );

    var color_list = [
        "white",
        "rgb(238, 232, 170)",
        "rgb(255, 182, 193)",
        "rgb(135, 206, 250)",
        "rgb(240, 128, 128)",
        "rgb(152, 251, 152)",
        "rgb(216, 191, 216)",
        "rgb(240, 230, 140)",
        "rgb(224, 255, 255)",
        "rgb(255, 218, 185)",
        "rgb(211, 211, 211)",
        "rgb(255, 250, 205)",
        "rgb(176, 196, 222)",
        "rgb(255, 228, 173)",
        "rgb(175, 238, 238)",
        "rgb(244, 164, 96)",
        "rgb(127, 255, 212)",
        "rgb(245, 222, 179)",
        "rgb(255, 160, 122)",
        "rgb(221, 160, 221)"
    ];
    var self = this;
    this.tree_renderer.iterate_preorder(
        function(id, label, meta, dom_elem, children) {
            var is_leaf = 0 == children.length;
            if (is_leaf) {
                dom_elem.style.backgroundColor =
                    color_list[self.node_colors[id] % color_list.length];
                if (id in self.bioentity_map) {
                    dom_elem.style.color = "black";
                } else {
                    dom_elem.style.color = "#aaa";
                }
            }
        }
    );
};

function getStyle(el, styleProp) {
    if (el.currentStyle) {
        var y = el.currentStyle[styleProp];
    } else if (window.getComputedStyle) {
        var y = window.getComputedStyle(el,null).getPropertyValue(styleProp);
    }
    return y;
}

})();
