bbop.core.require('bbop', 'core');
bbop.core.namespace('bbop', 'render', 'phylo');

(function() {

bbop.render.phylo.divrenderer = divrenderer;

// will decide later whether to throw away, export, or move this
bbop.render.phylo.tree = tree;

// see default_config for a description of possible config settings
function divrenderer(element_id, config){
    var elt_id = element_id;
    this.parentElem = document.getElementById(elt_id);
    this.tree = new tree();

    var default_config = {
        // these are in pixels
        // vertical space between leaf boxes
        box_spacing: 10,
        // space between leaf box edge and leaf label
        leaf_padding: 4,
        // leaf border thickness
        leaf_border: 2,
        // width/height of internal nodes
        node_size: 8,

        // leaf border color
        leaf_border_color: "blue",
        // font for leaf labels
        leaf_font: "16px Helvetica, Arial, sans-serif"
    };

    this.config = ("object" == typeof config
                   ? bbop.core.merge(default_config, config)
                   : default_config);

    this.node_style = {
        position: "absolute",
        background: "white",
        "z-index": 2,
        width: this.config.node_size + "px",
        height: this.config.node_size + "px",
        "margin-top": (-this.config.node_size / 2) + "px",
        "margin-left": (-this.config.node_size / 2) + "px",
        border: "1px solid black"
    };

    this.leaf_style = {
        position: "absolute",
        background: "#f1f1ff",
        "z-index": 1,
        padding: this.config.leaf_padding + "px",
        font: this.config.leaf_font,
        "border-radius": (this.config.leaf_padding + 1) + "px"
    };

    if( this.config.leaf_border > 0 ){
        this.leaf_style.border =
            this.config.leaf_border + "px solid "
            + this.config.leaf_border_color;
    }

    this.connection_style = {
        position: "absolute",
        "border-left": "2px solid black",
        "border-top": "2px solid black",
        "border-bottom": "2px solid black",
        "border-right": "none"
    };
};

divrenderer.prototype.add_node = function(unique_id){
    this.tree.add_node(unique_id, unique_id);
};

divrenderer.prototype.add_edge = function(nid1, nid2, dist){
    this.tree.add_edge(nid1, nid2, dist);
};

divrenderer.prototype.display = function () {
    this._count_leaves();
    this.ladderize_up();

    var layout = this.tree.layout();

    if( this.container ) this.parentElem.removeChild(this.container);

    this.container = document.createElement("div");
    this.container.style.cssText = [
        "position: absolute",
        "top: 0px",
        "margin: 0px",
        "padding: 0px"
    ].join(";") + ";";

    // x_scale will be percentage units
    var x_scale = 100 / this.tree.max_distance();

    this._measure_box_height();
    // row_height is in pixel units
    this.row_height = this.config.box_height + this.config.box_spacing;

    // the position values from the tree layout are center
    // positions, and the very top one has a y-position of 0.
    // if a leaf node box is centered at that point, then the
    // top half of the top box would get cut off.  So we move
    // all of the positions down by top_margin pixels.
    var top_margin = ( (this.config.box_height / 2)
                       + (this.config.box_spacing / 2) );

    // Add phynodes and create lookup (hash) for use with connections.
    var phynodes = new Array();
    var phynode_hash = {};
    var leaves = new Array();

    var node_style = css_string(this.node_style);
    var leaf_style = css_string(this.leaf_style);

    for( var nidi = 0; nidi < layout.length; nidi++ ){
	// Calculate position.
	var node_pos = layout[nidi];
	var lpx = (node_pos.x * x_scale);
	var lpy = (node_pos.y * this.row_height) + top_margin;
        var is_leaf = this.tree.nodes[node_pos.id].is_leaf();

	// Create node at place. 
        var phynode = new graph_pnode(node_pos.id, lpx, lpy,
                                      node_style, leaf_style,
                                      this.config.box_height,
                                      is_leaf);
        this.container.appendChild(phynode.node_elem);

	if( is_leaf ) leaves.push(phynode);
        phynodes.push(phynode);
	phynode_hash[node_pos.id] = phynode;
    }

    var conn_style = css_string(this.connection_style);
    var container = this.container;
    this.tree.iterate_edges(function(parent, child) {
        var child_phynode = phynode_hash[child.id];
        child_phynode.set_parent(
            phynode_hash[parent.id],
            conn_style
        );
        container.appendChild(child_phynode.conn_elem);
    });

    this.tree_height = (leaves.length * this.row_height);

    this.parentElem.style.height = this.tree_height + "px;";
    this.container.style.left = (this.config.node_size / 2) + "px";
    this.container.style.height = this.tree_height + "px";
    this.parentElem.appendChild(this.container);

    // We wait until here to get the leaf box widths.
    // We don't want to do that while we're creating
    // the leaf DOM nodes because that would trigger
    // more browser layouts.
    this.max_leaf_width = 0;
    for( var li = 0; li < leaves.length; li++ ){
        this.max_leaf_width = Math.max(
            leaves[li].node_elem.offsetWidth,
            this.max_leaf_width
        );
    }
    this.width_changed();
};

// call this when the width of the tree's parent element changes
divrenderer.prototype.width_changed = function() {
    this.container.style.width =
        ( this.parentElem.offsetWidth
          - this.max_leaf_width
          - (this.config.node_size / 2) ) + "px";
};

divrenderer.prototype._count_leaves = function() {
    var leaf_counts = {};
    this.tree.traverse(
        function() {}, null,
        function(node, child_results, down_data) {
            // if this is a leaf, call the leaf count 1
            var leaf_count = node.is_leaf() ? 1 : sum(child_results);
            leaf_counts[node.id] = leaf_count;
            return leaf_count;
        }
    );
    this.leaf_counts = leaf_counts;
};

divrenderer.prototype.ladderize_up = function() {
    var self = this;
    this.tree.sort_children(function(a, b) {
        return self.leaf_counts[b.id] - self.leaf_counts[a.id];
    });
};

divrenderer.prototype.ladderize_down = function() {
    var self = this;
    this.tree.sort_children(function(a, b) {
        return self.leaf_counts[a.id] - self.leaf_counts[b.id];
    });
};

divrenderer.prototype.sort_alpha = function() {
    this.tree.sort_children(function(a, b) {
        if( a.id == b.id ) return 0;
        return (a.id < b.id) ? -1 : 1;
    });
};

// we let the leaf style (font size, padding, border, etc.) determine the
// leaf box height, so here we'll measure the height of a leaf box with
// the current leaf style
divrenderer.prototype._measure_box_height = function() {
    var leaf_style = css_string(this.leaf_style);

    var fake_phynode = new graph_pnode("foo", 0, 0,
                                       "", leaf_style,
                                       0,
                                       true);
    this.parentElem.appendChild(fake_phynode.node_elem);
    this.config.box_height = fake_phynode.node_elem.offsetHeight;
    this.parentElem.removeChild(fake_phynode.node_elem);
};

///
/// graphical representation of a phylo node
///

function graph_pnode(label, px, py, 
                     node_style, leaf_style,
                     height, is_leaf){
    this.label = label;
    this.px = px;
    this.py = py;
    this.height = height;
    this.is_leaf = is_leaf;

    var node_elem = document.createElement("div");
    if( is_leaf ){
        node_elem.appendChild(document.createTextNode(label));
        node_elem.style.cssText =
            leaf_style + ";"
            + "left: " + px + "%;"
            // move the top coord of the box up by height/2;
            // this vertically centers the box on the given
            // (px, py) position
            + "top: " + (py - (height / 2)) + "px;";
    }else{
        node_elem.title = label;
        node_elem.style.cssText =
            node_style + ";"
            + "left: " + px + "%;"
            + "top: " + py + "px;";
    }

    this.node_elem = node_elem;
};

graph_pnode.prototype.set_parent = function(parent, conn_style) {
    this.parent = parent;
    this.conn_elem = document.createElement("div");

    var this_style =
        "top: " + Math.min(parent.py, this.py) + "px;"
        + "left: " + parent.px + "%;"
        + "width: " + (this.px - parent.px) + "%;"
        + "height: " + Math.abs(parent.py - this.py) + "px;";

    if( this.py < parent.py ){
        // upward connection
        this_style += "border-bottom: none;";
    }else{
        // downward connection
        this_style += "border-top: none;";
    }
    this.conn_elem.style.cssText = conn_style + this_style;
};

///
/// a tree with distances on each edge
///

function tree() {
    this.nodes = {};
    this._roots = null;
};

tree.prototype.add_node = function(id, label) {
    this.nodes[id] = new node(id, label);
};

tree.prototype.add_edge = function(parent_id, child_id, distance) {
    var parent = this.nodes[parent_id];
    var child = this.nodes[child_id];
    if( "undefined" == typeof parent ){
        throw "parent node " + parent_id + " not found";
    }
    if( "undefined" == typeof child ){
        throw "child node " + child_id + " not found";
    }
    parent.add_child(child, distance);
};

tree.prototype.sort_children = function(compare_fun) {
    var roots = this.roots();
    roots.sort(compare_fun);
    for (var i = 0; i < roots.length; i++) {
        roots[i].sort_children(compare_fun);
    }
};

tree.prototype.iterate_nodes = function(fun) {
    for( var id in this.nodes ){
        fun(this.nodes[id]);
    }
};

tree.prototype.iterate_edges = function(fun) {
    for( var id in this.nodes ){
        var parent = this.nodes[id];
        for( var i = 0; i < parent.children.length; i++ ){
            fun(parent, parent.children[i]);
        }
    }
};

tree.prototype.roots = function() {
    if (this._roots) return this._roots;
    var roots = [];
    this.iterate_nodes(function(node) {
        if( ! node.has_parent() ) roots.push(node);
    });
    this._roots = roots;
    return this._roots;
};

tree.prototype.traverse = function(down_fun, down_data, up_aggregator) {
    var roots = this.roots();
    var results = [];
    for (var i = 0; i < roots.length; i++) {
        results.push(roots[i].traverse(down_fun, down_data, up_aggregator));
    }
    return results;
};

tree.prototype.max_distance = function() {
    return max(this.traverse(
        function(node, down_data) {
            return down_data + node.parent_distance;
        },
        0,
        function(node, child_results, down_data) {
            return Math.max(down_data, max(child_results));
        }
    ) );
};

// returns an array of {id, x, y} objects (one per node)
tree.prototype.layout = function() {
    var leaf_counter = 0;
    return Array.prototype.concat.apply([], this.traverse(
        function(node, down_data) {
            return down_data + node.parent_distance;
        },
        0,
        function(node, child_results, down_data) {
            var immediate_child_y_sum = 0;
            for (var i = 0; i < child_results.length; i++) {
                // child_results will be an array with one element for each
                // child.  Each of those elements is an array of position
                // objects.  The first position object is the position of the
                // immediate child, and the rest of the position objects
                // are for that child's children.
                // (see how the return value is constructed below)
                immediate_child_y_sum += child_results[i][0].y;
            }
            
            var my_pos = [{
                id: node.id,
                x: down_data,
                y: ( node.is_leaf()
                     ? leaf_counter++
                     : ( immediate_child_y_sum
                         / child_results.length ) )
            }];
            // flatten child result arrays and append the result to my_pos
            return Array.prototype.concat.apply(my_pos, child_results);
        }
    ) );
};

///
/// tree node
///

function node(id, label) {
    this.id = id;
    this.label = label;
    this.parent = null;
    this.parent_distance = 0;
    this.children = [];
};

node.prototype.add_child = function(child_node, distance) {
    child_node.parent_distance = distance;
    child_node.parent = this;
    this.children.push(child_node);
};

node.prototype.is_leaf = function() {
    return 0 == this.children.length;
};

node.prototype.has_parent = function() {
    return null != this.parent;
};

node.prototype.sort_children = function(compare_fun) {
    for( var i = 0; i < this.children.length; i++ ){
        this.children[i].sort_children(compare_fun);
    }
    this.children.sort(compare_fun);
};

// traverse down and then up the tree, passing some data down
// at each step, and aggregating traversal results from the
// children on the way up
// down_fun: gets called on each node on the way down
//           arguments: node, down_data
// down_data: starting value for the data to pass down
//            (down_fun on a root gets this value for down_data)
// up_aggregator: function to aggregate results on the way back up
//                arguments: node, child_results, down_data
node.prototype.traverse = function(down_fun, down_data, up_aggregator) {
    down_data = down_fun(this, down_data);

    var child_results = [];
    for( var i = 0; i < this.children.length; i++ ){
        child_results.push(
            this.children[i].traverse(down_fun,
                                      down_data,
                                      up_aggregator)
        );
    }

    return up_aggregator(this, child_results, down_data);
};

///
/// Util functions
///

// takes an object like {"top": "10px", "left": "5px"}
// and return a string like "top: 10px; left: 5px;"
function css_string(css_object) {
    var result = "";
    if( "object" == typeof css_object ){
        for( var key in css_object ){
            result += key + ":" + css_object[key] + ";";
        }
    }
    return result;
}

function max(list) {
    if (0 == list.length) return null;
    var result = list[0];
    for( var i = 1; i < list.length; i++ ){
        if( list[i] > result ) result = list[i];
    }
    return result;
}

function min(list) {
    if (0 == list.length) return null;
    var result = list[0];
    for( var i = 1; i < list.length; i++ ){
        if( list[i] < result ) result = list[i];
    }
    return result;
}

function sum(list) {
    var result = 0;
    for( var i = 0; i < list.length; i++ ){
        result += list[i];
    }
    return result;
}

})();
