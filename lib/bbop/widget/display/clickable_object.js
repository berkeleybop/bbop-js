/*
 * Package: clickable_object.js
 * 
 * Namespace: bbop.widget.display.clickable_object
 * 
 * BBOP object to produce a clickable image or a clickable text span,
 * both producing something that can give its id for later clickable
 * actions.
 * 
 * This is a method, not a constructor.
 */

bbop.core.require('bbop', 'core');
//bbop.core.require('bbop', 'logger');
bbop.core.require('bbop', 'html');
bbop.core.namespace('bbop', 'widget', 'display', 'clickable_object');

/*
 * Method: clickable_object
 * 
 * Generator for a clickable object.
 * 
 * TODO: May eventually expand it to include making a jQuery button.
 * 
 * Arguments:
 *  label - *[optional]* the text to use for the span or label (defaults to '')
 *  source - *[optional]* the URL source of the image (defaults to '')
 *  id - *[optional]* the id for the object (defaults to generate_id: true)
 * 
 * Returns:
 *  bbop.html.span or bbop.html.image
 */
bbop.widget.display.clickable_object = function(label, source, id){
    //this._is_a = 'bbop.widget.display.clickable_object';
    //var anchor = this;
    // // Per-UI logger.
    // var logger = new bbop.logger();
    // logger.DEBUG = true;
    // function ll(str){ logger.kvetch('W (clickable_object): ' + str); }

    // Default args.
    if( ! label ){ label = ''; }
    if( ! source ){ source = ''; }

    // Decide whether we'll use an incoming id or generate our own.
    var args = {};
    if( id ){
	args['id'] = id;
    }else{
	args['generate_id'] = true;
    }

    // Figure out an icon or a label.
    var obj = null;
    if( source == '' ){
	obj = new bbop.html.span(label, args);
    }else{
	args['src'] = source;
	args['title'] = label;
	obj = new bbop.html.image(args);
    }

    return obj;
};
