const 	$request = require('./../xrequest');	
const 	$xmlParser = require('./../xml_parser');
const	$parseDocument = $xmlParser.parseDocument;	


var link = 'https://www.leboncoin.fr/locations/offres/provence_alpes_cote_d_azur/?th=1&location=Nice%2CAntibes%2006600%2CCagnes-sur-Mer%2006800&sqs=1&ros=1&ret=2';

class PageCollector{
	// @param {Object} $request
	// @param {Object} $parser
	constructor(url, $request, $parser){
		this.$request = $request;
		this.$parser = $parser;
		this.links = [];
	}
	// @param {String} link
	download(link){
		return this.$request.petch(this.$request.getUriConfig('GET', link, {
			Connection: 'keep-alive',
			Accept: '*/*',
			// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
			// 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate, sdch',
			'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
		})).then((d) => {
			var 	doc = this.$parser.parseDocument(d.body, {isHtml: true}),
			 		links = doc.querySelectorAll('.tabsContent>ul>li>a');

			var 	now = new Date(),
					currentDate = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();

			var		isCompleted = false,
					i = Array.isArray(links) && links.length,
					link, 
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
				console.log('D: %s, link: %s', date, link);
				this.links.push(link);
			}

			console.log('Founded links: %s, isCompleted: %s', links.length, isCompleted);
			// get next link (extract href attribute): '#next'

			if(!isCompleted){
				let nextLink = doc.querySelector('#next');

				if(nextLink){
					nextLink = nextLink.getAttribute('href');

					console.log('Continue: %s', nextLink);
					// TODO parse and continue recursion 
					// return this.download(nextLink)

					return true;
				}				
			}else{
				return true;	
			}
		})
	}
}

let pageCollector = new PageCollector($request, $xmlParser);

pageCollector.download(link).then(function(){
	console.log('Completed');
})