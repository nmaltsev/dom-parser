const 	$request = require('./../xrequest');	
const 	$xmlParser = require('./../xml_parser');
const	$parseDocument = $xmlParser.parseDocument;	
const 	$iconv = require('iconv').Iconv;
const 	$fs = require('fs');
const 	$literalCompiler = require('./../src/literal_compiler');

var link = 'https://www.leboncoin.fr/recherche/?category=10&regions=21&cities=Nice_06000,Nice_06200,Antibes_06600,Biot_06410&real_estate_type=2&furnished=1&price=300-850&rooms=1-2&square=20-50';


/*
Test case

let d = Time.from();
d.diff(new Date(), 's');
*/
class Time {
	constructor(date_Date) {
		console.log(this);
		this._d_Date = date_Date || new Date();
	}
	beginOfDate() {
		this._d_Date.setHours(0, 0, 0);
		return this;
	}
	yesterday() {
		this._d_Date.setDate(this._d_Date.getDate() - 1);
		return this;
	}
	toDate() {
		return this._d_Date;
	}
	clone() {
		return new Time(new Date(this._d_Date));
	}
	diff(date_Date, dimension_s){
		const diff_n = date_Date - this._d_Date;
		let out_s;

		switch(dimension_s) {
			case 's': out_s = ~~(diff_n / 1000); break;
			case 'm': out_s = ~~(diff_n / 60000); break;
			case 'h': out_s = ~~(diff_n / 360000); break;
		}	
		return out_s;
	}
}
Time.from = function(date_Date){
	return new Time(date_Date);
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
			'Referer': 'https://addons.mozilla.org/ru/firefox/',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate, sdch',
			'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
		})).then((d) => {
			var 	doc = this.$parser.parseDocument(d.body.toString(), {isHtml: true}),
			 		// links = doc.querySelectorAll('.tabsContent>ul>li>a');
			 		links = doc.querySelectorAll('[itemtype="http://schema.org/Offer"]>a');

			// var 	now = new Date(),
			// 		currentDate = this.$timeFormatter(now);

			// let 	now = Time.from(),
			// 		currentDate = now.diff(now.clone().beginOfDate(), 'h') > 12 ? this.$timeFormatter(now.toDate()) : this.$timeFormatter(now.yesterday().toDate());

			var		isCompleted = false,
					i = Array.isArray(links) && links.length,
					link, 
					linkModel,
					date_s;

			console.log('Body size: %s, today: %s', d.body.length);	

			while(i-- > 0){
				link = links[i].getAttribute('href');
				
				if(date_s = links[i].querySelector('[itemprop="availabilityStarts"]')){
					date_s = date_s.getAttribute('content').toLowerCase();


					// if(date != currentDate){ // when we find another date
					if (date_s.indexOf('aujourd') == -1 && date_s.indexOf('hier') == -1) {
						isCompleted = true;
					}
				}else{
					isCompleted = true;
				}

				// Aujourd'hui, 10:03, hier

				console.log('Link: %s, date: %s', link, date_s || '-');
				
				linkModel = new this.$request.UniversalLink(link);
				linkModel.inherit(this.location);
				this.links.push(linkModel.toString());

				// console.log('D: %s, link: %s', date, link);
				// console.log('M: %s', linkModel);
			}

			console.log('Founded links: %s, isCompleted: %s', links.length, isCompleted);

			if (!isCompleted) {
				let nextLink = doc.querySelector('[name="chevronRight"]');

				if(nextLink = nextLink.parentNode){
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
	}, function(report){
		console.log('[Report]');
		// ';var data = ' + + ';'
		let filePath = './examples/data.json';

		filePath = '../../_projects/lebon/lebon-app/src/assets/data.json';

		// console.log('Report');
		// console.dir(report);

		$fs.writeFile( filePath,  JSON.stringify(report, null, '\t'), function(err) {
		    if(err){
		        return console.log(err);
		    }
		}); 
	});
});
