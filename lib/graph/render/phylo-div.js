bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'model');
bbop.core.require('bbop', 'model', 'tree');
bbop.core.namespace('bbop', 'render', 'phylo');

var graph_pnode = function(context, label, px, py, height, internal){
    this.context = context;
    this.label = label;
    this.px = px;
    this.py = py;
    this.height = height;
    this.internal = internal;

    var node_elem = document.createElement("div");
    if( internal ){
        node_elem.title = label;
        node_elem.style.cssText =
            context.node_style + ";"
            + "left: " + px + "%;"
            + "top: " + py + "px;";
    }else{
        $(node_elem).append(document.createTextNode(label));
        node_elem.style.cssText =
            context.leaf_style + ";"
            + "left: " + px + "%;"
            + "top: " + (py - (height / 2)) + "px;";
    }
    this.node_elem = node_elem;
    context.container.appendChild(node_elem);
};

graph_pnode.prototype.set_parent = function(parent) {
    this.parent = parent;
    if ( this.conn_elem ) this.context.container.removeChild(this.conn_elem);
    var conn_elem = document.createElement("div");
    var this_style;
    if ( this.py < parent.py ) {
        // upward connection
        this_style = [
            "border-bottom: none",
            "top: " + this.py + "px",
            "left: " + parent.px + "%",
            "width: " + (this.px - parent.px) + "%",
            "height: " + (parent.py - this.py) + "px"
        ].join(";");
    }else{
        // downward connection
        this_style = [
            "border-top: none",
            "top: " + parent.py + "px",
            "left: " + parent.px + "%",
            "width: " + (this.px - parent.px) + "%",
            "height: " + (this.py - parent.py) + "px"
        ].join(";");
    }
    conn_elem.style.cssText = this.context.connection_style + ";" + this_style;
    this.context.container.appendChild(conn_elem);
};

bbop.render.phylo.renderer = function (element_id){
    var elt_id = element_id;
    this.parentElem = document.getElementById(elt_id);

    var renderer_context = this;

    this.box_height = 20;

    // these are in pixels
    this.font_height = 15;
    this.leaf_border = 2;
    this.leaf_padding = 5;

    this.node_style = [
        "position: absolute",
        "background: white",
        "z-index: 2",
        "width: 8px",
        "height: 8px",
        "margin-top: -4px",
        "margin-left: -4px",
        "border: 1px solid black"
    ].join(";");

    this.leaf_style = [
        "position: absolute",
        "background: #f1f1ff",
        "padding: " + this.leaf_padding + "px",
        "border: " + this.leaf_border + "px solid blue",
        "font: " + this.font_height + "px sans-serif",
        "height: " + this.box_height + "px",
        "border-radius: 5px"
    ].join(";");

    this.connection_style = [
        "position: absolute",
        "border-left: 2px solid black",
        "border-top: 2px solid black",
        "border-bottom: 2px solid black",
        "border-right: none"
    ].join(";");

    ///
    /// Functions to handle internal graph management.
    ///
    
    var node_cache_hash = {};
    this._graph = new bbop.model.tree.graph();

    //
    this.add_node = function(unique_id){
	var new_node = new bbop.model.tree.node(unique_id, unique_id);
	node_cache_hash[unique_id] = new_node;
	this._graph.add_node(new_node);
    };

    //
    this.add_edge = function(nid1, nid2, dist){

	var retval = false;

	var n1 = node_cache_hash[nid1];
	var n2 = node_cache_hash[nid2];
	if( n1 && n2 ){
	    var new_edge = new bbop.model.tree.edge(n1, n2, dist);
	    this._graph.add_edge(new_edge);
	    retval = true;	    
	}

	return retval;
    };

    this.display = function () {
	var layout = this._graph.layout();
        if (this.container) {
            this.parentElem.removeChild(this.container);
        }
        this.container = document.createElement("div");
        this.container.style.cssText = [
            "position: absolute",
            "top: 0px",
            "left: 0px",
            "margin: 0px",
            "padding: 0px"
        ].join(";");

	this._render_frame_width = this.parentElem.offsetWidth;

        // x_scale will be percentage units
	var x_scale = 100 / layout.max_distance;
	var y_scale = renderer_context.box_height * 2.0; // fixed y-scale

        var top_margin = (this.box_height / 2) + this.leaf_border;
        var total_box_height = this.box_height + (this.leaf_border * 2);

        this._render_frame_height = (layout.max_width * y_scale);

	// Add phynodes and create lookup (hash) for use with connections.
	var phynodes = new Array();
	var phynode_hash = {};
        var leaves = new Array();
	for( var nidi = 0; nidi < layout.node_list.length; nidi++ ){
            
	    // Calculate position.
	    var node_id = layout.node_list[nidi];
	    var lpx = (layout.position_x[node_id] * x_scale);
	    var lpy = (layout.position_y[node_id] * y_scale) + top_margin;

	    // Create node at place. 
	    var phynode = null;
	    if( ! this._graph.is_leaf_node(node_id) ){
                phynode = new graph_pnode(this, node_id, lpx, lpy,
                                          total_box_height, true);
	    }else{
                phynode = new graph_pnode(this, node_id, lpx, lpy,
                                          total_box_height, false);
                leaves.push(phynode);
	    }

            phynodes.push(phynode);

	    // Indexing for later (edge) use.
	    phynode_hash[node_id] = nidi;
	}

	for( var ei = 0; ei < layout.edge_list.length; ei++ ){
	    var edge = layout.edge_list[ei];
	    var e0 = edge[0];
	    var e1 = edge[1];
            phynodes[phynode_hash[e1]].set_parent(
                phynodes[phynode_hash[e0]]
            );
        }

        this.parentElem.style.cssText =
            "height: " + this._render_frame_height + "px;";
        this.parentElem.appendChild(this.container);

        var max_leaf_width = 0;
        for ( var li = 0; li < leaves.length; li++ ){
            max_leaf_width = Math.max(
                leaves[li].node_elem.offsetWidth,
                max_leaf_width
            );
        }
        max_leaf_width += (2 * this.leaf_border) + (2 * this.leaf_padding) + 1;
        console.log("max leaf width " + max_leaf_width);
        console.log("frame width " + this._render_frame_width);

        this.container.style.height = this._render_frame_height + "px",
        this.container.style.width =
            (this._render_frame_width - max_leaf_width) + "px"
    }
};
