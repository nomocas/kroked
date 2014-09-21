# kroked

Markdown with macros.

It defines :
* a meta-language parsed by [marked](https://github.com/chjj/marked) lexer/parser
* a proposition of language based on this meta-language

See [marked](https://github.com/chjj/marked) for config and basics usage.

If you want to play with the meta language : see [meta-language](#meta-language)

## kroked macros language

### substitution macros
The replace_macro simply looks in options if there is a 'context' property.
It seeks in it after property pointed by path provided between macros boundaries (i.e. {{ my.path.from.context }}) and returns it.

```javascript 
var kroked = require("kroked/index");
kroked("{{ address.zip }}", { context:{ address:{ zip:"1190" }}})
```
will return '1190'.

### Block macros

With :
```javascript
kroked.directives.myDirective = function(args, content, options)
{
	return args[0] + " : " + content.toUpperCase();
};
```
and this :
```
{% myTag myDirective( hello world )
	My content...
%}

```
It will output : `<myTag>hello world : MY CONTENT...</myTag>`

There is three things important to know : 
* either the directive name reflect a directive defined in kroked.directives, and it will be used to render the macros. (see below to defining such macros)
* either the directive name is "unknown" (there is no associated directive in kroked.directives), and then kroked produce a tag with the name of the unknown directive. (i.e.  `<myDirective>content</myDirective>`)
* directives are composed together, from right to left.

And obviously blocks could be embedded in other blocks, and blocks could contains any other macros rules.



#### Difference between parsed and raw block-macros 

Remarque : It comes from meta language itself.

```
{% myTag
__this is strong__ @.myOtherTag( my content )
%}
```
output : `<myTag><strong>this is strong</strong><myOtherTag>my content</myOtherTag></myTag>`

```
{! myTag
__this is strong__ @.myOtherTag( my content )
!}
```
output : `<myTag>__this is strong__ @.myOtherTag( my content )</myTag>`


## Compilation and reusability

Another addition to marked parser is that you could now compile markdown documents to reuse it several times.

```javascript
var kroked = require("kroked/index");	// load kroked : contains language definition
var template = kroked.compile("		{{ name }} says : @.hello(world)");
template({ name:"John" });
// will output <p>John says : <hello>world</hello></p>
```

## Table parsing.

You could combine raw macros and a small tab delimitted cells lines lexer to produce quickly any "table like" widgets.

```
{! table ( Nodejs specifics deepjs libraries )
autobahnjs		(restful thin server : middlewares (expressjs) + routing)

deep-shell		(sh & ssh chains and cli)

deep-nodejs		(nodejs related tools (restful fs, ...))
deep-mongo		(restful mongodb client)
deep-elastic  	(restful client : ok, index management : embryonnar, layered queries : to do)

deep-mail		(mails sender utilities)
!}
```

```javascript
kroked.directives.table = function(args, content, options){
	var lines = kroked.parseLinesCells(content, false);
	var output = "<table>\n";
	if(args && args[0])	// args[0] === table caption
		output += "<caption>"+args[0]+"</caption>\n";
	lines.forEach(function(cells){
		if(!cells.length)
		{
			output += "<tr></tr>\n";
			return;
		}
		output += "<tr>\n";
		cells.forEach(function(cell){
			output += "<td>"+cell+"</td>";
		});
		output += "\n</tr>\n";
	})
	output  += "</table>\n";
	return output;
}
```


## Meta-language

Remarque : "Block" and "inline" refer to concepts related to markdown. A "block" start line without any spaces (or tabulations), as heading (i.e. # this is title), and couldn't be mixed with other on the same line. For inline object, the line could start with spaces, could contains several lexems, and the line and its following (not blank) are wrapped by a paragraph (p tag).

See [marked](https://github.com/chjj/marked) for basics concepts.


### Block macros

#### block macro (with parsed content)

```
{% myDirective(arg1, ...) mySecondDirective(arg, ...) myThirdDirective ...
	any content that will be parsed before injection in block (so any markdown or macros will be parsed).
%}
```

#### raw macro (content are not parsed)

```
{! myDirective(arg1, ...) mySecondDirective(arg, ...) ...
	any content that will be kept "as this" (raw) before injection in block
!}
```

#### direct macro. 

When use in front of line (i.e. should start line without spaces or tabulations), any following string until end of line will be used as content.

`@.myDirective(arg, ...)  content...`

#### substitution macro

`{{ theVar.to.be.substitute }}`

### Inline macros

#### direct macro
`@.myDirective(arg, ..., content)`

#### substitution macro
`{{ theVar.to.be.substitute }}`

### Directives format

Any directive could have parenthesis with arguments.
Parenthesis and args are optional.

e.g: `hello` or  `hello()` or  `hello(arg, ...)`  are valid.

Any argument could be string (e.g. "something..."), float, integer or direct string (delimitter is '\n' or ')' or ',')

e.g. : myDirectives("my string...", 12, 34.890, this is a direct string)


## Defining a language
	
By using the custom marked parser directly (kroked/lib/marked.js), you could define a language, based on this macros meta-language.

For this, you simply define 3 render methods that receive the directive(s), the eventual content and the options provided while parsing.

examples with "kroked/lib/directives-parser":
```javascript 
var marked = require("kroked/lib/marked"), // load custom marked parser (no macros language defined)
	renderer = new marked.Renderer();

renderer.block_macro = function(directives, content, options) {
	// directives is array : [{ name:"myDirective", args:[...] }, ...]
	// content is the one provided between macros boundaries (or after block direct macros)
	// options is an object that you provide when parsing

	return "<div>"+JSON.stringify(directives)+" - "+content+"<div>";
};
//________________________________________________________________________ DIRECT MACRO
renderer.inline_macro = function(directive, options) {
	// directive is a single directive : { name:"myDirective", args:[...] }
	// options is an object that you provide when parsing
	
	return "<div>"+JSON.stringify(directives)+"<div>";
};
//_________________________________________________________________________ REPLACE MACRO 
renderer.replace_macro = function(content, options) {
	// content is the one provided between macros boundaries
	// options is an object that you provide when parsing

	return "<div>"+content+"<div>";
};

var opt = {
	renderer: renderer,
	gfm: true,
	tables: true,
	breaks: false,
	pedantic: false,
	sanitize: false,
	smartLists: true,
	smartypants: false,

	codespaces:false	// disable markdown rules : every line starting with 4 spaces (or more) or tab(s) are code
};

kroked("# hello\n\n{{ to.replace }}", opt);

```

## Remarque

The language and the meta-language proposed there is a base for future reflexions.
It is already greatfuly usable, but as it want to be opened, lot of things are possible...
If you want to contribute, you're welcome...;)

## Licence

LGPL 3.0
