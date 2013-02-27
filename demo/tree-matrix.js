bbop.core.require('bbop', 'core');
bbop.core.require('bbop', 'render', 'phylo');
bbop.core.require('jQuery');

var tree_matrix;

(function() {

tree_matrix = function(parent, phylo_graph, column_descriptors,
                       matrix, cell_renderer, config) {
    var default_config = {
        initial_tree_width: 600,
        cell_width: 22,
        header_height: 35,
        scale_drag_linewidth: 4,
	table_cell_border: 1
    };

    if( "object" == typeof config ){
        this.config = bbop.core.merge(default_config, config);
    }else{
        this.config = default_config;
    }

    this.tree_width = this.config.initial_tree_width;

    this.parent = ( ( "string" == typeof parent )
		    ? document.getElementById(parent)
		    : parent );
    if (this.parent === undefined) {
        throw "can't find parent element " + parent;
    }

    this.phylo_table = document.createElement("table");
    this.phylo_table.className = "tree_matrix";
    this.phylo_table.style.cssText = [
        "position: absolute",
        "top: 0px",
        "left: " + ( this.tree_width
		     + this.config.scale_drag_linewidth ) + "px",
        "width: " + ( this.config.cell_width
		      * column_descriptors.length ) + "px"
    ].join(";") + ";";
    this.parent.appendChild(this.phylo_table);

    this.tree_parent = document.createElement("div");
    this.tree_parent.style.cssText = [
        "position: absolute",
        "top: " + this.config.header_height + "px",
        "left: 0px",
        "width: " + this.tree_width + "px"
    ].join(";") + ";";
    this.parent.appendChild(this.tree_parent);
        
    this.tree = new bbop.render.phylo.divrenderer(this.tree_parent, {
        leaf_font: "Helvetica, Arial, sans-serif",
        box_height: 18,
        leaf_border: 0,
        leaf_padding: 3,
        box_spacing: 4
    });

    this.tree.leaf_style.background = "none";
    if( 0 ){
        this.tree.leaf_style.display = "none";
        this.tree.node_style.display = "none";
        this.tree.config.box_spacing = 8;
    }

    var nodes = global_graph.nodes;
    var edges = global_graph.edges;

    for( var ni = 0; ni < nodes.length; ni++ ){
        this.tree.add_node(nodes[ni].id);
    }
    for( var ei = 0; ei < edges.length; ei++ ){
        this.tree.add_edge(edges[ei].sub, edges[ei].obj,
                           parseFloat(edges[ei].meta));
    }
    
    this.tree.sort_tree("ladderize_up");
    //create one row for the matrix header row
    var row = document.createElement("tr");
    for (var i = 0; i < column_descriptors.length; i++) {
        var cell = document.createElement("th");
        cell.title = column_descriptors[i];
        row.appendChild(cell);
    }
    row.style.height = this.config.header_height + "px";
    this.phylo_table.appendChild(row);
    var leaves = this.tree.leaves();
    for( var li = 0; li < leaves.length; li++ ){
        row = document.createElement("tr");

        for (var col = 0; col < matrix[li].length; col++) {
            var cell = document.createElement("td");
            cell_renderer(cell, matrix[li][col]);
            cell.title = leaves[li].id + ", " + column_descriptors[col];
            row.appendChild(cell);
        }

        row.className = "tree_matrix";
        this.phylo_table.appendChild(row);
    }

    this.tree.display();

    this.default_stylesheet = [
        "table.tree_matrix { border-collapse: collapse; }",
        "table.tree_matrix tr { ",
        "  height: " + this.tree.row_height + "px;",
        "}",
        "table.tree_matrix tr:nth-child(even)  { background-color:#eee; }",
        "table.tree_matrix tr:nth-child(odd) { background-color:#fff; }",
        "table.tree_matrix td { ",
        "  border: " + this.config.table_cell_border + "px solid black;",
        "}",
        "table.tree_matrix th { ",
        "  border: " + this.config.table_cell_border + "px solid black;",
        "}",
        "table.tree_matrix tr:hover td { background-color: #bef195; }"
    ].join("\n");

    this.set_styles(this.default_stylesheet);

    this.parent.style.height = ( this.tree.tree_height
                                 + this.config.header_height ) + "px";

    this.parent.style.width = ( this.tree_width
				+ this.config.scale_drag_linewidth
                                + ( this.config.cell_width
                                    * column_descriptors.length ) ) + "px";

    this.scale_drag_elem = document.createElement("div");
    this.scale_drag_elem.style.cssText = [
        "position: absolute",
        "top: 0px",
        "left: " + this.tree_width + "px",
        "height: " + ( this.tree.tree_height
                       + this.config.header_height) + "px",
        "width: " + this.config.scale_drag_linewidth + "px",
        "background: #5f5",
        "cursor: ew-resize"
    ].join(";") + ";";
    var scale_drag_handle = document.createElement("div");
    scale_drag_handle.style.cssText = [
        "position: absolute",
        "top: 0px",
        "right: 0px",
        "height: " + this.config.header_height + "px",
        "width: " + this.config.header_height + "px",
        "background: #5f5",
        "border-radius: 40% 0px 0px 40%"
    ].join(";") + ";";
    scale_drag_handle.title = "drag left or right to re-scale the tree";
    this.scale_drag_elem.appendChild(scale_drag_handle);

    var self = this;
    this.parent.appendChild(this.scale_drag_elem);
    $( this.scale_drag_elem ).draggable({
        axis: "x",
        drag: function( event, ui ) {
            self.tree_width = Math.max(0, ui.position.left);
            self.tree_parent.style.width = self.tree_width + "px";
            self.phylo_table.style.left = 
		( self.tree_width
		  + self.config.scale_drag_linewidth ) + "px";
            self.parent.style.width =
                ( self.tree_width
		  + self.config.scale_drag_linewidth
                  + ( self.config.cell_width
                      * column_descriptors.length ) ) + "px";
            self.tree.width_changed( self.tree_width );
        }
    });
}

tree_matrix.prototype.set_styles = function(css_string) {
    if( ! this._style_node ){
        head = document.getElementsByTagName('head')[0],
        this._style_node = document.createElement('style');
        this._style_node.type = 'text/css';
        head.appendChild(this._style_node);
    }

    if (this._style_node.styleSheet){
        this._style_node.styleSheet.cssText = css_string; // IE
    } else {
        while (this._style_node.firstChild) {
            this._style_node.removeChild(this._style_node.firstChild);
        }
        this._style_node.appendChild(document.createTextNode(css_string));
    }
};

})();
