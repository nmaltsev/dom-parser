const $request = require('./../xrequest');	


var link = 'https://www.leboncoin.fr/locations/offres/provence_alpes_cote_d_azur/?th=1&location=Nice%2CAntibes%2006600%2CCagnes-sur-Mer%2006800&sqs=1&ros=1&ret=2';

$request.fetch($request.getUriConfig('GET', link, {
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
	// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
	'Connection': 'keep-alive',
	'Accept':
	'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	'Accept-Encoding': 'gzip, deflate, sdch',
	'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
	Accept: '*/*',
}), function(body, res){
	// console.dir(conf);
	console.log('Success');
	console.log(body);
	// console.dir(res.headers);
	
	// get all notices: '.tabsContent>ul>li'
	// find '[itemprop="availabilityStarts"]' extract attribute (content="2017-11-28")
	// get next link (extract href attribute): '#next'


/*
<p class="item_supp" itemprop="availabilityStarts" content="2017-11-28">
		                            
		                            Aujourd'hui, 12:12
	                            </p>
*/	


}, function(er){
	console.log('Fetch failed');
	console.dir(er);
});