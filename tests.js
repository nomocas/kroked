/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 * TODO : write real tests.
 */
 
if (typeof define !== 'function') {
    var define = require('amdefine')(module);
}
define(["require", "./index"], function(require, kroked){
	var string = [
		'# hello',
		'',
		'@.small hello world',
		'',
		'	@.small(" hello world ")',
		'',
	    '<small> hello </small>',
	    '<small>`hello`</small>',
		'',
	    '{% section inner ',
	    '	{% reu',
	    '		# hihi',
	    '',
	    '		<p> <small> hello  {{ title }}  </small>@.capitilize(doo) `hello`</p>',
	    '',
	    '	%}',
	    '%}',
	    '',
	    '	@.hello(____fast is not enough____ )',
	    '',
	    '{%  block_inline(fzejkfezl) context(name) %}',
	    '{! raw_inline(raw_inline) !}',
	    '',
	    '	{! rawWithTab(raw) capitilize',
	    '		raw text',
	    '		# hjhjd',
	    '	!}',
	    '',
	    '__this is bold__',
	    '',
	    '{{ name }}',
	    '{% dp-try(json::/...)  %}',
	    ''
	].join('\n');

	string = string + "\n" + string + "\n" + string;

	kroked.perf = function(){
		var template, r;

		console.time("t");
		// for(var i = 0; i < 100; ++i)
			 template = marked.compile(string, marked.opt);
		console.timeEnd("t");


		console.time("t2");
		// for(var i = 0; i < 100; ++i)
			r = template({ name:"john", title:"hello macros"});
		console.timeEnd("t2");
		//console.log(r);
	};

});