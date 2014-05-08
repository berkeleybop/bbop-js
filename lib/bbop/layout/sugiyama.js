/* 
 * Package: sugiyama.js
 * 
 * Namespace: bbop.layout.sugiyama
 * 
 * Purpose: Sugiyama system.
 * 
 * TODO: /Much/ better documentation. I have no idea what's going on
 * in there anymore...will try to recover what I can.
 * 
 * TODO: Matrix implementation and partition->matrix step need to be
 * tightened.
 *
 * TODO: Switch strange for-loops to bbop.core.each.
 *
 * BUG: need to check if there are no edges.
 * 
 * Actually, maybe there should be a separate render section, as this
 * is just a normal graph really?
 */

// Module and namespace checking.
if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.layout == "undefined" ){ bbop.layout = {}; }
if ( typeof bbop.layout.sugiyama == "undefined" ){ bbop.layout.sugiyama = {}; }

// Speciality variables in the namespace.
//bbop.layout.sugiyama.DEBUG = true;
bbop.layout.sugiyama.DEBUG = false;
bbop.layout.sugiyama.iterations = 10;

///
/// Defined some special in-house objects for helping figure out
/// the layout.
///

// Id, level, and whether it is real or not.
bbop.layout.sugiyama.simple_vertex = function(in_id, is_virtual){

    var vid = in_id;
    this.is_virtual = false;
    this.level = null;
    
    if( is_virtual ){
	this.is_virtual = true;
    }
    
    this.id = function(){
	return vid;
    };  
};

// An edge. A pair of ids and virtual_p.
bbop.layout.sugiyama.simple_edge = function( sub, obj, is_virtual ){

    var subject = sub;
    var object = obj;
    this.is_virtual = false;
    //var predicate = pred;
    
    //var is_virtual = false;
    //if( in_type ){
    //  is_virtual = true; }
    
    if( is_virtual ){
	this.is_virtual = true;
    }
    
    this.subject = function(){
	return subject;
    };
    
    this.object = function(){
	return object;
    };
    
    this.id = function(){
	return subject + '^' + object;
    };
    
    //this.predicate = function(){
    //  return predicate; };
};

/*
 * Wrapper for the recursive partitioner and partition object.
 * 
 * Partitions the graph into a layer cake of nodes, adds in the
 * necessary virtual nodes to make path routing work.
 */
bbop.layout.sugiyama.partitioner = function(graph){
    //bbop.layout.sugiyama.partitioner = function(graph, rel){
    
    // Internal logger.
    var logger = new bbop.logger("Partitioner");
    logger.DEBUG = bbop.layout.sugiyama.DEBUG;
    function ll(str){ logger.kvetch(str); }
    // Warning logger.
    var yikes = new bbop.logger("Partitioner WARNING");
    function warn_me(str){ yikes.kvetch(str); }


    // Aliases.
    var each = bbop.core.each;

    // Make use lexical scoping.
    var first_seen_reference = {};
    var last_seen_reference = {};
    var vertex_set = {};
    var edge_set = {};
    var vertex_partition_set = {};
    var edge_partition_set = {};
    var logical_paths = [];
    var maximum_partition_width = 0;
    var number_of_partitions = 0;

    // Dump partition.
    this.dump = function(){

	// Dump vertex partitions.
	var num_parts = 0;
	for( var key in vertex_partition_set ){
	    num_parts++;
	}
	for( var i = 0; i < num_parts; i++ ){
	    ll('Vertex Partition ' + i + ':');

	    var curr_part = vertex_partition_set[ i ];
	    var out = [];
	    for( var j = 0; j < curr_part.length; j++ ){
		out.push('[' + curr_part[j].id() + ']');
	    }
	    ll(out.join(''));
	}

	// Dump edge partitions.
	num_parts = 0;
	for( var key in edge_partition_set ){
	    num_parts++;
	}
	for( var i = 0; i < num_parts; i++ ){
	    ll('Edge Partition ' + i + ':');
	    var curr_part = edge_partition_set[ i ];
	    var out = [];
	    for( var j = 0; j < curr_part.length; j++ ){
		out.push('[' + curr_part[j].id() + ']');
	    }
	    ll(out.join(''));
	}

	// Dump paths list.
	for( var i = 0; i < logical_paths.length; i++ ){
	    ll('Path ' + i + ':');
	    var out = [];
	    for( var l = 0; l < logical_paths[i].length; l++ ){
		out.push( logical_paths[i][l] );
	    }
	    ll(out.join(', '));
	}
    };

    //
    this.max_partition_width = function(){
	return maximum_partition_width;
    };

    // Return the number of partitions.
    this.number_of_vertex_partitions = function(){
	return number_of_partitions;
    };

    // Return a partition.
    this.get_vertex_partition = function(integer){
	return vertex_partition_set[ integer ];
    };

    // Return the number of partitions.
    this.number_of_edge_partitions = function(){
	var i = 0;
	for( var key in edge_partition_set ){ i++; }
	return i;
    };

    // Return a partition.
    this.get_edge_partition = function(integer){
	return edge_partition_set[ integer ];
    };

    // Return the number of paths.
    this.number_of_logical_paths = function(){
	return logical_paths.length;
    };

    // Return the paths list.
    //this.get_logical_paths = function(integer){
    this.get_logical_paths = function(integer){
	return logical_paths;
    };

    // // Define the partitioner. Recursively walk the graph. BFS.
    // //function recursivePartitioner(graph, node, relation, level){
    // function recursivePartitioner(graph, node, level){
	
    // 	var curr_level = level;
    // 	var next_level = level +1;

    // 	ll("Saw " + node.id() + " at level " + level + "!");

    // 	// Have we seen it before or is it new?
    // 	var was_seen = false;
    // 	if( ! vertex_set[ node.id() ] ){

    // 	    // Create new vertex and add to set.
    // 	    var new_vertex = new bbop.layout.sugiyama.simple_vertex(node.id());
    // 	    new_vertex.level = level;
    // 	    vertex_set[ new_vertex.id() ] = new_vertex;

    // 	    // Check the node in to the 'seen' references.
    // 	    first_seen_reference[ new_vertex.id() ] = level;
    // 	    last_seen_reference[ new_vertex.id() ] = level;

    // 	}else{

    // 	    if( first_seen_reference[ node.id() ] > level ){
    // 		first_seen_reference[ node.id() ] = level;
    // 	    }
    // 	    if( last_seen_reference[ node.id() ] < level ){
    // 		last_seen_reference[ node.id() ] = level;
    // 	    }

    // 	    was_seen = true;
    // 	}
	
    // 	// Get all the child nodes and down we go!
    // 	//var child_nodes = graph.getExtantChildren(node.id(), relation);
    // 	var child_nodes = graph.get_child_nodes(node.id());
    // 	// TODO: Better way?
    // 	//var child_nodes = graph.getChildren(node.id(), relation);
    // 	for( var i = 0; i < child_nodes.length; i++ ){
    // 	    // Add edge and descend.
    // 	    var new_edge =
    // 		new bbop.layout.sugiyama.simple_edge(child_nodes[i].id(),
    // 						    node.id());
    // 	    edge_set[ new_edge.id() ] = new_edge;

    // 	    // Do not recur on seen nodes.
    // 	    if( ! was_seen ){
    // 		//recursivePartitioner(graph, child_nodes[i], relation, level +1);
    // 		recursivePartitioner(graph, child_nodes[i], level +1);
    // 	    }
    // 	}
    // }
    
    // Detect a cycle by seeing if the ID in question appears in the
    // search history stack.
    // TODO/BUG: make this less hyper-dumb and/or slow.
    function _cycle_p(node, stack){
	var ret = false;

	var id = node.id();
	each(stack,
	     function(item){
		 if( item == id ){
		     ret = true;
		 }
	     });

	return ret;
    }

    // Add a new node to the global variables.
    function _new_node_at(bnode, level){

	ll("adding " + bnode.id() + " at level " + level + "!");

	// Create new vertex and add to set.
	var new_vertex = new bbop.layout.sugiyama.simple_vertex(bnode.id());
	new_vertex.level = level;
	vertex_set[ new_vertex.id() ] = new_vertex;
	
	// Check the node in to the 'seen' references.
	first_seen_reference[ new_vertex.id() ] = level;
	last_seen_reference[ new_vertex.id() ] = level;		 
    }

    // Define the partitioner. Recursively walk the graph. BFS.
    //function recursivePartitioner(graph, node, relation, level){
    function recursivePartitioner(graph, node, call_stack){
	
	var curr_level = call_stack.length -1;
	var next_level = curr_level +1;

	ll("recur on " + node.id() + " at level " + curr_level);

	// Get children and see where there are.
	//var child_nodes = graph.get_child_nodes(node.id(), relation);
	var child_nodes = graph.get_child_nodes(node.id());
	ll(node.id() + " has " + (child_nodes.length || 'no' ) + ' child(ren)');
	for( var i = 0; i < child_nodes.length; i++ ){
	    var cnode = child_nodes[i];

	    ll("looking at " + cnode.id());

	    if( _cycle_p(cnode, call_stack) ){
		ll('no update to ' + cnode.id() + ': cycle');
	    }else{

		// Add edges--safe since they're definition-based and will
		// clobber if they're already in.
		var new_edge =
		    new bbop.layout.sugiyama.simple_edge(cnode.id(), node.id());
		edge_set[ new_edge.id() ] = new_edge;

		// Nodes we have to be a little more careful with since
		// they're what we're using for traversal.
		if( ! vertex_set[ cnode.id() ] ){
		
		    // Create new vertex and add to set.
		    _new_node_at(cnode, next_level);
		    
		    // Since it is a new node, we traverse it.
		    ll('cs (a): ' + call_stack);
		    var new_cs = bbop.core.clone(call_stack);
		    ll('cs (b): ' + new_cs);
		    new_cs.push(cnode.id());
		    ll('cs (c): ' + new_cs);
		    recursivePartitioner(graph, cnode, new_cs);
		    
		}else{
		    
		    ll('to update ' + cnode.id() + ' level to ' + next_level +
		       '; fsr: '+ first_seen_reference[ cnode.id() ] +
		       '; lsr: '+ last_seen_reference[ cnode.id() ]);
		    
		    // Otherwise, just update the levels that we've seen
		    // the child at--do not descend.
		    if( first_seen_reference[ cnode.id() ] > next_level ){
			first_seen_reference[ cnode.id() ] = next_level;
		    }
		    if( last_seen_reference[ cnode.id() ] < next_level ){
			last_seen_reference[ cnode.id() ] = next_level;
			// LSR is also the level that things will
			// appear at, so update.
			// I believe node and simple node IDs are the same?
			vertex_set[ cnode.id() ].level = next_level;

			// Recur if the LSR has change--we need to
			// update all of the nodes below.
			ll('cs (a): ' + call_stack);
			var new_cs = bbop.core.clone(call_stack);
			ll('cs (b): ' + new_cs);
			new_cs.push(cnode.id());
			ll('cs (c): ' + new_cs);
			recursivePartitioner(graph, cnode, new_cs);
		    }

		    // ll('updated ' + cnode.id() + ' level to ' + next_level +
		    //    '; fsr: '+ first_seen_reference[ cnode.id() ] +
		    //    '; lsr: '+ last_seen_reference[ cnode.id() ]);
		}
	    }
	}
    }
    
    // Run the partitioner after getting the root values (or whatever)
    // bootstrapped in.
    //var roots = graph.get_root_nodes(rel);
    var roots = graph.get_root_nodes();
    if( roots.length > 0 ){
	//partitionerBootstrap(roots);
	for( var i = 0; i < roots.length; i++ ){
	    _new_node_at(roots[i], 0);
	    recursivePartitioner(graph, roots[i], [roots[i].id()]);
	}
    }else{
    	// If there is no root (think of a "top-level" cycle),
    	// a node should be picked randomly.
    	// TODO: Test this.
    	var a_node = graph.all_nodes()[0] || null;
    	if( ! a_node ){
    	    ll('warning: apparently the graph is empty');
    	    //throw new Error('apparently the graph is empty--stop it!');
    	}else{
	    _new_node_at(a_node, 0);
    	    recursivePartitioner(graph, a_node, [a_node.id()]);
    	}
    }

    // Now we have a listing of the first and last level that a node
    // appears at. We'll go through and make a proper ordering. We know
    // that the last seen reference is where the actual node will
    // appear. If there is a difference with the listing in the first
    // node reference, the difference will be made in virtual nodes.
    var v_id = 0;
    for( var key in edge_set ){
	var edge = edge_set[ key ];

	var difference = vertex_set[ edge.subject() ].level -
	    vertex_set[ edge.object() ].level;
	ll('diff for '+edge.subject()+' -> '+edge.object()+' = '+ difference);
	ll('   ' + vertex_set[ edge.subject() ].level + '-' +
	   vertex_set[ edge.object() ].level);

	// If there is a difference, create virtual nodes and
	// paths. Deleted used edges.
	var new_path = [];
	if( difference > 1 ){
	    
	    // Create a new chain of virtual nodes.
	    var current_subject = edge.object();
	    var current_object = null;
	    var current_level = vertex_set[ edge.object() ].level; 
	    new_path.push(edge.object());
	    for( var i = 1; i <= difference; i++ ){

		current_object = current_subject;
		current_level++;

		if( i != difference ){
		    // Make a virtual node.
		    var v_node_id = '_VN_' + v_id + '_';
		    v_id++;	
		    var new_v_node =
			new bbop.layout.sugiyama.simple_vertex(v_node_id, true);
		    new_v_node.level = current_level;
		    vertex_set[ new_v_node.id() ] = new_v_node;
		    current_subject = new_v_node.id();
		    new_path.push(new_v_node.id());
		}else{
		    // Last link and path step.
		    current_subject = edge.subject();
		    new_path.push(edge.subject());
		}

		// Make edge to virtual node.
		var new_edge =
		    new bbop.layout.sugiyama.simple_edge(current_subject,
							current_object, true);
		edge_set[ new_edge.id() ] = new_edge;	
	    }

	    // Since the node generator goes in reverse order.
	    new_path.reverse();

	    // Finally, delete the edge connecting these two--no longer needed.
	    delete( edge_set[ key ] );

	}else{
	    // Add the trival path.
	    new_path.push(edge.subject());
	    new_path.push(edge.object());
	}
	// Add our new path to the group.
	logical_paths.push(new_path);
    }

    // Sort the vertices into different partitions and count them.
    for( var key in vertex_set ){
	var vert = vertex_set[ key ];
	var lvl = vert.level;
	if( ! vertex_partition_set[ lvl ] ){
	    vertex_partition_set[ lvl ] = [];
	    number_of_partitions++; // Count the number of partitions.
	}
	vertex_partition_set[ lvl ].push(vert);
	// Count max width.
	if( vertex_partition_set[ lvl ].length > maximum_partition_width ){
	    maximum_partition_width = vertex_partition_set[ lvl ].length;
	}
    }

    // Sort the edges into different partitions. Made easier since the
    // vertices have already been sorted.
    for( var key in edge_set ){

	var edge = edge_set[ key ];
	var lvl = vertex_set[ edge.object() ].level;
	ll('l:' +lvl);
	if( ! edge_partition_set[ lvl ] ){
	    edge_partition_set[ lvl ] = [];
	}
	edge_partition_set[ lvl ].push(edge);
    }
};

// Takes arrays of vertices and edges as an argument. Edges must have
// the methods '.object()' and '.subject()' and Vertices must have
// method '.id()'.
bbop.layout.sugiyama.bmatrix = function(object_vertex_partition,
					subject_vertex_partition,
					edge_partition){
    
    // Internal logger.
    var logger = new bbop.logger("BMatrix");
    logger.DEBUG = bbop.layout.sugiyama.DEBUG;
    function ll(str){ logger.kvetch(str); }
    // Warning logger.
    var yikes = new bbop.logger("BMatrix WARNING");
    function warn_me(str){ yikes.kvetch(str); }

    var relation_matrix = {};
    // var object_vector = object_vertex_partition;
    // var subject_vector = subject_vertex_partition;
    var object_vector = object_vertex_partition || [];
    var subject_vector = subject_vertex_partition || [];
    // Still warn that there is an issue.
    if( ! object_vector || ! subject_vector ){
	warn_me('WARNING: We found an instance of: https://github.com/kltm/bbop-js/issues/23; using a workaround.');
    }

    for( var i = 0; i < edge_partition.length; i++ ){

	var obj_id = edge_partition[i].object();
	var sub_id = edge_partition[i].subject();

	//
	if( ! relation_matrix[ obj_id ] ){
	    relation_matrix[ obj_id ] = {}; }
	//if( ! relation_matrix[ sub_id ] ){
	//  relation_matrix[ sub_id ] = {}; }

	relation_matrix[ obj_id ][ sub_id ] = true;
	//relation_matrix[ sub_id ][ obj_id ] = false;
    }

    // DEBUG relation matrix:
    // BUG: subject _vector occasionally undefined
    for( var m = 0; m <= object_vector.length -1; m++ ){
	ll("obj: <<o: " + object_vector[m].id() + ">>"); }
    for( var n = 0; n <= subject_vector.length -1; n++ ){
	ll("sub: <<o: " + subject_vector[n].id() + ">>"); }
    for( ob in relation_matrix ){
	for( su in relation_matrix[ ob ] ){
	    ll("edge: <<o: " + ob + ", s: " + su + ">>");
	}
    }

    //
    function getObjectBarycenter(object){
	var weighted_number_of_edges = 0;
	var number_of_edges = 0;
	for( var s = 1; s <= subject_vector.length; s++ ){
	    if( relation_matrix[object.id()] &&
		relation_matrix[object.id()][subject_vector[s -1].id()]){
		weighted_number_of_edges += s;
		number_of_edges++;
	    }
	}
	// The '-1' is to offset the indexing.
	return ( weighted_number_of_edges / number_of_edges ) -1;
    };

    // Gets barycenter for column s.
    function getSubjectBarycenter(subject){

	var weighted_number_of_edges = 0;
	var number_of_edges = 0;
	for( var o = 1; o <= object_vector.length; o++ ){
	    if( relation_matrix[object_vector[o -1].id()] &&
		relation_matrix[object_vector[o -1].id()][subject.id()]){
		weighted_number_of_edges += o;
		number_of_edges++;
	    }
	}
	// The '-1' is to offset the indexing.
	return ( weighted_number_of_edges / number_of_edges ) -1;
    };

    // BUG: These damn things seem to reoder on equal--want no reorder
    // on equal. Reorder objects given B1 <= B2, where Bi is the
    // barycenter weight.
    this.barycentricObjectReorder = function(){  
	object_vector.sort(
	    function(a,b){
		return getObjectBarycenter(a)
		    - getObjectBarycenter(b);
	    });
    };

    // BUG: These damn things seem to reoder on equal--want no reorder
    // on equal. Reorder subjects given B1 <= B2, where Bi is the
    // barycenter weight.
    this.barycentricSubjectReorder = function(){
	subject_vector.sort(
	    function(a,b){
		return getSubjectBarycenter(a)
		    - getSubjectBarycenter(b);
	    });
    };
    
    // Display the stored matrix.
    this.dump = function(){
	
	var queue = [];
	var string = null;

	//ll('o:' + object_vector);
	//ll('s:' + subject_vector);

	// Print top row.
	for( var i = 0; i < subject_vector.length; i++ ){
	    queue.push(subject_vector[i].id());
	}
	string = queue.join('\t');
	ll('o\\s\t' + string );

	// Print remainder.
	for( var j = 0; j < object_vector.length; j++ ){
	    queue = [];
	    queue.push(object_vector[j].id());
	    //ll("_(o: " + object_vector[j].id() + ")");
	    for( var k = 0; k < subject_vector.length; k++ ){
		//ll("_(o: "+object_vector[j].id() +", s: "+subject_vector[k].id()+")");
		//ll("(j: " + j + " k: " + k + ")");
		if( relation_matrix[object_vector[j].id()] &&
		    relation_matrix[object_vector[j].id()][subject_vector[k].id()] ){
			queue.push('(1)');
		    }else{
			queue.push('(0)');
		    }
	    }
	    ll(queue.join('\t'));
	}
    };
};

// Takes a graph.
// Can be queried for the position of every node and edge.
// GraphLayout = {};
// GraphLayout.Sugiyama = function
bbop.layout.sugiyama.render = function(){
    //bbop.layout.graph.call(this);
    this._is_a = 'bbop.layout.sugiyama.render';

    // Get a good self-reference point.
    var anchor = this;

    // Internal logger.
    var logger = new bbop.logger("SuGR");
    logger.DEBUG = bbop.layout.sugiyama.DEBUG;
    function ll(str){ logger.kvetch(str); }
    // Warning logger.
    var yikes = new bbop.logger("SuGR WARNING");
    function warn_me(str){ yikes.kvetch(str); }

    //
    //this.layout = function(graph_in, rel){
    this.layout = function(graph_in){
    //this.layout = function(){
	
	///
	/// Step I: Make a proper hierarchy; partition the graph over
	/// 'is_a'.
	///
	
	//var partitions = new bbop.layout.sugiyama.partitioner(g, 'is_a');
	//var partitions = new bbop.layout.sugiyama.partitioner(graph_in, rel);
	var partitions = new bbop.layout.sugiyama.partitioner(graph_in);
	//var partitions = new bbop.layout.sugiyama.partitioner(anchor);

	// DEBUG:
	ll('Dump paritions:');
	partitions.dump();
	ll('');

	///
	/// Step II: Reduce number of crossings by vertex permutation.
	///

	var edge_partitions = [];
	var vertex_partitions = [];

	// BUG: Need to catch num_partitions < 2 Create an instatiation of
	// all of the matrix representations of the partitions.
	for( var i = 0; i < partitions.number_of_edge_partitions(); i++ ){
	    var epart = partitions.get_edge_partition(i);
	    if( ! epart ){
	    	throw new Error('null edge partition at level: ' + i);
	    }else{
		edge_partitions.push(epart);
	    }
	}

	//
	for( var i = 0; i < partitions.number_of_vertex_partitions(); i++ ){
	    var vpart = partitions.get_vertex_partition(i);
	    if( ! vpart ){
	    	throw new Error('null vertex partition at level: ' + i);
	    }else{
		vertex_partitions.push(vpart);
	    }
	}  
	
	//
	for( var i = 0; i < edge_partitions.length; i++ ){
	    var m = new bbop.layout.sugiyama.bmatrix(vertex_partitions[i],
						     vertex_partitions[i +1],
						     edge_partitions[i]);
	    
	    ll('Matrix: ' + i);
	    m.dump();
	    ll('');
	    
	    // TODO: Can increase the number of iterations--the paper doesn't
	    // really explain this.
	    for( var k = 0; k < bbop.layout.sugiyama.iterations; k++ ){
		m.barycentricObjectReorder();
		m.barycentricSubjectReorder();
	    }

	    ll('Matrix: ' + i);
	    m.dump();
	    ll('');
	}

	///
	/// Step III: give proper integer X and Y positions: suspend
	/// them in a matrix.
	///

	// Create matrix for calculating layout.
	var layout_matrix = [];
	for( var i = 0; i < vertex_partitions.length; i++ ){
	    layout_matrix.push(new Array(partitions.max_partition_width()));
	}
	
	// Populate matrix and register final locations of nodes for later.
	// TODO: Sugiyama method. Temporarily did naive method.
	var real_vertex_locations = [];
	var vertex_registry = {};
	var virtual_vertex_locations = []; // 
	var m = partitions.max_partition_width();
	for( var i = 0; i < vertex_partitions.length; i++ ){
	    var l = vertex_partitions[i].length;
	    for( var v = 0; v < l; v++ ){
		var locale = Math.floor( (v+1) * (m/l/2) );
		while( layout_matrix[i][locale] ){
		    locale++;
		}
		var vid = vertex_partitions[i][v].id();
		layout_matrix[i][locale] = vid;
		vertex_registry[ vid ] = {x: locale, y: i};
		if( ! vertex_partitions[i][v].is_virtual ){
		    real_vertex_locations.push({x: locale, y: i, id: vid});
		}else{
		    virtual_vertex_locations.push({x: locale, y: i, id: vid});
		}
		ll( vid + ', x:' + locale + ' y:' + i);
	    }
	}
	
	// Convert logical paths to actual paths.
	var logical_paths = partitions.get_logical_paths();
	var described_paths = [];
	for( var i = 0; i < logical_paths.length; i++ ){
	    var node_trans = [];
	    var waypoints = [];
	    for( var j = 0; j < logical_paths[i].length; j++ ){
		var cursor = logical_paths[i][j];
		node_trans.push(cursor);
		waypoints.push({x: vertex_registry[cursor].x,
				y: vertex_registry[cursor].y });
	    }
	    described_paths.push({'nodes': node_trans,
				  'waypoints': waypoints});
	}
	
	// Create a return array 
	// DEBUG:
	//   ll('Layout:');
	//   for( var i = 0; i < layout_matrix.length; i++ ){
	//     var out = [];
	//     for( var j = 0; j < layout_matrix[i].length; j++ ){
	//       out.push(layout_matrix[i][j]);
	//     }
	//     ll(out.join('\t'));
	//   }
	//   ll('');
	
	// Return this baddy to the world.
	return { nodes: real_vertex_locations,
		 virtual_nodes: virtual_vertex_locations,
		 paths: described_paths,
		 height: partitions.max_partition_width(),
		 width: partitions.number_of_vertex_partitions()};
    };
};
//bbop.core.extend(bbop.model.sugiyama.graph, bbop.model.graph);
