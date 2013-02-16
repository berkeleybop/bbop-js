bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'model');
bbop.core.require('bbop', 'model', 'tree');
bbop.core.namespace('bbop', 'render', 'phylo');

// see default_config for a description of possible config settings
bbop.render.phylo.renderer = function (element_id, config){
    var elt_id = element_id;
    this.parentElem = document.getElementById(elt_id);

    var default_config = {
        // these are in pixels
        // height of the leaf node box, excluding border
        box_height: 27,
        // vertical space between leaf boxes
        box_spacing: 15,
        // space between leaf box edge and leaf label
        leaf_padding: 5,
        // leaf border thickness
        leaf_border: 2,

        // leaf border color
        leaf_border_color: "blue",
        // font for leaf labels
        // if you set this, you probably also want to change
        // box_height or leaf_padding
        leaf_font: "16px sans-serif"
    };

    this.config = ("object" == typeof config
                   ? bbop.core.merge(default_config, config)
                   : default_config);

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
        padding: this.config.leaf_padding + "px",
        font: this.config.leaf_font,
        height: this.config.box_height - (2 * this.config.leaf_padding) + "px",
        "border-radius": "5px"
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

    ///
    /// Functions to handle internal graph management.
    ///
    
    var node_cache_hash = {};
    this._graph = new bbop.model.tree.graph();

    this.add_node = function(unique_id){
	var new_node = new bbop.model.tree.node(unique_id, unique_id);
	node_cache_hash[unique_id] = new_node;
	this._graph.add_node(new_node);
    };

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
        if( this.container ){
            this.parentElem.removeChild(this.container);
        }
        this.container = document.createElement("div");
        this.container.style.cssText = [
            "position: absolute",
            "top: 0px",
            "left: 0px",
            "margin: 0px",
            "padding: 0px"
        ].join(";") + ";";

        // x_scale will be percentage units
	var x_scale = 100 / layout.max_distance;

        // y_scale is in pixel units
	var y_scale = this.config.box_height + this.config.box_spacing;

        // the position values from the tree layout are center
        // positions, and the very top one has a y-position of 0.
        // if a leaf node box is centered at that point, then the
        // top half of the top box would get cut off.  So we move
        // all of the positions down by top_margin pixels.
        var top_margin =
            (this.config.box_height / 2) + this.config.leaf_border;

        var total_box_height =
            this.config.box_height + (this.config.leaf_border * 2);

        this._render_frame_height = (layout.max_width * y_scale);

	// Add phynodes and create lookup (hash) for use with connections.
	var phynodes = new Array();
	var phynode_hash = {};
        var leaves = new Array();

        var node_style = css_string(this.node_style);
        var leaf_style = css_string(this.leaf_style);

	for( var nidi = 0; nidi < layout.node_list.length; nidi++ ){
	    // Calculate position.
	    var node_id = layout.node_list[nidi];
	    var lpx = (layout.position_x[node_id] * x_scale);
	    var lpy = (layout.position_y[node_id] * y_scale) + top_margin;

	    // Create node at place. 
	    var phynode = null;
	    if( ! this._graph.is_leaf_node(node_id) ){
                phynode = new graph_pnode(node_id, lpx, lpy,
                                          node_style, leaf_style,
                                          total_box_height, true);
                this.container.appendChild(phynode.node_elem);
	    }else{
                phynode = new graph_pnode(node_id, lpx, lpy,
                                          node_style, leaf_style,
                                          total_box_height, false);
                this.container.appendChild(phynode.node_elem);
                leaves.push(phynode);
	    }

            phynodes.push(phynode);

	    // Indexing for later (edge) use.
	    phynode_hash[node_id] = nidi;
	}

        var conn_style = css_string(this.connection_style);
	for( var ei = 0; ei < layout.edge_list.length; ei++ ){
	    var edge = layout.edge_list[ei];
            var child_phynode = phynodes[phynode_hash[edge[1]]];
            child_phynode.set_parent(
                phynodes[phynode_hash[edge[0]]],
                conn_style
            );
            this.container.appendChild(child_phynode.conn_elem);
        }

        this.parentElem.style.cssText =
            "height: " + this._render_frame_height + "px;";
        this.container.style.height = this._render_frame_height + "px";
        this.parentElem.appendChild(this.container);

        var max_leaf_width = 0;
        for( var li = 0; li < leaves.length; li++ ){
            max_leaf_width = Math.max(
                leaves[li].node_elem.offsetWidth,
                max_leaf_width
            );
        }
        max_leaf_width =
            max_leaf_width
            + (2 * this.config.leaf_border)
            + (2 * this.config.leaf_padding) + 1;

	this._render_frame_width = this.parentElem.offsetWidth;
        this.container.style.width =
            (this._render_frame_width - max_leaf_width) + "px"
    }

    //
    // graphical representation of a phylo node
    //

    var graph_pnode = function(label, px, py, 
                               node_style, leaf_style,
                               height, is_internal){
        this.label = label;
        this.px = px;
        this.py = py;
        this.height = height;
        this.is_internal = is_internal;

        var node_elem = document.createElement("div");
        if( is_internal ){
            node_elem.title = label;
            node_elem.style.cssText =
                node_style + ";"
                + "left: " + px + "%;"
                + "top: " + py + "px;";
        }else{
            node_elem.appendChild(document.createTextNode(label));
            node_elem.style.cssText =
                leaf_style + ";"
                + "left: " + px + "%;"
            // move the top coord of the box up by height/2;
            // this makes the box vertically centered on the given
            // (px, py) position
                + "top: " + (py - (height / 2)) + "px;";
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
};
