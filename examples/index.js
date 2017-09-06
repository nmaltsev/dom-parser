var		XmlParser = require('./../xml_parser'),
		xrequest = require('./../xrequest'),		
		SelectorService = XmlParser.SelectorService,
		parseDocument = XmlParser.parseDocument;		


var IS_BLOCK = {
	li: 1, // but not ul!
	p: 1,
	div: 1,
	h1: 1,
	h2: 1,
	h3: 1,
	h4: 1,
	h5: 1,
};
function Dom2text($el){
	if($el.tagName == 'br'){ // predefined const 
		return '\n';
	}

	var 	out = '',
			i = -1,
			text,
			sub;

	if(IS_BLOCK[$el.tagName] == 1){
		out += '\n';
	}
	
	if($el.tagName == 'li'){
		out += '- ';
	}

	while(++i < $el.childNodes.length){
		sub = $el.childNodes[i];

		if(sub instanceof XmlParser.TextElement){
			text = sub.textContent.trim();

			if($el.tagName != 'pre'){
				text = text.replace(/\s+/g, ' ');
			}
		}else{
			text = Dom2text(sub);
		}
		out += text;
	}

	return out;
}



//////////////////////////////////////////////////////////////////////////


var reqData = xrequest.getUriConfig('GET', 'https://www.wizishop.fr/contact/postuler', {
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
		// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
		'Connection': 'keep-alive',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Encoding': 'gzip, deflate, sdch',
		'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
		// Accept: '*/*',
	});

xrequest.fetch(reqData, function(body, res){
	console.log('Fetch %s', res.statusCode);
	// console.log(body);
	// console.dir(res.headers);


	var 	$doc = XmlParser.parseDocument(body, {isHtml: true}),
		 	$fields = $doc.querySelectorAll('.job-available');

	var 	i = $fields.length;

	while(i-- > 0){
		console.log('Find');
		console.log($fields[i].getHTML(0, true));		
		console.log(Dom2text($fields[i]));
	}
}, function(er){
	console.log('Fetch failed');
	console.dir(er);
});


var base = [
	{
		id: 'wizishop.fr',
		link: 'https://www.wizishop.fr/contact/postuler',
		selector: '.job-available'
	}
]