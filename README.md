## xhtml_parser / <X|HT>MLParser

Js library for converting HTML and XML documents into Document Object Model (DOM)
(C) 2014-2024

### Features

* Not depends from any other libs;
* Compact size;
* Support css selectors (jQuery like queries).

### Api
Document::querySelectorAll()
Document::querySelector()
NodeElement::querySelectorAll()
NodeElement::querySelector()

Support: 
-	CSS selectors: `>>`, ` `, `~`, `>`, `+`
-	pseudo classes: `:first-child()`, `:last-child()`, `:nth-child(even)`, `:nth-child(odd)`, `:nth-child(2n-1)`, `:nth-child(3)`,
-	attribute selectors: 
    * `[data]`, 
    * `[data=abc]`, 
    * `[data="abc"]`, 
    * `[data*=abc]`, 
    * `[data~=abc]`, 
    * `[data^=abc]`, 
    * `[data$=abc]`, 
    * `[data|=abc]`,
    * `[href*=".zip"]` or `[href*=\\.zip]`
    * `[href%=".."]`,

## Implements of pseudo classes
Implemented:
- `:last-child`
- `:first-child`
- `:nth-child`
	
Not implemented:
- `:not()` - TODO;
- `:checked` - similar [checked];
- `:disabled` - similar [disabled].

examples:
* `li:nth-child(4-n)` - take first 4 nodes
* `:nth-child(2n+1)`
* `:nth-child(3)`
* `:nth-child(even)`
* `:nth-child(odd)`
