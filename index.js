/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 * kroked : markdown with macros.
 *
 * Based on marked lexer/parser (https://github.com/chjj/marked).
 * 
 * Added in marked : block and inline macros with multiple directives management.
 *
 *
 * {% directive1(arg1, arg2) directive2(arg3, ..., ...) ...
 * 		content ...
 * %}
 * 
 * or
 * {! directive1(...) directive2(...) ...
 * 		raw content...
 * !}
 *
 * or (inline or block level)
 * @.directive(arg, ...)
 *
 * or (inline or block level)
 * {{ path.to.property }}
 *
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require", "./lib/makro"], 
function(require, makro){
	return makro;
});
