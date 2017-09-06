// HtmlParser v40 2016/09/21

var _TAGS = {
	meta: 1,
	link: 1,
	img: 1,
	br: 1,
	input: 1,
	hr: 1,
	component: 1, // FR!
};

var offset = (function(){
	var _cash = {};
	return function(level){
		if(_cash[level]){
			return _cash[level];
		}else{
			for(var i=0, str = ""; i < level; i++){
				str+="\t";
			}
			_cash[level]=str;
			return str;
		}
	}
}());

function last(list){ 
	return list[list.length - 1];
}

// @param {String} expr - '2n+1'
// @return {Function} cb(n)
function createCalc(expr){
	var 	parts = expr.replace(' ', '').replace('-', '+d*').replace('n', '*n').split('+'),
			i = parts.length,
			_sumList = [];

	while(i-- > 0){
		_sumList.push(parts[i].indexOf('*') == -1 ? parts[i] : parts[i].split('*'));
	}

	return function(n){
		var 	i = _sumList.length,
				sum = 0,
				_variables = {
					d: -1,
					n: n
				},
				j, mult, buf;

		while(i-- > 0){
			if(Array.isArray(_sumList[i])){
				mult = 1;
				j = _sumList[i].length;
				while(j-- > 0){
					buf = _sumList[i][j];
					if(buf){
						mult *= _variables[buf] != undefined ? _variables[buf] : isFinite(buf) ? parseInt(buf) : 1;	
					}
				}
				sum += mult;
			}else{
				buf = _sumList[i];
				sum += _variables[buf] != undefined ? _variables[buf] : isFinite(buf) ? parseInt(buf) : 0;
			}
		}
		return sum;
	}
}

// @param {String} expr - '2n+1=x' transform to (x)=>{(x-1)/2} return `n` value
function createReverseCalc(expr){
	var 	parts = expr.replace(' ', '').replace('-', '+-').replace('n', '*n*').split('+'),
			i = parts.length,
			_sumList = [],
			_multList;

	while(i-- > 0){
		if(parts[i].indexOf('*') == -1){
			_sumList.push(parts[i]);
		}else{
			_multList = parts[i].split('*');
		}
	}

	// @return {Num} n
	return function(x){
		var 	i = _sumList.length,
				n = x,
				buf;

		while(i-- > 0){
			buf = _sumList[i];
			n -= isFinite(buf) ? parseInt(buf) : 0;
		}

		if(_multList){
			i = _multList.length;
			while(i-- > 0){
				if(buf = _multList[i]){
					n /= isFinite(buf) ? parseInt(buf) : 1;	
				}
			}
		}
		return n;
	}
}

function NodeMixin(){
	// Attention JSOn.stringify can throw `process out of memeory`
	this.getJSON = function(){
		return JSON.stringify(this, function(key, value){
			if(
				key == "parentNode" ||
				key == "nextSibling" ||
				key == "previousSibling" || 
				key == "nextElementSibling" ||
				key == "previousElementSibling"
			){
				if(value instanceof NodeElement){
					return value.tagName + (value.id ? '#' + value.id : '') + (value.classList && value.classList.length > 0 ? '.' + value.classList.join('.') : 'NodeElement');
				}else if(value instanceof TextElement){
					return value.textContent;
				}else{
					return '';
				}
			}
			return value;
		}, '\t');
	};
}

////////////////////////////////////////////////////////////
//	SelectorService
////////////////////////////////////////////////////////////
function PseudoParser(name){
	this.name = name;			
	this.stack = []; 
}
PseudoParser.prototype.add = function(part){
	part && this.stack.push(part);
}

var SelectorService = {
	QUERY_SPLIT_PATTERN: /\s*(\+|\s|\~|\>)\s*/g, 
	NTH_EXPR_PATTERN: /^[\d+-]*n[\d+-]*$/, // `n` important part
	QUERY_SEPARTORS: ['(', ')', '[', ']', '>', '+', '~', ' '], // order of first four items is important!
	splitQuery: function(str){
		str = str.replace('>>', ' ').replace(this.QUERY_SPLIT_PATTERN, '$1');

		var 	len = str.length,
				pos = 0,
				i = 0,
				buf,
				minPos = 0,
				brackets = 0,
				cutPos = 0,
				rez = [];

		while(pos < len){
			i = brackets == 0 ? this.QUERY_SEPARTORS.length : 4;
			minPos = -1;
			while(i-- > 0){
				buf = str.indexOf(this.QUERY_SEPARTORS[i], pos);

				if(buf != -1 && (minPos != -1 ? buf < minPos : true)){
					minPos = buf;
				}
			}
			
			if(minPos != -1){
				if(str[minPos] == ' ' || str[minPos] == '>' || str[minPos] == '+' || str[minPos] == '~'){
					rez.push(str.substring(cutPos, minPos), str[minPos]);
					cutPos = minPos + 1;
				}else if(str[minPos] == '[' || str[minPos] == '('){
					brackets++; 
				}else if(str[minPos] == ']' || str[minPos] == ')'){
					brackets--;
				}
				pos = minPos + 1;	
			}else{
				break;
			}
		}

		if(len - cutPos > 0) rez.push(str.substring(cutPos));
		return rez;
	},
	// @memberOf SelectorService - parse query string at node tree
	// support relationsheeps between nodes:
	// 	' ', '>>' - anyparent
	// 	'>' - parent
	// 	'+' - next
	// 	'~' - anynext
	parseQuery: function(selector){
		var 	parts = this.splitQuery(selector),
				i = parts.length,
				nextSelect,
				root, cur;

		while(i-=2, i > -2){
			// parts[i + 1] - selector
			// parts[i] - relationsheep with next

			if(!parts[i + 1 ]){
				return;
			}else{
				if(!root){
					root = this.parseNodeSelector(parts[i + 1]);
					cur = root;
				}else{
					cur = cur.and = this.parseNodeSelector(parts[i + 1]); // `and` is mean `&&`
					// cur = cur.and;
					cur.select = nextSelect;
				}
				nextSelect = parts[i];
			}
		}

		return root;
	},
	// @param {String} selector - selector string or splitted array
	parseNodeSelector: function(selector){
		return this._list2nodeProfile(
			selector.split(/([\*\^\$\~\|]?\=|\"[^"]*\"|#|\.|\[|\]|\(|\)|\:(?:last\-child|first\-child|nth\-child|not))/g).filter(function(s){return s && s;})
		);
	},
	// convert plain list to Node profile object
	// @param {Array} parts 
	_list2nodeProfile: function(parts){
		var 	pos = 0,
				res = {cls: [], id: '', tagName: '', conditions: []};
		
		if(/^[\w\-_]+$/.test(parts[pos])){
			res.tagName = parts[pos].toLowerCase();
			pos++;
		}

		while(pos < parts.length){
			if(parts[pos] == '.'){
				res.cls.push(parts[++pos]);
				pos++;
			}else if(parts[pos] == '#'){
				res.id = parts[++pos];
				pos++;
			}else if(parts[pos] == '['){
				var pseudoParser = new PseudoParser('attr');
				pos++;			
				while(parts[pos] != ']' && pos < parts.length){
					pseudoParser.add(parts[pos++]);
				}
				pos++;
				res.conditions.push(pseudoParser);
			}else if(!parts[pos]){
				pos++;
			}else if(parts[pos][0] == ':'){ // function execution
				var 	pseudoParser = new PseudoParser(parts[pos++]),
						brackets = 0;

				if(parts[pos] == '('){
					brackets++;
					pos++;
					while(brackets != 0 && pos < parts.length ){
						if(parts[pos] == ')') brackets--;
						if(parts[pos] == '(') brackets++;
						if(brackets > 0) pseudoParser.add(parts[pos]);	
						pos++;
					}
				}
				if(pseudoParser.name == ':not'){ // convert `not` to selector profile
					pseudoParser.stack = this._list2nodeProfile(pseudoParser.stack);
				}

				res.conditions.push(pseudoParser);	
			}else{
				pos++;
			}
		}
		return res;
	},
	// @param {NodeElement} node
	// @param {Object} conf
	compareNode: function(node, conf){
		if((conf.id && conf.id != node.attr['id']) || (conf.tagName && conf.tagName != node.tagName)){
			return false;
		}

		var i = conf.cls.length;
		while(i-- > 0){
			if(!node.hasClass(conf.cls[i])){
				return false;
			}
		}

		if(conf.conditions){
			i = conf.conditions.length;
			var 	pos = node.parentNode && (node.parentNode.children.indexOf(node) + 1),
					len = node.parentNode && node.parentNode.children.length;
			
			while(i-- > 0){
				switch(conf.conditions[i].name){
					case ':last-child':
						if(pos > 0 && len != pos){
							return false;
						}
						break;
					case ':first-child':
						if(pos > 0 && pos != 1){
							return false;	
						} 
						break;
					case ':nth-child':
						var expr = conf.conditions[i].stack[0];

						if(expr == 'odd'){
							if(pos%2 != 1) return false;
						}else if(expr == 'even'){
							if(pos%2 != 0) return false;
						}else if(this.NTH_EXPR_PATTERN.test(expr) && len){
							// Variant with matching
							// var 	calcFunc = createCalc(expr), // compile expretion to math function
							// 		list = []; // list for numbers of relative childs

							// for(var j = 0; j < len; j++){
							// 	list.push(calcFunc(j));
							// }

							// if(list.indexOf(pos) == -1) return false;
							

							var 	calc = createReverseCalc(expr),
									n = calc(pos);

							if((~~n - n) != 0 || n < 1 || n > len) return false;
						}else{
							expr = parseInt(expr) || 0;

							if(expr != pos) return false;
						}
						break;
					case 'attr':
						var 	name = conf.conditions[i].stack[0],
								cond = conf.conditions[i].stack[1],
								pattern = conf.conditions[i].stack[2];
						
						if(!cond){
							if(node.attr[name] == undefined) return false;
						}else if(node.attr[name] != undefined){
							if(pattern) pattern = pattern.replace(/\"/g, '');

							switch(cond){
								case '=': // Attribute equal
									if(node.attr[name] != pattern) return false; 
									break;
								case '*=': // Attribute Contains
									if(node.attr[name].indexOf(pattern) == -1) return false;
									break;
								case '^=': // Attribute Begins
									if(node.attr[name].indexOf(pattern) != 0) return false;
									break;
								case '$=': // Attribute Ends
									var pos = node.attr[name].indexOf(pattern);
									if(pos == -1 || pos != node.attr[name].length - pattern.length) return false;
									break;
								case '~=': // Attribute Space Separated
									var list = node.attr[name].split(' ');
									if(list.indexOf(pattern) == -1) return false;
									break;
								case '|=': // Attribute Dash Separated
									var list = node.attr[name].split('-');
									if(list.indexOf(pattern) == -1) return false;
									break;
							}
						}else{
							return false;
						}
						break;
					case ':not':
						// TODO compare node with 
						if(this.compareNode(node, conf.conditions[i].stack)){
							return false;
						}
						break;
				}
			}

		}
		return true;
	},
	isSame: function(node, tree){
		if(!tree.select){
			if(!this.compareNode(node, tree)){
				return false;
			}
		}else if(tree.select == ' ' || tree.select == '>>'){ // anyparent, find parent that matches tree
			var 	parent = node.parentNode;

			while(parent.parentNode != undefined){
				if(!this.compareNode(parent, tree)){
					parent = parent.parentNode;
				}else{
					break;
				}
			}

			if(parent.parentNode){
				node = parent;
			}else{
				return false;
			}
		}else if(tree.select == '>'){
			var 	parent = node.parentNode;

			if(!((parent instanceof NodeElement) && this.compareNode(parent, tree))){
				return false;
			}

			node = parent;
		}else if(tree.select == '+'){
			var 	next = node.nextSibling;

			if(!next || !this.compareNode(next, tree)){
				return false;
			}
			node = next;
		}else if(tree.select == '~'){
			do{
				node = node.previousSibling; // because node that we check must be previous from current node
				if(node && this.compareNode(node, tree)) break;
			}while(node != undefined)

			if(!node) return false;
		}else{ // select not implemented 
			return false;
		}
		
		if(tree.and){
			return this.isSame(node, tree.and);
		}

		return true;
	}
};

////////////////////////////////////////////////////////////
//	Document
////////////////////////////////////////////////////////////
{
	function Document(){
		this.childNodes = [];
		this.children = [];
		this.stack = [];
	};
	// @memberOf Document - create node with params
	// @param {String} tagName - name of node
	// @param {Object} attr - init object of attributes
	Document.prototype.createElement = function(tagName, attr){
		var node = new NodeElement(tagName);
		node.attr = attr;
		
		if(attr.id) node.id = attr.id;
		
		if(attr.class){
			var 	classArray = attr.class.split(/\s+/g),
					i = classArray.length;

			while(i-- > 0) node.addClass(classArray[i]);
		}
		this.stack.push(node);
		return node;
	};
	// @memberOf NodeElement - добавляет дочерний элемент
	// @param {NodeElement/TextElement} node - добавляемый элемент
	Document.prototype.appendChild = function(node){
		var		lastNode;	

		if(node instanceof NodeElement){
			if(lastNode = this.children[this.children.length - 1]){
				lastNode.nextSibling = node;
				node.previousSibling = lastNode;
			}
			this.children.push(node);
		}
		
		if(lastNode = this.childNodes[this.childNodes.length - 1]){
			lastNode.nextElementSibling = node;
			node.previousElementSibling = lastNode;
		}
		this.childNodes.push(node);
		node.parentNode = this;
	};
	// @memberOf Document - get html content of document
	// @param {Bool} asHtml - serialize as Html document
	// @return {String}
	Document.prototype.getHTML = function(asHtml){
		var str = "";

		for(var i in this.childNodes){
			if(this.childNodes[i] instanceof NodeElement){
				str += this.childNodes[i].getHTML(0, asHtml);
			}else{
				str += this.childNodes[i].textContent;
			}
		}
		return str;
	}
	Document.prototype.querySelectorAll = function(selector, onlyFirst){
		var 	tree = SelectorService.parseQuery(selector),
				res = [];

		for(var i = 0; i < this.stack.length; i++){
			if(SelectorService.isSame(this.stack[i], tree)){
				if(res.push(this.stack[i]) == 1 && onlyFirst) break;
			}
		}

		return res;
	};
	Document.prototype.querySelector = function(selector){
		return this.querySelectorAll(selector, true)[0];
	};
	NodeMixin.call(Document.prototype);
}
////////////////////////////////////////////////////////////
//	NodeElement
////////////////////////////////////////////////////////////
{
	function NodeElement(name){
		this.attr = {};
		this.childNodes = [];
		this.children = [];
		this.classList=[];
		this.tagName = name;
		this.nextSibling = undefined;
		this.previousSibling = undefined;
		this.nextElementSibling = undefined;
		this.previousElementSibling = undefined;
		this.parentNode = undefined;
	};
	NodeElement.prototype.getAttribute = function(name){
		return this.attr[name];
	};
	NodeElement.prototype.setAttribute = function(name,value){
		this.attr[name] = value;
	};
	NodeElement.prototype.addClass = function(name){
		if(this.classList.indexOf(name)<0){
			this.classList.push(name);
		}
	};
	// @memberOf NodeElement - remove class from Node
	// @param {String} name - name of class
	NodeElement.prototype.removeClass = function(name){
		var index = this.classList.indexOf(name);

		if(index != -1) this.classList.splice(index, 1);
	};
	NodeElement.prototype.hasClass = function(name){
		return this.classList.indexOf(name) >= 0;
	};
	// @memberOf NodeElement - return textContent of Node
	// @return {String} 
	NodeElement.prototype.getTextContent = function(){
		var str = '', element;

		for(var nodeIndex in this.childNodes){
			element = this.childNodes[nodeIndex];

			if(element instanceof TextElement) str += element.textContent;
			if(element instanceof NodeElement) str += element.getTextContent();
		}
		return str;
	};
	// @memberOf NodeElement - добавляет дочерний элемент
	// @param {NodeElement/TextElement} node - добавляемый элемент
	NodeElement.prototype.appendChild = function(node){
		var		lastNode;	

		if(node instanceof NodeElement){
			if(lastNode = this.children[this.children.length - 1]){
				lastNode.nextSibling = node;
				node.previousSibling = lastNode;
			}
			this.children.push(node);
		}
		
		if(lastNode = this.childNodes[this.childNodes.length - 1]){
			lastNode.nextElementSibling = node;
			node.previousElementSibling = lastNode;
		}
		this.childNodes.push(node);
		node.parentNode = this;
	};
	// @memberOf NodeElement - выводит html содержимое тега
	// @param {Int} level - количество табов слева от элемента
	// @param {Bool} asHtml
	NodeElement.prototype.getHTML = function(level, asHtml){
		var 	str = '\n' + offset(level) + "<" + this.tagName;

		for(var key in this.attr){
			str += ' ' + key + (this.attr[key] ? ('=\"' + this.attr[key].replace(/\"/g, '\\"') + '\"') : ''); // Maybe `&quot;`
		}
		if(asHtml && _TAGS[this.tagName]){
			str += '/>';
		}else{
			str += ">";
		
			for(var i in this.childNodes){
				if(this.childNodes[i] instanceof NodeElement){
					str += this.childNodes[i].getHTML(level + 1, asHtml);
				}else{
					str += this.childNodes[i].textContent.replace(/\t/g, "&#9;").replace(/\n/g, "&#10;").replace(/\r/g, "&#13;");
				}
			}
			
			str += (this.children.length == 0 ? '' : '\n' + offset(level)) + "</" + this.tagName + ">";
		}
		
		return str;
	};
	// @param {String|Array} selector - query string or selector treee
	NodeElement.prototype.querySelectorAll = function(selector, list){
		var 	list = list || [],
				selector = typeof(selector) == 'string' ? SelectorService.parseQuery(selector) : selector;

		if(SelectorService.isSame(this, selector)){
			list.push(this);
		}

		for(var i = 0; i < this.children.length; i++){
			this.children[i].querySelectorAll(selector, list);
		}

		return list;
	};
	NodeElement.prototype.querySelector = function(selector){
		var 	selector = typeof(selector) == 'string' ? SelectorService.parseQuery(selector) : selector;

		if(SelectorService.isSame(this, selector)){
			return this;
		}else{
			var res;
			for(var i = 0; i < this.children.length; i++){
				res = this.children[i].querySelector(selector);
				if(res){
					return res;
				}
			}
		}

	};

	NodeMixin.call(NodeElement.prototype);
}
////////////////////////////////////////////////////////////
//	TextElement
////////////////////////////////////////////////////////////
function TextElement(text){
	this.textContent = text;
	this.nextElementSibling = undefined;
	this.previousElementSibling = undefined;
	this.parentNode = undefined;
};
// @memberOf TextElement
// @return {String} JSON Dump of element
TextElement.prototype.getJSON = function(){
	return JSON.stringify(this, null, '\t');
};

////////////////////////////////////////////////////////////
//	XmlParser
////////////////////////////////////////////////////////////
var XmlParser = {
	CLEAR_COMMENTS: /\<\!--[\s\S]*?--\>/g,
	COMMENT_PATTERN: /\<\![\s\S]*?\>/g, // Clear <!...> - Doctype, CDATA, another comment-like blocks
	// CLEAR_SCRIPTS: /\<script[\s\S]*?<\/script\>/ig,
	CLEAR_SCRIPTS: /\<script[\s\S]*?<\/script\>|\<style[\s\S]*?\<\/style\>/ig,
	CDATA_PATTERN: /\<\!\[CDATA\[([\s\S]*?)\]\]\>/g,
	DOCTYPE_PATTERN: /\<\!DOCTYPE\s+([^>]+)>/i,
	// @param {Object} conf 
	// @param {Bool} conf.isHtml
	// @param {Bool} conf.clearScripts
	// @return {Document}
	parseDocument: function(str, conf){
		var 	_document = new Document(),
				_currentNode = _document;

		_document.doctype = this.DOCTYPE_PATTERN.exec(str);
		if(_document.doctype) _document.doctype = _document.doctype[1];
		// prepare source
		var source = str.
			replace(this.CDATA_PATTERN, function(offset, p1, pos){
				return p1.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace(/\&/, '&amp;');
			}).
			replace(this.CLEAR_COMMENTS, '').
			replace(this.COMMENT_PATTERN, '');

		if(conf && conf.clearScripts){
			source = source.replace(this.CLEAR_SCRIPTS, '');
		}

		var 	list = source.split(/(\<|\/\>|\>)/g),
				len = list.length,
				part;


		for(var i = 0; part = list[i], i < len; i += 2){
			if(list[i + 1] == '<'){ // Text content
				_currentNode.appendChild(new TextElement(part));
			}else if(list[i + 1] != undefined){ // Tag content
				if(part[0] == "/"){ // close Tag
					if(_currentNode.parentNode){
						_currentNode = _currentNode.parentNode;
					}
				}else{
					var node = this.parseTagContent(part, _document);
					_currentNode.appendChild(node);

					if(!(part[part.length - 1] == "/" || conf && conf.isHtml && _TAGS[node.tagName])){
						_currentNode = node;
					}
				}
			}
		}
		return _document;
	},
	// @memberOf XmlParser
	// @param {String} str
	// @return {NodeElement}
	parseTagContent: function(str, doc){
		// " onclick=\"return{'b-link':{}}\" onclick='return{\"b-link\":{}}'".match(/(\w[\w\-\d]*(?:\s*=\s*(?:\"[\s\S]*?\"|\'[\s\S]*?\'))?)/g)
		var 	parts = str.match(/(\w[\w\-\d]*(?:\s*=\s*(?:\"[\s\S]*?\"|\'[\s\S]*?\'|[^\s]+))?)/g),
				partsLength = parts && parts.length;
		
		if(!partsLength) throw("Parse error not found tag in XmlParser.parseTagContent(). `" + str + "` ");

		var 	tagName = parts[0].toLowerCase(),
				i = 1, key, value, cutPoint,
				attr = {};

		for(; i < partsLength; i++){
			cutPoint = parts[i].indexOf('=');
			key = parts[i];
			value = undefined;

			if(cutPoint != -1){
				key = key.substring(0, cutPoint);
				value = parts[i].substring(cutPoint + 1).trim();
				value = (value[0] == '\'' || value[0] == '\"') ? value.substring(1, value.length - 1) : value;
			}
			attr[key.trim()] = value;
		}

		return doc.createElement(tagName, attr);
	},	
}


function htmlspecialchars(str){
	return str.replace(/[<>&]/g, function(m){
		return m == '<' ? '&lt;' : m == '>' ? '&gt;' : '&amp;'
	});
}
//===========================
// DocumentBuilder 
//===========================
var DocumentBuilder = {
	DOCTYPE_PATTERN: /\<\!DOCTYPE\s+([^>]+)>/i,
	ESCAPE_PATTERN: /\<\!\[CDATA\[([\s\S]*?)\]\]\>|\<\!--([\s\S]*?)--\>/g,
	// @param {Bool} conf.parseHtml
	parse: function(code, config){
		var 	_document = new Document(),
				_node = _document,
				conf = config || {};

		// Detect DocType and remove it from code
		// Escape CDATA values and comments
		var 	source = code.
					replace(this.DOCTYPE_PATTERN, function(sub, doctype){
						conf.doctype = doctype.toLowerCase();
						return '';
					}).
					replace(this.ESCAPE_PATTERN, function(sub, cdata, comment){
						var out = '';

						if(cdata){
							out = htmlspecialchars(cdata);
						}else if(comment){
							out = '<!--' + htmlspecialchars(comment) + '-->';
						}
						return out;
					});

		var 	tagList = source.split(/(\<[^\>]+\>)/g),
				len = tagList.length,
				size,
				i = 0, str;

		for(;i < len; i++){
			if(str = tagList[i]){
				if(str[0] == '<'){ // open tag, close tag, comment
					size = str.length;

					if(str[1] == '/'){
						// Close tag
						if(_node.parentNode){
							_node = _node.parentNode;
						}
					}else if(str[1] == '!' && str[2] == '-' && str[3] == '-'){ 
						// comment
						if(!Array.isArray(_node.comments)) _node.comments = [];
						_node.comments.push(str.slice(4, -3));
					}else{
						if(str[size - 2] == '/'){
							// close tag
							var node = this.parseTagContent(str.slice(1, -2), _document);
							_node.appendChild(node);
						}else{
							var node = this.parseTagContent(str.slice(1, -1), _document);
							
							_node.appendChild(node);
							if(!((conf.parseHtml || conf.doctype == 'html') && _TAGS[node.tagName])){
								_node = node
							}
						}
					}
				}else{
					// Plain text
					_node.appendChild(new TextElement(str));
				}

			}
		}

		return _document;
	},
	// @memberOf DocumentBuilder
	// @param {String} str
	// @return {NodeElement}
	parseTagContent: function(str, doc){
		var 	parts = str.match(/(\w[\w\-\d]*(?:\s*=\s*(?:\"[\s\S]*?\"|\'[\s\S]*?\'|[^\s]+))?)/g),
				partsLength = parts && parts.length;
		
		if(!partsLength) throw('Parse error not found tag in XmlParser.parseTagContent(). `' + str + '` ');

		var 	tagName = parts[0].toLowerCase(),
				i = 1, key, value, cutPoint,
				attr = {};

		for(; i < partsLength; i++){
			cutPoint = parts[i].indexOf('=');
			key = parts[i];
			value = undefined;

			if(cutPoint != -1){
				key = key.substring(0, cutPoint);
				value = parts[i].substring(cutPoint + 1).trim();
				value = (value[0] == '\'' || value[0] == '\"') ? value.substring(1, value.length - 1) : value;
			}
			attr[key.trim()] = value;
		}

		return doc.createElement(tagName, attr);
	},	
};

module.exports.SelectorService = SelectorService;
module.exports.Document = Document;
module.exports.NodeElement = NodeElement;
module.exports.TextElement = TextElement;
module.exports.createCalc = createCalc;
module.exports.DocumentBuilder = DocumentBuilder;
// DEPRICATED
module.exports.parseDocument = XmlParser.parseDocument.bind(XmlParser);
