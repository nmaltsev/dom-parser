var		XmlParser = require('./../xml_parser'),
		Document = XmlParser.Document,
		Text = XmlParser.TextElement, 
		NodeElement = XmlParser.NodeElement;	


var row = new NodeElement('tr');
var cell1 = new NodeElement('td');
var cell2 = new NodeElement('td');
var cell3 = new NodeElement('td');
cell1.appendChild(new Text('abc'));
cell1.appendChild(new Text(''));
cell1.appendChild(new Text('1234567890123456789012345678901234567890'));

row.appendChild(cell1);
row.appendChild(cell2);
row.appendChild(cell3);

console.log('Row');
console.dir(row);

// TODO rewrite with render_engine


