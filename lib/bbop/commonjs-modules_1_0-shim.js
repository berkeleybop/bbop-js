
// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, take the bbop namespace whole and export it. Otherwise
// (browser environment, etc.), take no action and depend on the
// global namespace.
if( typeof(exports) != 'undefined' ){

    // Old style--exporting separate namespace.
    exports.bbop = bbop;

    // New, better, style--assemble; these should not collide.
    bbop.core.each(bbop, function(k, v){
	exports[k] = v;
    });
}

