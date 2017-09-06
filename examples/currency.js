var		XmlParser = require('./../xml_parser'),
		xrequest = require('./../xrequest'),		
		SelectorService = XmlParser.SelectorService,
		parseDocument = XmlParser.parseDocument;		

var base = [
	{
		id: 'vostexpr',
		link: 'https://www.vostbank.ru/interactive_blocks/currency_converter2.php',
		selector: '._widget-converter>.inner-table tr:nth-child(3)>td:nth-child(3)'
	}, 
	{
		id: 'sauberbank',
		link: 'https://www.sauberbank.com/spb/services/currencyrates/',
		selector: '.widget-column:first-child > .currency_table_1 tr:nth-child(3)>td:nth-child(3)' // or get last of collection!
	}
];

let 	i = base.length,
		reqData;

while(i-- > 0){
	let 	conf = base[i];

	reqData = xrequest.getUriConfig('GET', conf.link, {
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
		// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
		'Connection': 'keep-alive',
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Encoding': 'gzip, deflate, sdch',
		'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
		// Accept: '*/*',
	});

	xrequest.fetch(reqData, function(body, res){
		console.log('Fetch %s, status: %s', conf.id, res.statusCode);
		// console.dir(conf);
		// console.log(body);
		// console.dir(res.headers);
		var 	$doc = XmlParser.parseDocument(body, {isHtml: true}),
			 	$fields = $doc.querySelectorAll(conf.selector),
			 	i = $fields.length;

		console.log('TOTAL: %s', i);

		while(i-- > 0){
			console.log('Find');
			console.dir($fields[i].getTextContent());
		}
	}, function(er){
		console.log('Fetch failed');
		console.dir(er);
	});
}
