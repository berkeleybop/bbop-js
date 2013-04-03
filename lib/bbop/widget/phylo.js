bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'widget', 'phylo_tree');
bbop.core.namespace('bbop', 'widget', 'phylo');

(function() {

bbop.widget.phylo.renderer = renderer;

function renderer(parent, golr_loc, golr_conf, config) {
    this.parent = parent;

    var default_config = {
        // these are in pixels
        // row vertical height, including padding and borders
        row_height: 16,
        // vertical space between the contents of adjacent rows
        row_spacing: 2,
        font: "Helvetica, Arial, sans-serif",
    };

    this.config = ("object" == typeof config
                   ? bbop.core.merge(default_config, config)
                   : default_config);
    var self = this;

    function searchCallback(response) {
        // make sure we don't show the phylo tree before the doc is ready
        jQuery(document).ready(function() {
            self.show_pgraph(JSON.parse(response.documents()[0].phylo_graph));
        });
    }

    this.go = new bbop.golr.manager.jquery(golr_loc, golr_conf);
    this.go.register('search', 's', searchCallback);
    // all bioentities in a family
    this.go.set_personality('bbop_bio');
    this.go.add_query_filter('document_category', 'bioentity', ['*']);
}

renderer.prototype.show_family = function(family_id) {
    this.go.set_query("panther_family:" + family_id);
    this.go.search();
};

renderer.prototype.show_pgraph = function(pgraph) {
    this.parent = ( ( "string" == typeof this.parent )
		    ? document.getElementById(this.parent)
		    : this.parent );
    jQuery(this.parent).empty();
    
    var tree_renderer = new bbop.widget.phylo_tree.renderer(this.parent, {
        box_height: this.config.row_height,
        box_spacing: this.config.row_spacing,
        leaf_font: this.config.font,
        leaf_border: 0,
        leaf_padding: 3,
        node_size: 8
    });

    tree_renderer.leaf_style.background = "none";

    var nodes = pgraph.nodes;
    var edges = pgraph.edges;
    //console.log(nodes.length + " nodes");
    //console.log(edges.length + " edges");

    for (var i = 0; i < nodes.length; i++) {
        tree_renderer.add_node(nodes[i].id,
                               nodes[i].lbl,
                               nodes[i].meta);
    }
    for (var i = 0; i < edges.length; i++) {
        tree_renderer.add_edge(edges[i].sub,
                               edges[i].obj,
                               parseFloat(edges[i].meta.distance));
    }
    
    tree_renderer.sort_tree(function(a, b) {
        return parseInt(a.meta.layout_index) - parseInt(b.meta.layout_index);
    });
    tree_renderer.display();

    tree_renderer.iterate(function(id, label, meta, dom_elem, children) {
        if ("true" == meta.speciation_p) {
            dom_elem.style.borderRadius = "6px";
        } else if ("true" == meta.duplication_p) {
            var has_children = children.length > 0;
            if (has_children) {
                dom_elem.style.backgroundColor = "black";
            }
        }
    });
    
    var node_colors = {};
    var cur_color = 1;
    var self = this;
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
    tree_renderer.iterate(function(id, label, meta, dom_elem, children) {
        var is_leaf = 0 == children.length;
        if (is_leaf) {
            dom_elem.style.backgroundColor = color_list[node_colors[id] % color_list.length];
        }
    });

    this.tree_renderer = tree_renderer;
};

})();
