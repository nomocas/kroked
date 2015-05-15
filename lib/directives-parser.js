/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * ultra fast directives DSL lexer/parser
 *
 * usage :
 *
 * var tokens = lexer.analyse(" hello world() blou-pi('zoo loo' ) loli.pop(40, true, foo) ", null, true).tokens;
 * 	==> [{"name":"hello"},{"name":"world"},{"name":"blou-pi","args":["zoo loo"]},{"name":"loli.pop","args":[40,true,"foo"]}]
 */
if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}
define([], function() {
	var lexer = {
		lexic: {
			whitespace: /^[^\S\n\r]+/,
			name: /^[^\s\(\n\r]*/,
			string: /^"([^"\\]*(\\.[^"\\]*)*)"|\'([^\'\\]*(\\.[^\'\\]*)*)\'/,
			"float": /^[0-9]*[.][0-9]+/,
			integer: /^[0-9]+/,
			bool: /^true/,
			directString: /^[^,\)]+/,
			separation: /^\s*,\s*/
		},
		innerRules: ["float", "integer", "boolean", "string", "directString"],
		whitespace: function(src) {
			var cap = this.lexic.whitespace.exec(src);
			if (cap)
				src = src.substring(cap[0].length);
			return src;
		},
		name: function(src, tokens) {
			var cap = this.lexic.name.exec(src);
			if (cap) {
				src = src.substring(cap[0].length);
				tokens.push({
					name: cap[0]
				});
				return src;
			}
			throw new Error("missing name : " + src);
		},
		"float": function(src, args, cast) {
			var cap = this.lexic["float"].exec(src);
			if (cap) {
				src = src.substring(cap[0].length);
				if (cast)
					args.push(parseFloat(cap[0], 10));
				else
					args.push(cap[0]);
				return src;
			}
			return false;
		},
		integer: function(src, args, cast) {
			var cap = this.lexic.integer.exec(src);
			if (cap) {
				src = src.substring(cap[0].length);
				if (cast)
					args.push(parseInt(cap[0], 10));
				else
					args.push(cap[0]);
				return src;
			}
			return false;
		},
		boolean: function(src, args, cast) {
			var cap = this.lexic.bool.exec(src);
			if (cap) {
				src = src.substring(cap[0].length);
				if (cast)
					args.push(cap[0] === 'true');
				else
					args.push(cap[0]);
				return src;
			}
			return false;
		},
		string: function(src, args) {
			var cap = this.lexic.string.exec(src);
			if (cap) {
				src = src.substring(cap[0].length);
				args.push(cap[0].substring(1, cap[0].length - 1));
				return src;
			}
			return false;
		},
		directString: function(src, args) {
			var cap = this.lexic.directString.exec(src);
			if (cap) {
				src = src.substring(cap[0].length);
				args.push(cap[0]);
				return src;
			}
			return false;
		},
		directive: function(src, tokens, cast) {
			src = this.name(src, tokens);
			src = this.whitespace(src);
			if (src[0] == '(')
				src = src.substring(1);
			else
				return src;
			src = this.whitespace(src);
			if (src[0] == ")") {
				src = src.substring(1);
				return src;
			}
			var token = tokens[tokens.length - 1],
				args = [],
				rules = this.innerRules;
			while (true) {
				var count = 0,
					res = false;
				while (res === false && count < rules.length) {
					res = this[rules[count++]](src, args, cast);
					if (res !== false)
						src = res;
				}
				res = this.lexic.separation.exec(src);
				if (!res)
					break;
				src = src.substring(res[0].length);
			}
			src = this.whitespace(src);
			if (!src[0] == ")")
				throw new Error("misformed directive : " + src);
			src = src.substring(1);
			token.args = args;
			return src;
		},
		analyse: function(src, endRegExp, cast) {
			var tokens = [],
				cap;
			endRegExp = endRegExp || false;
			src = this.whitespace(src);
			try {
				while (src) {
					src = this.directive(src, tokens, cast);
					if (endRegExp && (cap = endRegExp.exec(src)))
						break;
					src = this.whitespace(src);
				}
			} catch (e) {
				return e;
			}
			return {
				tokens: tokens,
				src: src
			};
		}
	};
	lexer.performance = function() {
		console.time("t");
		for (var i = 0; i < 10000; ++i)
			lexer.analyse(" hello world() blou-pi('zoo loo' ) loli.pop(40, true, foo) ", null, true);
		console.timeEnd("t");
	};
	//lexer.performance();
	return lexer;
});