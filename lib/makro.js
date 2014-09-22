/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require", "./marked",  "./directives-parser", "./directives", "./utils"], 
function(require, marked, directivesParser, directives, utils){

	var makro = function(src, opt){
		opt = opt || {};
		opt = marked.merge({}, marked.defaults, makro.opt, opt);
		return marked(src, opt || makro.opt);
	};

	//_________________________________________________________________________ 
	//_________________________________________________________________________ INLINE LEXER

	marked.InlineLexer.prototype.custom = function(src, out)
	{
		var cap;
		//_________________________________________________________________________________ DIRECT MACRO
		if (cap = this.rules.direct_macro.exec(src)) {
			src = src.substring(cap[0].length);
			var dir = [];
			src = directivesParser.directive(src, dir);
			dir = dir[0];
			out += this.renderer.inline_macro(dir, this.options);
			return { src:src, out:out };
		}
		//_________________________________________________________________________________ REPLACE MACRO
		if (cap = this.rules.replace_macro.exec(src)) {
			src = src.substring(cap[0].length);
			out += this.renderer.replace_macro(cap[1], this.options);
			return { src:src, out:out };
		}		
		return null;
	};
	marked.InlineLexer.prototype.customiseRules = function()
	{
		// customise native text rule
		this.rules.text = /^[\s\S]+?(?=[\\<!\[_*`]| {2,}\n|\{\{|@\.|$)/;
		// adding new rules
		this.rules.direct_macro = /^@\./;
		this.rules.replace_macro = /^\{\{\s*([^\n\r]*)(?=\}\})\}\}/;
	};


	//_________________________________________________________________________ 
	//_________________________________________________________________________ LEXER


	marked.Lexer.prototype.custom = function(src, top, bq)
	{
		//________________________________________________________________________________________ Direct MACROS
		// direct macro
		if (cap = this.rules.direct_macro.exec(src)) {
			src = src.substring(cap[0].length);
			var dir = [], content = "";
			src = directivesParser.directive(src, dir);
			cap = this.rules.endOfLine.exec(src);
			if(cap)
			{
				src = src.substring(cap[0].length);
				content = cap[0];
			}
			this.tokens.push({
				type: 'direct_macro',
				directives: dir,
				content:content
			});
			return { src:src, top:top, bq:bq };
		}
		//_________________________________________________________________________________ Raw MACRO
		// raw macro
		if (cap = this.rules.raw_macro.exec(src)) {
			src = src.substring(cap[0].length);
			var directives = directivesParser.analyse(src, this.rules.raw_directives_end);
			src = directives.src;
			cap = this.rules.raw_macro_end.exec(src);
			if(!cap)
				throw new Error("bad raw macro declaration : missing end of block.")
			src = src.substring(cap[0].length);
			var obj = {
				type: 'raw_macro',
				directives: directives.tokens,
				content:cap[1]
			};
			this.tokens.push(obj);
			return { src:src, top:top, bq:bq };
		}
		//________________________________________________________________________________________ BLOCK MACRO START
		// block_macro_start
		if (cap = this.rules.block_macro_start.exec(src)) {
			src = src.substring(cap[0].length);	
			var directives = directivesParser.analyse(src, this.rules.endBlockDirectives);
			if(!directives.tokens.length)
				throw new Error("bad block macro declaration : missing directives.")
			src = directives.src;
			this.tokens.push({
				type: 'block_macro_start',
				directives: directives.tokens
			});
			return { src:src, top:top, bq:bq };
		}
		//________________________________________________________________________________________ BLOCK MACRO END
		// block_macro_end
		if (cap = this.rules.block_macro_end.exec(src)) {
			src = src.substring(cap[0].length);
			this.tokens.push({
				type: 'block_macro_end',
			});
			return { src:src, top:top, bq:bq };
		}
		//________________________________________________________________________________________ REPLACE MACROS
		// replace macro
		if (cap = this.rules.replace_macro.exec(src)) {
			src = src.substring(cap[0].length);
			var obj = {
				type: 'replace_macro',
				text: cap[1]
			};
			this.tokens.push(obj);
			return { src:src, top:top, bq:bq };
		}
		return null;
	};
	marked.Lexer.prototype.customiseRules = function()
	{
		// customise paragraph from native rules
		this.rules.paragraph = /^\s*([\s\S]+?)(?=%\}|\n\n|$)/; 
		// adding new rules
		this.rules.block_macro_start = /^\s*\{%\s*/;
		this.rules.endBlockDirectives = /^\s*(\n|(%\}))/;
		this.rules.block_macro_end = /^\s*%\}\s*($|\n)/;
		this.rules.raw_macro = /^\s*\{\!\s*/;
		this.rules.raw_directives_end = /^\s*(\n|(\!\}))/;
		this.rules.raw_macro_end = /^\n?([\s\S]*?(?=\!\}))\!\}/;
		this.rules.replace_macro = /^\s*\{\{\s*([^\n]*)(?=\}\})\}\}/;
		this.rules.direct_macro = /^@\./;
		this.rules.endOfLine =/^[^\n]*/;

	};

	//_________________________________________________________________________ 
	//__________________________________________________________________ PARSER

	marked.Parser.prototype.custom = function(){
		switch (this.token.type) {
			case 'direct_macro':
				return this.renderer.block_macro(this.token.directives, this.token.content, this.options);
			case 'raw_macro':
				return this.renderer.block_macro(this.token.directives, this.token.content, this.options);
			case 'replace_macro':
				return this.renderer.replace_macro(this.token.text, this.options);
			case 'block_macro_start':
				var body = '';
				var toky = this.token,
					next = this.next();
				while (next && next.type !== 'block_macro_end') {
					body += this.tok();
					next = this.next();
				}
				if(!next)
					throw new Error("block macros not ended !");
				return this.renderer.block_macro(toky.directives, body, this.options);
	 	}
	 }

	//_________________________________________________________________________ 
	//_________________________________________________________________________ RENDERER
	//____________________________________________________________ BLOCK MACRO 
	marked.Renderer.prototype.block_macro = function(directives, content, options) {
		// console.log("render block macro : ", directives, content);
		//var res = (typeof content === 'undefined')?"":content;
		var res = (!content && content !== "")?"":content;
		for(var i = directives.length; --i >= 0;)
		{
			var dir = directives[i];
			var mcr = makro.getDirectives(dir.name, "block");
			if(!mcr)
				res = makro.directives.blockDefault(dir, res);
			else
				res = mcr(dir.args, res, options);
		}
		return res;
	};
	//_____________________________________________________________ DIRECT MACRO
	marked.Renderer.prototype.inline_macro = function(directive, options) {
		var mcr = makro.getDirectives(directive.name, "inline");
		if(!mcr)
			return makro.directives.inlineDefault(directive);
		else
			return mcr(directive.args, options);
	};
	//_____________________________________________________________ REPLACE MACRO 
	var trimSpace = /\s*$/;
	marked.Renderer.prototype.replace_macro = function(content, options) {
		var toRem = trimSpace.exec(content)[0].length;
		content = content.substring(0, content.length-toRem);
		if(options.context)
			return utils.fromPath(options.context, content);
		return '[(replaced)' + content + ']';
	};

	//_______________________________________________________________________ 
	//_______________________________________________________________________ COMPILE
	marked.compile = function(src, opt){
		try {
			opt = opt || {};
			opt = marked.merge({}, marked.defaults, makro.opt, opt);
			var tokens = marked.Lexer.lex(src, opt);
			return function(context){
				// console.log("tokens : ", tokens);
				opt.context = context;
				var tok = tokens.slice();
				tok.links = tokens.links;
				var res = marked.Parser.parse(tok, opt);
				return res;
			}
		} catch (e) {
			e.message += '\nPlease report this to https://github.com/chjj/marked.';
			if ((opt || marked.defaults).silent) {
				return '<p>An error occured:</p><pre>' + escape(e.message + '', true) + '</pre>';
			}
			throw e;
		}
	};

	//______________________________________________________________________________________

	makro.opt = {
	  renderer: new marked.Renderer(),
	  codespaces:false
	};
	marked.setOptions(makro.opt);

	makro.compile = marked.compile;
	makro.directives = directives;
	makro.getDirectives = function(name, type){
		var dir = makro.directives[name];
		if(!dir)
			return null;
		if(typeof dir === 'function')
			return dir;
		return dir[type] || null;
	};
	makro.setOptions = function(opt){
		marked.merge(makro.opt, opt);
		marked.setOptions(opt);
	};

	makro.marked = marked;
	return makro;
});
