var		XmlParser = require('./xml_parser'),
		Document = XmlParser.Document,
		Text = XmlParser.TextElement, 
		NodeElement = XmlParser.NodeElement;

// TODO How to create instance of child class from instance of parentClass	
// HtmlElement()
/*
Maybe: 

class HtmlElement extends NodeElement{
	constructor(tagName){
		super(tagName);
		this.init();
	}
	init(){
		this.defaultStyles = {}; // virtual
	}
}
var a = new NodeElement();
a.prototype = b.prototype;
a.prototype.init.call(a);

*/



// Maybe to here replace methods for working with classes from NodeElement
class HtmlElement extends NodeElement{
	constructor(tagName){
		super(tagName);
		this.defaultStyles = {}; // virtual
	}
	render(){
		// TODO reqursively render 
	}
	getProperty(propertyName){
		// TODO
	}
}

class TableElement extends HtmlElement{
	constructor(){
		super('table');

		this.defaultStyles = {
			display: 'table'
		}; 
	}
}


