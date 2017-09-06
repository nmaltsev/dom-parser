var 	$http = require('http'),
		$https = require('https'),	
		$zlib  = require('zlib');

function fetch(reqData, _next, _reject){
	var req = (reqData.protocol != 'https:' ? $http : $https).request(reqData.config, function(res){
		var 	chunks = [],
				encoding = res.headers['content-encoding'];

	    res.on('data', function(chunk){
	    	chunks.push(chunk);
	    });

	    res.on('end', function(){
	      	var 	buffer = Buffer.concat(chunks);
	      	
	      	if(encoding == 'gzip'){
		        $zlib.gunzip(buffer, function(err, decoded){
		          	if(err){
		          		_reject(err);
		          	}else{
		          		_next(decoded && decoded.toString(), res);
		          	}
		        });
	      	}else if(encoding == 'deflate'){
		        $zlib.inflate(buffer, function(err, decoded){
		          	if(err){
		          		_reject(err);
		          	}else{
		          		_next(decoded && decoded.toString(), res);
		          	}	
		        });
	      	}else{
	        	_next(buffer.toString(), res)
	      	}
	    });
	});
	req.write('');
  	req.end();
}
function TinyUrlParser(url, separateProperties){
	var 	res = Object.create(null), 
			pos;

	if(separateProperties){
		pos = url.indexOf('#')
		if(pos != -1){
			res.hash = url.substr(pos + 1);
			url = url.substr(0, pos);
		}
		pos = url.indexOf('?');
		if(pos != -1){
			res.query = url.substr(pos + 1);
			url = url.substr(0, pos);
		}	
	}
	
	pos = url.indexOf('//');
	if(pos != -1){
		res.protocol = url.substr(0, pos);
		url = url.substr(pos + 2);
	}
	pos = url.indexOf('/');
	if(pos != -1){
		res.path = url.substr(pos);
		url = url.substr(0, pos);
	}else{
		res.path = '/';
	}
	pos = url.indexOf(':');
	if(pos != -1){ // skip port
		url = url.substr(0, pos);
	}
	res.host = url;

	return res;
}
function getUriConfig(method, url, headers){
	var 	data = TinyUrlParser(url, false);
	
	return {
		protocol: data.protocol,
		config: {
			method: method,
			host: data.host,
			port: data.port || (data.protocol != 'https:' ? 80 : 443),
			path: data.path,
			headers: headers
		},
	};
}		

module.exports.fetch = fetch;
module.exports.getUriConfig = getUriConfig;