const 	$request = require('./../xrequest');	
var 	$iconv = require('iconv').Iconv;

var 	translator = new $iconv('cp1252', 'utf-8');



$request.fetch($request.getUriConfig('GET', 'https://www.leboncoin.fr/locations/1345401087.htm?ca=21_s', {
	Connection: 'keep-alive',
	Accept: '*/*',
	// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
	// 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
	'Accept-Encoding': 'gzip, deflate, sdch',
	'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
	'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
}), function(d){
	var 	body;

	var 	contentType = d.response.headers['content-type'] || '', // 'content-type': 'text/html; charset=windows-1252',
			charsetTypeMatch = /charset=([^;]+)/ig.exec(contentType),
			charset = charsetTypeMatch && charsetTypeMatch[1];

	if(charset == 'windows-1252'){
		console.log('Charset: `%s`', charset);	
		body = translator.convert(d.body).toString();
	}else{
		body = d.body.toString();
	}

	console.log('Body');
	console.dir(body);
	
}, function(e){
	console.warn('Troubles while downloading: %s', link);
	console.dir(e);
});
