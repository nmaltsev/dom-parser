var		XmlParser = require('./../xml_parser'),
		xrequest = require('./../xrequest'),		
		SelectorService = XmlParser.SelectorService,
		parseDocument = XmlParser.parseDocument;		

var base = [
	{
		id: 'vostexpr',
		link: 'https://www.vostbank.ru/interactive_blocks/currency_converter2.php',
		selectors: [
			{
				selector: '._widget-converter>.inner-table tr:nth-child(3)>td:nth-child(3)',
				label: 'euro'
			},
			{
				selector: '._widget-converter>.inner-table tr:nth-child(2)>td:nth-child(3)',
				label: 'usd'
			},
		],
	}, 
	{
		id: 'sauberbank',
		link: 'https://www.sauberbank.com/spb/services/currencyrates/',
		selectors: [
			{
				selector: '.widget-column:first-child > .currency_table_1 tr:nth-child(3)>td:nth-child(3)',
				label: 'euro'
			},
			{
				selector: '.widget-column:first-child > .currency_table_1 tr:nth-child(2)>td:nth-child(3)',
				label: 'usd'
			},
		]
	},
	{
		id: 'skv konychennaya',
		link: 'http://valutaspb.ru/',
		selectors: [
			{
				selector: '.price-value[course_flag="eur_sell_from_1000"]',
				label: 'euro'		
			},
			{
				selector: '.price-value[course_flag="usd_sell_from_1000"]',
				label: 'usd'
			}
		]
	}
];

let 	i = base.length,
		reqData;

while(i-- > 0){
	let 	conf = base[i];

	reqData = xrequest.getUriConfig('GET', conf.link, {
		Connection: 'keep-alive',
		Accept: '*/*',
		// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
		// 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Encoding': 'gzip, deflate, sdch',
		'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
	});

	xrequest.fetch(reqData, function(d){
		var 	$doc = XmlParser.parseDocument(d.body.toString(), {isHtml: true}),
				i = conf.selectors.length,
				results = [],
				value;

		while (i--> 0) {
			value = $doc.querySelector(conf.selectors[i].selector);
			results.push({
				value: value && value.getTextContent(),
				label: conf.selectors[i].label
			});
		}

		console.log('Fetch %s, status: %s', conf.id, d.response.statusCode);
		console.log('\t%s', results.map(function(res){
			return res.label + ': ' + res.value;
		}).join(', '));
	}, function(er){
		console.log('Fetch failed');
		console.dir(er);
	});
}
