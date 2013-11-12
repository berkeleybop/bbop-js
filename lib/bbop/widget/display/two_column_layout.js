/*
 * Package: two_column_layout.js
 * 
 * Namespace: bbop.widget.display.two_column_layout
 * 
 * Reusable object to create a two-column layout.
 * 
 * Subclass of <bbop.html.tag>.
 */

if ( typeof bbop == "undefined" ){ var bbop = {}; }
if ( typeof bbop.widget == "undefined" ){ bbop.widget = {}; }
if ( typeof bbop.widget.display == "undefined" ){ bbop.widget.display = {}; }

/*
 * Constructor: two_column_layout
 *
 * Produce a div containing a CSS hardwired two-column layout.
 * These are currently hardwired to:
 * 
 * : 'class': 'twocol-leftcolumn', 'style': 'margin-top: -15px;'
 * : 'class': 'twocol-content', 'style': 'margin-left: 26em; margin-top: -15px;'
 * 
 * Parameters:
 *  col1 - the string or <bbop.html> object for the left column
 *  col2 - the string or <bbop.html> object for the right column
 *
 * Returns:
 *  <bbop.html.tag> subclass
 */
bbop.widget.display.two_column_layout = function (col1, col2){
    bbop.html.tag.call(this, 'div', {'class': 'twocol-wrapper'});

    // Left (control) side.
    this._two_column_stack_left =
	new bbop.html.tag('div',
			  {'class': 'twocol-leftcolumn',
			   'style': 'margin-top: -15px;'},
			  col1);
    this.add_to(this._two_column_stack_left);

    // Right (display) side.
    this._two_column_stack_right =
	new bbop.html.tag('div',
			  {'class': 'twocol-content',
			   'style': 'margin-left: 26em; margin-top: -15px;'},
			  col2);
    this.add_to(this._two_column_stack_right);
};
bbop.widget.display.two_column_layout.prototype = new bbop.html.tag;

