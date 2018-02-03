const 	$request = require('./../xrequest');	
const 	$xmlParser = require('./../xml_parser');
const	$parseDocument = $xmlParser.parseDocument;	
const 	$iconv = require('iconv').Iconv;
const 	$fs = require('fs');
const 	$literalCompiler = require('./../src/literal_compiler');

// var link = 'https://www.leboncoin.fr/locations/offres/provence_alpes_cote_d_azur/?th=1&location=Antibes%2006600%2CNice%2006000%2CNice%2006200&sqs=1&ros=1&roe=2&ret=2';
var link = 'https://www.leboncoin.fr/locations/offres/provence_alpes_cote_d_azur/?th=1&location=Antibes%2006600%2CNice%2006000%2CNice%2006200&mre=800&sqs=2&ros=1&roe=2&ret=2';

class PageCollector{
	// @param {Object} $request
	// @param {Object} $parser
	// @param {Object} $translator
	// @param {(Date)=>{}:string} $timeFormatter
	// @param {Object} $helpers
	constructor($request, $parser, $translator, $timeFormatter, $helpers){
		this.$request = $request;
		this.$parser = $parser;
		this.$translator = $translator;
		this.$timeFormatter = $timeFormatter;
		this.$helpers = $helpers;
		this.links = [];
	}
	// @param {String|UniversalLink} link
	download(link){
		if(link instanceof this.$request.UniversalLink){
			this.location = link;
		}else{
			this.location = new this.$request.UniversalLink(link);	
		}

		return this.$request.petch(this.$request.getUriConfig('GET', link, {
			Connection: 'keep-alive',
			Accept: '*/*',
			// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
			// 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate, sdch',
			'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
		})).then((d) => {
			var 	doc = this.$parser.parseDocument(d.body.toString(), {isHtml: true}),
			 		links = doc.querySelectorAll('.tabsContent>ul>li>a');

			var 	now = new Date(),
					currentDate = this.$timeFormatter(now);

			var		isCompleted = false,
					i = Array.isArray(links) && links.length,
					link, 
					linkModel,
					date;

			console.log('Body size: %s, today: %s', d.body.length, currentDate);	

			while(i-- > 0){
				link = links[i].getAttribute('href');
				
				if(date = links[i].querySelector('[itemprop="availabilityStarts"]')){
					date = date.getAttribute('content');

					if(date != currentDate){ // when we find another date
						isCompleted = true;
					}
				}else{
					isCompleted = true;
				}

				console.log('Link: %s, date: %s', link, date || '-');
				
				linkModel = new this.$request.UniversalLink(link);
				linkModel.inherit(this.location);
				this.links.push(linkModel.toString());

				// console.log('D: %s, link: %s', date, link);
				// console.log('M: %s', linkModel);
			}

			console.log('Founded links: %s, isCompleted: %s', links.length, isCompleted);

			if(!isCompleted){
				let nextLink = doc.querySelector('#next');

				if(nextLink){
					nextLink = pageCollector.$helpers.escapeHtmlEntities(nextLink.getAttribute('href'));
					linkModel = new this.$request.UniversalLink(nextLink);
					linkModel.inherit(this.location);
					nextLink = linkModel.toString();

					console.log('Continue: %s', nextLink);

					return this.download(nextLink);
				}				
			}else{
				return true;	
			}
		});
	}
	// @param {():Object => {}} onnext
	// @param {(Object) => {}} oncomplete
	// @param {Array?} report
	proceedPages(onnext, oncomplete, report){
		var 	link = this.links.shift();
		var 	report = report || [];

		if(link){
			this.$request.fetch(this.$request.getUriConfig('GET', link, {
				Connection: 'keep-alive',
				Accept: '*/*',
				// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
				// 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Encoding': 'gzip, deflate, sdch',
				'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
			}), (d) => {
				report.push(onnext(link, d));
				// continue
				this.proceedPages(onnext, oncomplete, report);
			}, (e) => {
				console.warn('Troubles while downloading: %s', link);
				console.dir(e);
				// Report about error and continue
				this.proceedPages(onnext, oncomplete, report);
			});
		}else{
			oncomplete(report);
		}
	}
}

let pageCollector = new PageCollector(
	$request, 
	$xmlParser, 
	new $iconv('cp1252', 'utf-8'),
	(function(){
		var _date = new $literalCompiler.Phrase('{0.YY}-{0.MM}-{0.DD}');

		return function(date){
			return _date.compile(new $literalCompiler.DateFormat(date));
		}
	}()),
	{
		// HELPERS:
		getFirstMatch: function getFirstMatch(pattern, str){
			var match = pattern.exec(str);

			return match && match[1];
		},
		escapeHtmlEntities: (function(){
			// More unicode cracters at https://en.wikipedia.org/wiki/List_of_Unicode_characters
			// Convertion ('à'.charCodeAt(0)).toString(16)
			var _entitiesMap = { 
				'&amp;': '&',
				'&agrave;': '\u00e0', // à
				'&eacute;': '\u00e9', //é
				'&nbsp;': ' ',
				'&euro;': '\u20ac',
			}; 
			var _entityReg = new RegExp('(' + Object.keys(_entitiesMap).join('|') + ')', 'ig');

			return function escapeHtmlEntities(str){
				return str.replace(_entityReg, function(sub, char){
					return _entitiesMap[char];
				});
			}
		}())
	}
);



// TODO refactor that code
pageCollector.download(link).then(function(){
	console.log('Founded %s links', pageCollector.links.length);

	pageCollector.proceedPages(function(link, d){
		// Prepare response body
		var		body;

		// Try to convert at unicode
		var 	contentType = d.response.headers['content-type'] || '',
				charsetTypeMatch = /charset=([^;]+)/ig.exec(contentType),
				charset = charsetTypeMatch && charsetTypeMatch[1];

		if(charset == 'windows-1252'){
			body = pageCollector.$translator.convert(d.body).toString();
		}else{
			body = d.body.toString();
		}

		console.log('Downloaded: %s, %s charset: %s', link, body.length, charset);

		// Parse document
		var 	doc = pageCollector.$parser.parseDocument(body, {isHtml: true}),
 				// descriptionNode = doc.querySelector('.properties_description>[itemprop="description"]'),
 				data = doc.querySelectorAll('.property'),
 				i = data && data.length,
 				property, value,
 				properties = {};

 		while(i-- > 0){
 			property = data[i].getTextContent();

 			if(value = data[i].parentNode.querySelector('.value')){
 				value = pageCollector.$helpers.escapeHtmlEntities(value.getTextContent());
 			}
 			properties[property.trim()] = value.trim();
 		}

 		// Find coordnates (var lat = "43.70652 ";)
 		let 	lng = (pageCollector.$helpers.getFirstMatch(/var\s+lng\s*=\s*"([^\"]+)"/i, body) || '').trim(),
 				lat = (pageCollector.$helpers.getFirstMatch(/var\s+lat\s*=\s*"([^\"]+)"/i, body) || '').trim();

		return {
			link,
			properties,
			// description: descriptionNode && descriptionNode.getTextContent(),
			lng,
			lat
		};
	}, function(report){
		console.log('[Report]');
		// ';var data = ' + + ';'
		let filePath = './examples/data.json';

		filePath = '../../_projects/lebon/lebon-app/src/assets/data.json';

		$fs.writeFile( filePath,  JSON.stringify(report, null, '\t'), function(err) {
		    if(err){
		        return console.log(err);
		    }
		}); 
	});
});
