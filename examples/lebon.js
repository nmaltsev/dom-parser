const 	$request = require('./../xrequest');	
const 	$xmlParser = require('./../xml_parser');
// const 	$iconv = require('iconv').Iconv;
const 	$fs = require('fs');
const 	$literalCompiler = require('./../src/literal_compiler');

// const 	REPORT_PATH = '../../_projects/lebon/lebon-app/src/assets/data.json';
const 	REPORT_PATH = 'data.json';

function timeMetter() {
	var _start_n = Date.now();
	return function(){
		return Date.now() - _start_n;
	}
}




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
	}
	// @param {String|UniversalLink} link
	// @param {string[]} links
	download(link, links){
		var 	_location;
		var 	_links = links || [];

		if (link instanceof this.$request.UniversalLink) {
			_location = link;
		} else {
			_location = new this.$request.UniversalLink(link);	
		}
		// this.$helpers.delay(this.$helpers.getRand(3000)).then(() => {
			return this.$request.petch(this.$request.getUriConfig('GET', link, {
				Connection: 'keep-alive',
				Accept: '*/*',
				'Referer': 'https://addons.mozilla.org/ru/firefox/',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
				'Accept-Encoding': 'gzip, deflate, sdch',
				'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
			})).then((d) => {
				var 	doc = $xmlParser.DocumentBuilder.parse(d.body.toString(), {parseHtml: true}),
				 		links = doc.querySelectorAll('[itemtype="http://schema.org/Offer"]>a');

				var		isCompleted = false,
						i = Array.isArray(links) && links.length,
						link, 
						linkModel,
						date_s;

				console.log('Body size: %s', d.body.length);	

				if (i < 1) {
					console.log(d.body.toString());	
				}
				

				while(i-- > 0){
					link = links[i].getAttribute('href');
					
					if(date_s = links[i].querySelector('[itemprop="availabilityStarts"]')){
						date_s = date_s.getAttribute('content').toLowerCase();

						if (date_s.indexOf('aujourd') == -1 && date_s.indexOf('hier') == -1) {
							isCompleted = true;
						}
					}else{
						isCompleted = true;
					}

					linkModel = new this.$request.UniversalLink(link);
					linkModel.inherit(_location);
					_links.push(linkModel.toString());
				}

				console.log('Founded links: %s, isCompleted: %s', _links.length, isCompleted);

				if (!isCompleted) {
					let nextLink = doc.querySelector('[name="chevronRight"]');

					if(nextLink = nextLink && nextLink.parentNode){
						nextLink = pageCollector.$helpers.escapeHtmlEntities(nextLink.getAttribute('href'));
						linkModel = new this.$request.UniversalLink(nextLink);
						linkModel.inherit(_location);
						nextLink = linkModel.toString();

						console.log('Continue: %s', nextLink);

						// return this.download(nextLink, _links);

						return this.$helpers.delay(this.$helpers.getRand(3000)).then(() => {
							return this.download(nextLink, _links);						
						});
					}				
				}else{
					return _links;	
				}
			});
		// });
	}
	// @param {():Object => {}} onnext
	// @param {(Object) => {}} oncomplete
	// @param {Array?} report
	proceedPages(links, onnext, oncomplete, report){
		var 	link = links.shift();
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
				setTimeout(() => {
					// continue
					this.proceedPages(links, onnext, oncomplete, report);
				}, this.$helpers.getRand(3000));
			}, (e) => {
				console.warn('Troubles while downloading: %s', link);
				console.dir(e);
				// Report about error and continue
				this.proceedPages(links, onnext, oncomplete, report);
			});
		}else{
			oncomplete(report);
		}
	}
}

let pageCollector = new PageCollector(
	$request, 
	$xmlParser, 
	// new $iconv('cp1252', 'utf-8'),
	null,
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
		}()),
		flatten: function(collection){
			if (Array.isArray(collection)) {
				let len = collection.length;

				if (len < 2) {
					return collection[0];
				} else {
					let out = [];

					for(let i =0; i < len; i++) {
						out = out.concat(collection[i]);
					}
					return out;
				}
			} else {
				return collection;
			}
		},
		delay: function(time_n) {
			return new Promise(function(resolve){
				setTimeout(function(){
					resolve();
				}, time_n);
			})
		},
		getRand: function(min_n){
			return min_n + ~~(Math.random() * 10000);
		}
	}
);


const _getTimeFromBegining = timeMetter(); 
Promise.all(
	[
		'https://www.leboncoin.fr/recherche/?category=10&regions=21&cities=Nice_06000,Nice_06200,Antibes_06600,Juan-les-Pins_06160&furnished=1&real_estate_type=2,1&price=300-900&rooms=1-3&square=25-60',
		'https://www.leboncoin.fr/recherche/?category=10&regions=21&cities=Villeneuve-Loubet_06270,Cagnes-sur-Mer_06800,Biot_06410&furnished=1&real_estate_type=2,1&price=300-900&rooms=1-3&square=25-60',
		'https://www.leboncoin.fr/recherche/?category=10&regions=21&cities=Valbonne_06560,Vallauris_06220&furnished=1&real_estate_type=2,1&price=300-900&rooms=1-3&square=25-60'
	].map((link_s) => pageCollector.download(link_s))
).then(function(results){
	var links = pageCollector.$helpers.flatten(results);
	
	console.log('Collected %s links', links.length);
	pageCollector.proceedPages(
		links,
		function(link, d){
			// Prepare response body
			var		body;

			// Try to convert at unicode
			var 	contentType = d.response.headers['content-type'] || '',
					charsetTypeMatch = /charset=([^;]+)/ig.exec(contentType),
					charset = charsetTypeMatch && charsetTypeMatch[1];

			if(charset == 'windows-1252' && pageCollector.$translator){
				body = pageCollector.$translator.convert(d.body).toString();
			}else{
				body = d.body.toString();
			}

			console.log('Downloaded: %s, %s charset: %s', link, body.length, charset);

			// Parse document
			var 	doc = pageCollector.$parser.DocumentBuilder.parse(body.toString(), {parseHtml: true}),
					key_s,
	 				properties = {};

	 		properties['description'] = doc.querySelector('[data-qa-id="adview_description_container"]>div:nth-child(1)');
	 		properties['cost'] = doc.querySelector('[data-qa-id="adview_price"]');
	 		properties['surface'] = doc.querySelector('[data-qa-id="criteria_item_square"]>div>div:last-child');
	 		properties['rooms'] = doc.querySelector('[data-qa-id="criteria_item_rooms"]>div>div:last-child');
	 		properties['isMeuble'] = doc.querySelector('[data-qa-id="criteria_item_furnished"]>div>div:last-child');
	 		properties['city'] = doc.querySelector('[data-qa-id="adview_location_informations"]>span');

	 		for (key_s in properties) {
	 			if (properties.hasOwnProperty(key_s)) {
	 				if (properties[key_s]) {
	 					properties[key_s] = properties[key_s].getTextContent();
	 				} else {
	 					console.warn('There is no `%s` at downloaded page', key_s);
	 				}
	 			}
	 		}


	 		// let 	lng = (pageCollector.$helpers.getFirstMatch(/var\s+lng\s*=\s*"([^\"]+)"/i, body) || '').trim(),
	 		// 		lat = (pageCollector.$helpers.getFirstMatch(/var\s+lat\s*=\s*"([^\"]+)"/i, body) || '').trim();

			return {
				link,
				properties,
				// lng,
				// lat
			};
		}, 
		function(report){
			console.log('[Report is ready] total time: %s', _getTimeFromBegining());

			$fs.writeFile(REPORT_PATH, JSON.stringify(report, null, '\t'), function(err) {
			    if(err){
			        return console.log(err);
			    }
			}); 
		}
	);
})

