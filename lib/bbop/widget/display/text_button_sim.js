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

bbop.core.require('bbop', 'core');
//bbop.core.require('bbop', 'logger');
bbop.core.require('bbop', 'html');
bbop.core.namespace('bbop', 'widget', 'display', 'text_button_sim');

/*
 * Method: text_button_sim
 * 
 * Generator for a text span for use for buttons.
 * 
 * Arguments:
 *  label - *[optional]* the text to use for the span or (defaults to 'X')
 *  title - *[optional]* the hover text (defaults to 'X')
 *  id - *[optional]* the id for the object (defaults to generate_id: true)
 * 
 * Returns:
 *  bbop.html.span
 */
bbop.widget.display.text_button_sim = function(label, title, id){
    
    // Default args.
    if( ! label ){ label = 'X'; }
    if( ! title ){ title = 'X'; }
    
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
    
    var obj = new bbop.html.span(label, args);    
    return obj;
};
