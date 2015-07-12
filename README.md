# blcode
blcode is a library to generate an HTML renderer for BBCode-like lightweight markup languages.

# Usage
To create a renderer, you simply pass a path to your description file to `makeRenderer`
```
var blcode = require("blcode");
var renderer = blcode.makeRenderer("path/to/description.json");
```

Creating a renderer is synchronous, and it is intended to be called at startup.

Render with `renderer.render(input)`

Rendering is asynchronous, and returns a promise:
```
renderer.render(input).then(function(output) {
  // Do something with the output
}).error( function(error) {
  // Handle the erro
});
```

Parsing is done by PEG.js, and so if the input cannot be parsed, PEG.js errors will be generated

# Language Input
The language input is similar to BBCode. Using the below example language description (see the Language Description section), we could have the input:

```
This is some plain text

[b]This is some bold text[/b]

[img src="picture.png"]

[code]
This is some code
[/code]
```

And the resulting output would be:
```
This is some plain text<br><br><b>This is some bold text</b><br><br><img src=picture.png><br><br><div class='code'><pre>This is some code<br></pre></div>
```

Some notes to keep in mind that are true of input regardless of the description used to generate the renderer:
- Newlines in input are replaced with `<br>`, the exception being the first new line after the open tag of either an `"OpenClose"` element or a `"LeafOpenClose"` element.
- You can nest tag elements such as `[b]Some bold text. [i]Some bold and italic text.[/i][/b]`
- You cannot, however partially overlap tag elements. `[b]Some bold text. [i]Some bold and italic text.[/b] Some italic text.` would be invalid. As would `[b][i]Some bold and italic text[/b][/i]` (make sure to match nested tags in a last in first out manner)

# Language Description
The language should be described by JSON in the form of:
```
{ 
	"tags": [
		{
			"name": "bold",
			"alt": ["b"],
			"type": "OpenClose",
			"open": "<b>",
			"close": "</b>"
		},
		{
			"name": "italics",
			"alt": ["i"],
			"type": "OpenClose",
			"open": "<i>",
			"close": "</i>"
		},
		{
			"name": "underline",
			"alt": ["u"],
			"type": "OpenClose",
			"open": "<u>",
			"close": "</u>"
		},
		{
			"name": "image",
			"alt": ["img"],
			"type": "Standalone",
			"attr":	{
				"src":"src=#val#"
			},
			"open": "<img #src#>"
		},
		{
			"name": "code",
			"type": "LeafOpenClose",
			"open": "<div class='code'><pre>#val#</pre></div>"
		}
	]
}
```

`tags` should be an array of the tag descriptions.

Each tag description should be an object with the following properties:
- `name`: (required) The name of the tag, and what goes between the brackets in language input
- `alt`: (optional) an array of alterenate names that are also accepted
- `type`: (required) should be one of `"Standalone"`, `"OpenClose"` or `"LeafOpenClose"` (see below for details)
- `attr`: (optional) an array of attribute descriptions (see below for details)
- `open`: (required) the html code that opens a tag. see tag types section for details on how it is used for each type
- `close`: (required for `"OpenClose"` tags, ignored for `"Standalone"` and `"LeafOpenClose"` tags) the html code that closes the tag

### Tag Types
`"OpenClose"` tags are tags which require an opening tag and a closing tag from the user AND can have other tag elements as children. For example `[b][/b]` would be an open/close tag element. The `open` property of these tags defines what HTML code should precede the value (the value being whatever is between the open and close tags in the input). The `close` tag defines what HTML code should follow the value. For example, using the above language description, the example input `[b]some text[/b]` would result in the output `<b>some text</b>`.

`"Standalone"` tags are tags which only have an opening tag and have no corresponding close tag. For example, `[image]`. These tags have no value, and so the `open` property specifies how the whole tag is rendered. For example, using the abover language description, `[image src="somepicture.png"]` would result in the output `<img src="somepicture.png">` (See the attributes section below for details on how the attributes are handled.

`"LeafOpenClose"` tags are open/close tags that cannot have any tag elements as children. For example, `[code][/code]`. They CAN have plain text between the open and corresponding close tags, so for example `[code]some code[/code]` is valid, while `[code][b]some bolded code[/b][/code]` is not. Instead of concatenating an `open` + value + `close` the way `"OpenClose"` tags do, `"LeafOpenClose"` tags use only the `open` property and are rendered similarly to `"Standalone"` tags, except that the value (ie. whatever text is typed between the open/clode tags in the input) is put in place of the special character sequence `#val#` in the `open` property.

### Attributes
Attribute descriptions should be key/value pairs. The key is the attribute name, and the value is the attribute string template with `#val#` being the special character sequence where the attribute value is inserted. To render the attribute into the HTML output, `#val#` is replaced with the attribute value, and the resulting string is placed into the `open` portion of the output (in all 3 tag types) at the special character sequence `#name#` where `name` is the name of the attribute.
