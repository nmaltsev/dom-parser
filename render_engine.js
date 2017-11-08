var		XmlParser = require('./xml_parser'),
		Document = XmlParser.Document,
		Text = XmlParser.TextElement, 
		NodeElement = XmlParser.NodeElement;

const DEFAULT_STYLES = Symbol('defaultStyles');

// Attention: Class API stay at NodeElement to save ability of extracting with css selectors
class HtmlElement extends NodeElement{
	constructor(tagName){
		super(tagName);
		this.style = {};
		// Private field:
		this[DEFAULT_STYLES] = {};
		Object.setPrototypeOf(this.style, this[DEFAULT_STYLES]);
	}
	render(){
		// TODO reqursively render 
	}
	getProperty(propertyName){
		// TODO
	}
}

class HTMLTableElement extends HtmlElement{
	constructor(){
		super('table');
		this[DEFAULT_STYLES].display = 'table';
	}
}
class HTMLTableRowElement extends HtmlElement{
	constructor(){
		super('tr');
		this[DEFAULT_STYLES].display = 'table-row';
	}
}
class HTMLTableCellElement extends HtmlElement{
	constructor(){
		super('td');
		this[DEFAULT_STYLES].display = 'table-cell';	
	}
}



module.exports.HtmlElement = HtmlElement;
module.exports.HTMLTableElement = HTMLTableElement;
module.exports.HTMLTableRowElement = HTMLTableRowElement;
module.exports.HTMLTableCellElement = HTMLTableCellElement;