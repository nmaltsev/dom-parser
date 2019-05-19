
var		$xmlParser = require('./../xml_parser'),
			xrequest = require('./../xrequest');
let $fs = require('fs');

var links = [];
var links = ``.split('\n');



// Convert  String link to Xrequest Object
let xrequests = links.filter((link_s) => !!link_s).map((link) => {
	return xrequest.getUriConfig('GET', link, {
		Connection: 'keep-alive',
		Accept: '*/*',
		// 'Referer': 'https://addons.mozilla.org/ru/firefox/',
		// 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
		'Accept-Encoding': 'gzip, deflate, sdch',
		'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.6,en;q=0.4',
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36',	
	});
});

function parseSrcSet(s) {
	return s.split(',').reduce((collection, source_s) => {
		let pos = source_s.trim().indexOf(' ');

		if (pos != -1) {
			let link_s = source_s.substr(0, pos + 1).trim();
			let dim_s = source_s.substr(pos + 1).trim();

			collection[dim_s] = link_s;
		}
		return collection;
	}, {});
}

function linkType(url_s) {
	if (url_s.indexOf('http')==0) {
		return 1;
	} else if (url_s.indexOf('/')==0) {
		return 2;
	} else {
		return 0;
	}
}

function getUrlParent(url_s) {
	let path = url_s;
	let pos = url_s.indexOf('?');
	if (pos > -1) {
		path = path.substr(0, pos);
	} 
	pos = path.lastIndexOf('/');
	if (pos > -1) {
		path = path.substr(0, pos) + '/';
	}
	return path;
}

function LinkCollector(requests) {
	let _requests = requests;
	let _report = [];
	
	return function next() {
		//return new Promise(function(resolve, reject) {
			if (_requests.length > 0) {
				let reqData = _requests.pop();
				
                                
				return xrequest
					.petch(reqData)
					.then(function(d){
						let 	$doc = $xmlParser.DocumentBuilder.parse(d.body.toString(), {parseHtml: true});
						let 	$resp = $doc.querySelectorAll('a[href*=".jpg"]');
						let		imgLinks = [];

						if ($resp) {
							let i = $resp.length;
							let link_s;
							while(i-- > 0) {
								if (link_s = $resp[i].getAttribute('href')) {
									
									if (!linkType(link_s)) {
										// relative
										link_s = getUrlParent(xrequest.restoreUrl(reqData)) + link_s;
										
									} else {
										// direct or absolute
									}
									imgLinks.push(link_s);
								}
							}
							_report.push(imgLinks);
						}

						return next();
					}).catch(function(er){
						console.log('Fetch failed');
                                                console.log(xrequest.restoreUrl(reqData));
						console.dir(er);
					});
			} else {
				//console.log('Completed');
				//console.dir(_report);
				return Promise.resolve(_report);
			}
		//});
	};
}
//////////////////////////////
let start = LinkCollector(xrequests);
start().then(function(report){
	console.log('Complete');
	//console.dir(report.reduce((list, sublist) => list.concat(sublist), []).join('\n'));
	$fs.writeFile('links.txt', report.reduce((list, sublist) => list.concat(sublist), []).join('\n'), function(d){
		console.log('File write');
		console.dir(d);
	})
});
