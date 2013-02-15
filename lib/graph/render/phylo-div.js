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

    var node_elem;
    if( internal ){
	node_elem = document.createElement("div");
        node_elem.title = label;
        $(node_elem).css(
            context.node_style
        ).css({
            left: px + "%",
            top: py + "px"
        });
        context.container.append(node_elem);
    }else{
	node_elem = document.createElement("div");
        $(node_elem).append(
            document.createTextNode(label)
        ).css(
            context.leaf_style
        ).css({
            left: px + "%",
            top: (py - (height / 2)) + "px",
        });
        context.container.append(node_elem);
    }
    this.node_elem = node_elem;
};

graph_pnode.prototype.set_parent = function(parent) {
    this.parent = parent;
    if ( this.conn_elem ) this.context.container.remove(this.conn_elem);
    var conn_elem = $(document.createElement("div"));
    conn_elem.css(this.context.connection_style);
    if ( this.py < parent.py ) {
        // upward connection
        conn_elem.css({
            "border-bottom": "none",
            "top": this.py + "px",
            "left": parent.px + "%",
            "width": (this.px - parent.px) + "%",
            "height": (parent.py - this.py) + "px"
        });
    }else{
        // downward connection
        conn_elem.css({
            "border-top": "none",
            "top": parent.py + "px",
            "left": parent.px + "%",
            "width": (this.px - parent.px) + "%",
            "height": (this.py - parent.py) + "px"
        });
    }
    this.context.container.append(conn_elem);
};

bbop.render.phylo.renderer = function (element_id){
    var elt_id = element_id;
    this.parent = $("#" + elt_id);

    var renderer_context = this;

    this.box_width = 60;
    this.box_height = 20;
    this.leaf_border = 2;
    this.leaf_padding = 5;

    this.node_style = {
        position: "absolute",
        background: "white",
        "z-index": 2,
        width: "8px",
        height: "8px",
        "margin-top": "-4px",
        "margin-left": "-4px",
        border: "1px solid black"
    };

    this.leaf_style = {
        position: "absolute",
        background: "#f1f1ff",
        padding: this.leaf_padding + "px",
        border: this.leaf_border + "px solid blue",
        font: "15px sans-serif",
        height: this.box_height + "px",
        "border-radius": "5px"
    };

    this.connection_style = {
        position: "absolute",
        "border-left": "2px solid black",
        "border-top": "2px solid black",
        "border-bottom": "2px solid black",
        "border-right": "none"
    };

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
            this.parent.remove(this.container);
        }
        this.container = $(document.createElement("div"));
        this.container.css({
            "position": "absolute",
            "top": "0px",
            "left": "0px",
            "margin": "0px",
            "padding": "0px"
        });

	this._render_frame_width = this.parent.width();

	this._render_internal_width =
	    this._render_frame_width
	    - (1.0 * renderer_context.box_width)

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

        this.parent.css({height: this._render_frame_height + "px"});
        this.parent.append(this.container);

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

        this.container.css({
            height: this._render_frame_height + "px",
            width: (this._render_frame_width - max_leaf_width) + "px"
        });
    }
};
