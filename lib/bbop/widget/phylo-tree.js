if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.phylo_tree == "undefined" ){ bbop.widget.phylo_tree = {}; }

(function() {

bbop.widget.phylo_tree.renderer = renderer;

// if there is more than one phylo tree on the page, this counter
// makes the CSS prefixes unique
var id_counter = 0;

// see default_config for a description of possible config settings
function renderer(parent, config){
    this.parent = ( ( "string" == typeof parent )
		    ? document.getElementById(parent)
		    : parent );
    if (this.parent === undefined) {
        throw "can't find parent element " + parent;
    }
    this.tree = new tree();
    this.node_hidden = {};
    this.children_hidden = {};
    this._sort = "ladderize_up";
    this._layout_dirty = true;
    this._css_prefix = "phylo_tree_" + (id_counter++) + "_";

    var self = this;
    this.node_elem_click_handler = function(event) {
        var node_elem =
            (event.currentTarget) ? event.currentTarget : event.srcElement;
        var node = self.tree.nodes[node_elem.node_id];
        if (node) return self.node_clicked(node, node_elem, event);
    };

    var default_config = {
        // these are in pixels
        // leaf box vertical height, including padding and borders
        box_height: 24,
        // vertical space between leaf boxes
        box_spacing: 10,
        // space between leaf box edge and leaf label
        leaf_padding: 4,
        // leaf border thickness
        leaf_border: 2,
        // leaf left offset
        leaf_margin: 1,
        // width/height of internal nodes
        node_size: 8,

        // leaf border color
        leaf_border_color: "blue",
        // font for leaf labels
        leaf_font: "Helvetica, Arial, sans-serif",
        transition_time: "0.8s"
    };

    this.config = ("object" == typeof config
                   ? bbop.core.merge(default_config, config)
                   : default_config);

    //config settings with default values dependent on other config values
    this.config.parent_padding = ( (this.config.parent_padding === undefined)
                                   ? ((this.config.box_spacing / 2) | 0)
                                   : this.config.parent_padding );

    this.node_style = {
        position: "absolute",
        background: "white",
        "z-index": 2,
        width: this.config.node_size + "px",
        height: this.config.node_size + "px",
        "margin-top": (-this.config.node_size / 2) + "px",
        "margin-left": (-this.config.node_size / 2) + "px",
        border: "1px solid black",
        "transition-property": "top, left",
        "transition-duration": this.config.transition_time,
        "transition-timing-function": "ease-in-out, ease-in-out",
        "box-sizing": "content-box",
        "-moz-box-sizing": "content-box"
    };

    this.leaf_style = {
        position: "absolute",
        background: "#f1f1ff",
        "z-index": 1,
        padding: this.config.leaf_padding + "px",
        // if leaf_padding is too low, the branch line will touch the text
        "padding-left": Math.max(this.config.leaf_padding, 3) + "px",

        // so that the leaves don't cover up the connection lines
        "margin-left": this.config.leaf_margin + "px",

        "margin-top": (-this.config.box_height / 2) + "px",

        // setting font size from box height.  We'd like to set font cap height
        // directly, but we can only set em box size.  Cap height on average is
        // 70% of em box size, so we'll set the font size to the intended
	// height divided by 0.7
        font: ( ( this.config.box_height
                  - ( this.config.leaf_padding * 2 )
                  - ( this.config.leaf_border * 2 ) )
                / 0.7 ) + "px " + this.config.leaf_font,

        // this.config.box_height includes padding and borders, so we
        // subtract those out to set the CSS height, which doesn't include
        // padding or borders
        height: ( this.config.box_height
                  - ( this.config.leaf_padding * 2 )
                  - ( this.config.leaf_border * 2 ) ) + "px",

        // center vertically by setting the line height to 0.7em
        // (corresponding to the way we set font size above)
        "line-height": "0.7em",
        "border-radius": (this.config.leaf_padding + 1) + "px",
        "white-space": "nowrap",
        "transition-property": "top, left",
        "transition-duration": this.config.transition_time,
        "transition-timing-function": "ease-in-out, ease-in-out",
        "box-sizing": "content-box",
        "-moz-box-sizing": "content-box"
    };

    if (this.config.leaf_border > 0) {
        this.leaf_style.border =
            this.config.leaf_border + "px solid "
            + this.config.leaf_border_color;
    }

    this.connection_style = {
        position: "absolute",
        "border-left": "2px solid black",
        "border-top": "2px solid black",
        "border-bottom": "2px solid black",
        "border-right": "none",
        "transition-property": "top, height, left, width, border",
        "transition-duration": this.config.transition_time,
        "transition-timing-function": 
            "ease-in-out, ease-in-out, ease-in-out, ease-in-out, step-start"
    };
};

renderer.prototype.subtree_hidden = function(node_id) {
    return this.children_hidden[node_id];
};

// sets the given css_string as a new stylesheet, or replaces this object's
// stylesheet with css_string if one has already been set
renderer.prototype.set_styles = function(css_string) {
    if (! this._style_node) {
        head = document.getElementsByTagName('head')[0],
        this._style_node = document.createElement('style');
        this._style_node.type = 'text/css';
        head.appendChild(this._style_node);
    }

    if (this._style_node.styleSheet) {
        // IE
        this._style_node.styleSheet.cssText = css_string;
    } else {
        while (this._style_node.firstChild) {
            this._style_node.removeChild(this._style_node.firstChild);
        }
        this._style_node.appendChild(document.createTextNode(css_string));
    }
};

renderer.prototype.add_node = function(unique_id, label, meta){
    this.tree.add_node(unique_id, label, meta);
    this._layout_dirty = true;
};

renderer.prototype.add_edge = function(nid1, nid2, dist){
    this.tree.add_edge(nid1, nid2, dist);
    this._layout_dirty = true;
};

renderer.prototype.display = function () {
    if (this.container) this.parent.removeChild(this.container);

    this.container = document.createElement("div");
    this.container.style.cssText = [
        "position: absolute",
        "top: 0px",
        "left: " + ( (this.config.node_size / 2)
                     + this.config.parent_padding ) + "px",
        "margin: 0px",
        "padding: 0px",
        "transition-property: width, height",
        "transition-duration: " + this.config.transition_time,
        "transition-timing-function: ease-in-out"
    ].join(";") + ";";

    var node_class = this._css_prefix + "node";
    var leaf_class = this._css_prefix + "leaf";
    var conn_class = this._css_prefix + "conn";
        
    this.set_styles([
        "div." + node_class + " {" + css_string(this.node_style) + "}",
        "div." + leaf_class + " {" + css_string(this.leaf_style) + "}",
        "div." + conn_class + " {" + css_string(this.connection_style) + "}"
    ].join("\n"));

    var phynodes = {};
    for (var node_id in this.tree.nodes) {
        var node = this.tree.nodes[node_id];
        var phynode = new graph_pnode(node,
                                      node_class, leaf_class,
                                      this.config.box_height);
        this.container.appendChild(phynode.node_elem);
        phynode.node_elem.onclick = this.node_elem_click_handler;
        phynodes[node.id] = phynode;
    }
    this._phynodes = phynodes;

    var container = this.container;
    var self = this;
    this.tree.iterate_edges(function(parent, child) {
        if (self.node_hidden[child.id]) return;
        var child_phynode = phynodes[child.id];
        child_phynode.set_parent(
            phynodes[parent.id],
            conn_class
        );
        container.appendChild(child_phynode.conn_elem);
    });

    this.position_nodes();
    this.parent.appendChild(this.container);

    this.width_changed(this.parent.clientWidth);
};

renderer.prototype.position_nodes = function() {
    // x_scale will be percentage units
    var x_scale = 100 / this.max_distance();

    // row_height is in pixel units
    var row_height = this.config.box_height + this.config.box_spacing;

    // the position values from the tree layout are center
    // positions, and the very top one has a y-position of 0.
    // if a leaf node box is centered at that point, then the
    // top half of the top box would get cut off.  So we move
    // all of the positions down by top_margin pixels.
    var top_margin = ( (this.config.box_height / 2)
                       + this.config.parent_padding );

    var layout = this.layout();
    var self = this;
    this.tree.iterate_preorder(function(node) {
	var node_pos = layout[node.id];

	var x = (node_pos.x * x_scale);
	var y = (node_pos.y * row_height) + top_margin;
        self._phynodes[node_pos.id].set_position(x, y);
        if (self.subtree_hidden(node.id)) return true;
    });
    this.tree_height = ( (this.leaves().length * row_height)
                         - this.config.box_spacing
                         + (this.config.parent_padding * 2) );

    this.parent.style.transition =
        "height " + this.config.transition_time + " ease-in-out";
    this.parent.style.height = this.tree_height + "px";
    this.container.style.height = this.tree_height + "px";
};

renderer.prototype.max_distance = function() {
    if (this._layout_dirty) this._update_layout();
    return this._max_distance;
};

renderer.prototype.leaves = function() {
    if (this._layout_dirty) this._update_layout();
    return this._leaves;
};

renderer.prototype.layout = function() {
    if (this._layout_dirty) this._update_layout();
    return this._layout;
};

renderer.prototype._update_layout = function() {
    this._do_sort(this._sort);
    var self = this;

    var visible_leaves = [];
    this.tree.iterate_preorder(function(node) {
        if (self.node_hidden[node.id]) return;
        // nodes with hidden children are leaves for layout purposes
        if (node.is_leaf() || self.children_hidden[node.id]) {
            visible_leaves.push(node);
        }
    });
    this._leaves = visible_leaves;

    var roots = this.tree.roots();
    var root_distances = [];
    for (var i = 0; i < roots.length; i++) {
        root_distances.push(roots[i].parent_distance);
    }
    // if we're only showing a subtree, position the leftmost subtree
    // root all the way to the left
    this.x_offset = -min(root_distances);

    this._max_distance = max(this.tree.traverse(
        function(node, down_data) {
            return down_data + node.parent_distance;
        },
        this.x_offset,
        function(node, child_results, down_data) {
            if (self.node_hidden[node.id]) return 0;

            return Math.max(down_data, max(child_results));
        }
    ) );

    this._layout = this._do_layout();
    this._layout_dirty = false;
};

// returns an array of {id, x, y} objects (one per node)
renderer.prototype._do_layout = function() {
    var leaf_counter = 0;
    var self = this;
    var layout_list = Array.prototype.concat.apply([], this.tree.traverse(
        function(node, down_data) {
            return down_data + node.parent_distance;
        },
        this.x_offset,
        function(node, child_results, down_data) {
            // don't lay out the node if it's hidden
            if (self.node_hidden[node.id]) return [];

            // don't try to average child positions if children are hidden
            if (! (node.id in self.children_hidden)) {
                var immediate_child_y_sum = 0;
                for (var i = 0; i < child_results.length; i++) {
                    // child_results will be an array with one element
                    // for each child.  Each of those elements is an
                    // array of position objects.  The first position
                    // object is the position of the immediate child,
                    // and the rest of the position objects are for
                    // that child's descendants.  (see how the return
                    // value is constructed below)
                    immediate_child_y_sum += child_results[i][0].y;
                }
            }
            
            var my_pos = [{
                id: node.id,
                x: down_data,
                y: ( ( node.is_leaf() || self.children_hidden[node.id] )
                     // The traverse method goes depth-first, so we'll
                     // encounter the leaves in leaf-order.  So the
                     // y-coord for leaves is just the number of
                     // leaves we've seen so far.
                     ? leaf_counter++
                     // The internal node y-coord is the mean of its
                     // child y-coords
                     : ( immediate_child_y_sum / child_results.length ) )
            }];
            // flatten child result arrays and append the result to my_pos
            return Array.prototype.concat.apply(my_pos, child_results);
        }
    ) );

    var layout_hash = {};
    for (var i = 0; i < layout_list.length; i++) {
        layout_hash[layout_list[i].id] = layout_list[i];
    }
    return layout_hash;
};

// call this when the width of the tree's parent element changes
renderer.prototype.width_changed = function(parent_width) {
    var leaves = this.leaves();
    var avail_width = ( parent_width 
                        - (this.config.node_size / 2)
                        - (this.config.parent_padding * 2)
                        - this.config.leaf_margin );

    var min_width = Number.MAX_VALUE;
    for (var li = 0; li < leaves.length; li++) {
        var leaf_id = leaves[li].id;
        var phynode = this._phynodes[leaf_id];

        // Each potential width is the width that this.container
        // would have to be so that the leaf label fits into this.parent.
        // We take the minimum because that's the most conservative of
        // all the potential widths we calculate here.
        var potential_width =
            // dividing px by 100 because px is in percentage units
            (avail_width - phynode.width()) / (phynode.px / 100)
        min_width = Math.min(min_width, potential_width);
    }
    this.container.style.width = Math.max(0, min_width | 0) + "px";
};

// hides the subtree under the given node_id; for that node,
// it shows the label and a visual ellipsis
renderer.prototype.hide_subtree = function(node_id) {
    var to_hide_under = this.tree.nodes[node_id];
    if (to_hide_under === undefined) {
        throw "asked to hide non-existent node " + node_id;
    }
    // there's nothing to hide under a leaf node
    if (to_hide_under.is_leaf()) return;

    var self = this;
    to_hide_under.iterate_preorder(function(node) {
        // don't hide the given node
        if (node === to_hide_under) return;

        self.node_hidden[node.id] = true;
        self._phynodes[node.id].hide();
    });
    self.children_hidden[to_hide_under.id] = true;
    self._phynodes[to_hide_under.id].set_children_hidden();

    this._layout_dirty = true;
    this.position_nodes();
    this.width_changed(this.parent.clientWidth);
};

// show a previously-hidden subtree
renderer.prototype.show_subtree = function(node_id) {
    var to_show_under = this.tree.nodes[node_id];
    if (to_show_under === undefined) {
        throw "asked to show non-existent node " + node_id;
    }

    var self = this;
    // remove this node from children_hidden
    delete self.children_hidden[to_show_under.id];
    to_show_under.iterate_preorder(function(node) {
        if (node === to_show_under) return;

        delete self.node_hidden[node.id];
        self._phynodes[node.id].show();
        
        // returning true stops the iteration: if we encounter a
        // previously-hidden subtree under the node that we're
        // showing, we'll leave its children hidden unless it's
        // specifically shown
        if (self.children_hidden[node.id]) return true;
    });
    self._phynodes[to_show_under.id].set_children_visible();

    this._layout_dirty = true;
    this.position_nodes();
    this.width_changed(this.parent.clientWidth);
};

// hide everything except the subtree rooted at the given node
renderer.prototype.show_only_subtree = function(node_id) {
    var to_show = this.tree.nodes[node_id];
    if (to_show === undefined) {
        throw "asked to show non-existent node " + node_id;
    }

    // hide all nodes except those under the given node
    var self = this;
    this.tree.iterate_preorder(function(node) {
        // returning true stops the iteration: we don't want to hide
        // any nodes under this node, so we'll stop the iteration here
        // for the subtree rooted at the current node
        if (node === to_show) return true;

        self.node_hidden[node.id] = true;
        self._phynodes[node.id].hide();
    });
    this.tree.set_roots([to_show.id]);
    this._phynodes[node_id].hide_connector();

    this._layout_dirty = true;
    this.position_nodes();

    this.width_changed(this.parent.clientWidth);
};

// returns true if we're showing only a subtree rooted at the node
// with the given id, false otherwise
renderer.prototype.only_subtree_shown = function(node_id) {
    var node = this.tree.nodes[node_id];
    return contains(this.tree.roots(), node) && node.has_parent();
};

// undo show_only_subtree
renderer.prototype.show_global_root = function() {
    this.tree.clear_roots();
    
    var self = this;
    this.tree.iterate_preorder(function(node) {
        delete self.node_hidden[node.id];
        var phynode = self._phynodes[node.id];
        phynode.show();
        if (! phynode.connector_shown) phynode.show_connector();
        
        // returning true stops the iteration: if we encounter a
        // previously-hidden subtree under the node that we're
        // showing, we'll leave its children hidden unless it's
        // specifically shown
        if (self.children_hidden[node.id]) return true;
    });

    this._layout_dirty = true;
    this.position_nodes();
    this.width_changed(this.parent.clientWidth);
};

renderer.prototype.node_clicked = function() {};

renderer.prototype.set_sort = function(sort) {
    if (sort == this._sort) return;
    this._sort = sort;
    this._layout_dirty = true;
};

// sort the tree according to the given sort ordering
// see available_sorts for available sort arguments
renderer.prototype._do_sort = function(sort) {
    // leaf_counts: for each node, contains the number of its descendant leaves
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

    var available_sorts = {
        ladderize_up: function(a, b) {
            return leaf_counts[b.id] - leaf_counts[a.id];
        },
        ladderize_down: function(a, b) {
            return leaf_counts[a.id] - leaf_counts[b.id];
        },
        alphabetical: function(a, b) {
            if( a.id == b.id ) return 0;
            return (a.id < b.id) ? -1 : 1;
        }
    };

    if ("string" == typeof sort) {
        if( ! sort in available_sorts ) throw "unknown sort " + sort;
        this.tree.sort_children(available_sorts[sort]);
    } else if ("function" == typeof sort) {
        this.tree.sort_children(sort);
    }
};

renderer.prototype.iterate_preorder = function(callback) {
    var self = this;
    this.tree.iterate_preorder(function(node) {
        // if the node is hidden, there won't be anything in self._phynodes
        if (self.node_hidden[node.id]) return;
        return callback(node.id, node.label, node.meta,
                        self._phynodes[node.id].node_elem,
                        node.children);
    });
};

renderer.prototype.traverse = function(down_fun, down_data, up_aggregator) {
    var self = this;
    return this.tree.traverse(down_fun, down_data, up_aggregator);
};

///
/// phylo node html renderer
///

function graph_pnode(node, node_class, leaf_class, height){
    this.node = node;
    this.height = height;
    this.leaf_class = leaf_class;
    this.connector_shown = false;

    var node_elem = document.createElement("div");
    if (node.is_leaf()) {
        node_elem.appendChild(document.createTextNode(node.label));
        node_elem.className = leaf_class;
    } else {
        node_elem.title = node.label;
        node_elem.className = node_class;
    }

    node_elem.node_id = node.id;
    this.node_elem = node_elem;
}

graph_pnode.prototype.set_children_hidden = function() {
    var left_offset = 10;
    this.subtree_box = document.createElement("div");
    this.subtree_box.className = this.leaf_class;
    this.subtree_box.style.backgroundColor = "#eee";
    this.subtree_box.style.left = left_offset + "px";
    this.subtree_box.style.top =
        ((this.height / 2) - (this.node_elem.offsetHeight / 2 ) ) + "px";
    this.subtree_box.appendChild(
        document.createTextNode(this.node.label + " ...")
    );

    this.subtree_box.node_id = this.node.id;
    this.node_elem.appendChild(this.subtree_box);
    this._width = left_offset + this.subtree_box.offsetWidth;
};

graph_pnode.prototype.set_children_visible = function() {
    this._width = this.node_elem.offsetWidth;
    this.node_elem.removeChild(this.subtree_box);
};

graph_pnode.prototype.hide = function() {
    this.node_elem.style.display = "none";
    if (this.parent) this.conn_elem.style.display = "none";
};

graph_pnode.prototype.hide_connector = function() {
    if (this.parent) this.conn_elem.style.display = "none";
    this.connector_shown = false;
};

graph_pnode.prototype.show = function() {
    this.node_elem.style.display = "";
    if (this.parent) this.conn_elem.style.display = "";
};

graph_pnode.prototype.show_connector = function() {
    if (this.parent) this.conn_elem.style.display = "";
    this.connector_shown = true;
};

graph_pnode.prototype.set_position = function(x, y) {
    this.px = x;
    this.py = y;

    this.node_elem.style.left = x + "%";
    this.node_elem.style.top = y + "px";

    if (this.parent && this.connector_shown) {
        var conn_style =
            "top: " + Math.min(this.parent.py, this.py) + "px;"
            + "left: " + this.parent.px + "%;"
            + "width: " + (this.px - this.parent.px) + "%;"
            + "height: " + Math.abs(this.parent.py - this.py) + "px;";

        if (this.py < this.parent.py) {
            // upward connection
            conn_style += "border-bottom: none;";
        } else {
            // downward connection
            conn_style += "border-top: none;";
        }
        this.conn_elem.style.cssText = conn_style;
    }
}

graph_pnode.prototype.set_parent = function(parent, conn_class) {
    this.parent = parent;
    this.conn_elem = document.createElement("div");
    this.conn_elem.className = conn_class;
    this.conn_elem.id=parent.node.id + "-" + this.node.id;
    this.connector_shown = true;
};

graph_pnode.prototype.width = function() {
    if (! ("_width" in this)) this._width = this.node_elem.offsetWidth;
    return this._width;
};

///
/// a tree with distances on each edge
///

function tree() {
    this.nodes = {};
    // if _dirty is true, then the stuff that's calculated in _summarize()
    // is out of date
    this._dirty = true;
}

tree.prototype.add_node = function(id, label, meta) {
    this.nodes[id] = new node(id, label, meta);
    this._dirty = true;
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
    this._dirty = true;
};

tree.prototype.sort_children = function(compare_fun) {
    var roots = this.roots();
    roots.sort(compare_fun);
    for (var i = 0; i < roots.length; i++) {
        roots[i].sort_children(compare_fun);
    }
};

tree.prototype.iterate_preorder = function(fun) {
    var roots = this.roots()
    for (var i = 0; i < roots.length; i++) {
        roots[i].iterate_preorder(fun);
    }
};

tree.prototype.iterate_edges = function(fun) {
    for (var id in this.nodes) {
        var parent = this.nodes[id];
        for (var i = 0; i < parent.children.length; i++) {
            fun(parent, parent.children[i]);
        }
    }
};

tree.prototype._summarize = function() {
    if (this._dirty) this.clear_roots();
    this._dirty = false;
};

tree.prototype.roots = function() {
    if (this._dirty) this._summarize();
    return this._roots;
};

// set the roots to be specific nodes
// i.e. to only show a subtree, set_roots(subtree_node_id)
tree.prototype.set_roots = function(root_ids) {
    var roots = [];
    for (var i = 0; i < root_ids.length; i++) {
        roots.push(this.nodes[root_ids[i]]);
    }
    this._roots = roots;
};

// set the list of roots back to the "natural" list of nodes without
// parents
tree.prototype.clear_roots = function() {
    var roots = [];
    for (var id in this.nodes) {
        var node = this.nodes[id];
        if( ! node.has_parent() ) roots.push(node);
    }
    this._roots = roots;
};

// see node.traverse for description
tree.prototype.traverse = function(down_fun, down_data, up_aggregator) {
    var roots = this.roots();
    var results = [];
    for (var i = 0; i < roots.length; i++) {
        results.push(roots[i].traverse(down_fun, down_data, up_aggregator));
    }
    return results;
};

///
/// tree node
///

function node(id, label, meta) {
    this.id = id;
    this.label = label;
    this.meta = meta;
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
    for (var i = 0; i < this.children.length; i++) {
        this.children[i].sort_children(compare_fun);
    }
    this.children.sort(compare_fun);
};

// return true from the callback to stop iterating at a node
// (the iteration will continue with siblings but not with children of the
//  node where the callback returns true
node.prototype.iterate_preorder = function(fun) {
    if (! (true == fun(this))) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].iterate_preorder(fun);
        }
    }
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

    var child_results = new Array(this.children.length);;
    for (var i = 0; i < this.children.length; i++) {
        child_results[i] =
            this.children[i].traverse(down_fun, down_data, up_aggregator)
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
    if ("object" == typeof css_object) {
        for (var key in css_object) {
            result += key + ":" + css_object[key] + ";";
        }
    }
    return result;
}

function contains(arr, elem) {
    for (var i = 0; i < arr.length; i++) {
        if (elem == arr[i]) return true;
    }
    return false;
}

function max(list) {
    if (0 == list.length) return null;
    var result = list[0];
    for (var i = 1; i < list.length; i++) {
        if (list[i] > result) result = list[i];
    }
    return result;
}

function min(list) {
    if (0 == list.length) return null;
    var result = list[0];
    for (var i = 1; i < list.length; i++) {
        if (list[i] < result) result = list[i];
    }
    return result;
}

function sum(list) {
    var result = 0;
    for (var i = 0; i < list.length; i++) {
        result += list[i];
    }
    return result;
}

})();
