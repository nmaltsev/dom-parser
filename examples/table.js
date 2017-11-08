var		{HtmlElement, HTMLTableElement, HTMLTableRowElement, HTMLTableCellElement} = require('./../render_engine'),
		{TextElement} = require('./../xml_parser');


var row = new HTMLTableRowElement();
var cell1 = new HTMLTableCellElement();
var cell2 = new HTMLTableCellElement();
var cell3 = new HTMLTableCellElement();
cell1.appendChild(new TextElement('abc'));
cell1.appendChild(new TextElement(''));
cell1.appendChild(new TextElement('1234567890123456789012345678901234567890'));

row.appendChild(cell1);
row.appendChild(cell2);
row.appendChild(cell3);

console.log('Row');
console.dir(row);
console.log('D: %s', row.style.display);

// TODO rewrite with render_engine


