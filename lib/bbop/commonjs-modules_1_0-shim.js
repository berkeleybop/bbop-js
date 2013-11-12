
// If it looks like we're in an environment that supports CommonJS
// Modules 1.0, take the bbop namespace whole and export it. Otherwise
// (browser environment, etc.), take no action and depend on the
// global namespace.
if( typeof(exports) != 'undefined' ){
    exports.bbop = bbop;    
}

