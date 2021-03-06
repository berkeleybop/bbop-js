/*
 * Package: text_buttom_sim.js
 * 
 * Namespace: bbop.widget.display.text_button_sim
 * 
 * BBOP object to produce a clickable text span, that in conjunction with the local CSS, should make an awfully button looking creature.
 * 
 * It uses the class: "bbop-js-text-button-sim".
 * 
 * Note: this is a method, not a constructor.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }

/*
 * Method: text_button_sim
 * 
 * Generator for a text span for use for buttons.
 * 
 * Arguments:
 *  label - *[optional]* the text to use for the span or (defaults to 'X')
 *  title - *[optional]* the hover text (defaults to 'X')
 *  id - *[optional]* the id for the object (defaults to generate_id: true)
 *  add_attrs - *[optional]* more attributes to be folded in to the span as hash
 * 
 * Returns:
 *  bbop.html.span
 */
bbop.widget.display.text_button_sim = function(label, title, id, add_attrs){
    
    // Default args.
    if( ! label ){ label = 'X'; }
    if( ! title ){ title = 'X'; }
    if( ! add_attrs ){ add_attrs = {}; }
    
    // Decide whether we'll use an incoming id or generate our own.
    var args = {
	'class': "bbop-js-text-button-sim",
	'title': title
    };
    if( id ){
	args['id'] = id;
    }else{
	args['generate_id'] = true;
    }

    // Addtional optional atrributes and overrides.    
    args = bbop.core.merge(args, add_attrs);

    var obj = new bbop.html.span(label, args);    
    return obj;
};
