window.onload = function() {
    var r = new bbop.render.phylo.renderer('test0', true);
    var nodes = global_graph.nodes;
    var edges = global_graph.edges;
    console.log(nodes.length + " nodes");
    console.log(edges.length + " edges");

    for (var i = 0; i < nodes.length; i++) {
        r.add_node(nodes[i].id);
    }
    for (var i = 0; i < edges.length; i++) {
        r.add_edge(edges[i].sub, edges[i].obj, parseFloat(edges[i].meta));
    }

    r.use_animation = true;
    r.box_width = 115;
    r.box_height = 25;
    console.profile();
    r.display();
    console.profileEnd();
};
