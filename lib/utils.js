/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require"], function(require){
		//_______ UTILS

	var fromPath = function(object, path){
		var parts = path.split(".");
		var tmp = object;
		while (parts.length > 1) {
			var part = parts.shift();
			if (!tmp[part])
				return undefined;
			tmp = tmp[part];
		}
		if (tmp)
			return tmp[parts.shift()];
		else return undefined;
	};
	var cellDelimitter = /^([^\n]+?)(?=\s{4,}|\n)(?:(\s{4,})?)/;

	/**
	 * Parse tab delimitted lines from string. usefull for raw macros and table like widgets rendering.
	 * @param  {String} src        the content block to parse until the end.
	 * @param  {Boolean} skipBlanck optional. if true, skip blank lines.
	 * @return {Array}            Parsed lines. Array of cells array. i.e. lines[2][3] gives you third cell of second line.
	 */
	var parseLinesCells = function(src, skipBlanck){
		var tokens = [], cells, cap;
		while(src)
		{
			cells = [];
			while(cap = cellDelimitter.exec(src))
			{
				src = src.substring(cap[0].length);
				cells.push(cap[1]);
			}
			if(cells.length || !skipBlanck)
				tokens.push(cells);
			// src should start now with \n or \r
			src = src.substring(1);
		}
		return tokens;
	};

	return {
		fromPath:fromPath,
		parseLinesCells:parseLinesCells
	}
});