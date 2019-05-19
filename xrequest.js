var 	$http = require('http'),
		$https = require('https'),	
		$zlib  = require('zlib');

$https.globalAgent.options.ca = require('ssl-root-cas/latest').create();

function fetch(reqData, _next, _reject){
	var req = (reqData.protocol != 'https:' ? $http : $https).request(reqData.config, function(res){
		var 	chunks = [],
				encoding = res.headers['content-encoding'];

		// res.setEncoding('binary');
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
		          		_next({
		          			// body: decoded && decoded.toString(),
		          			// Represent request body at Buffer
		          			body: decoded,
		          			response: res,
		          		});
		          	}
		        });
	      	}else if(encoding == 'deflate'){
		        $zlib.inflate(buffer, function(err, decoded){
		          	if(err){
		          		_reject(err);
		          	}else{
		          		_next({
		          			// body: decoded && decoded.toString(),
		          			body: decoded,
		          			response: res,
		          		});
		          	}	
		        });
	      	}else{
	        	_next({
          			// body: buffer.toString(),
          			body: buffer,
          			response: res,
          		});
	      	}
	    });
	});
	req.write('');
  	req.end();
}

function petch(reqData){
	return new Promise(function(_resolve, _reject){
		fetch(reqData, _resolve, _reject);
	});
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

// @DEPRICATED
function getUriConfig(method, url, headers){
	var 	data = TinyUrlParser(url, false);
	
	return {
		protocol: data.protocol,
		config: {
			method: method,
			rejectUnauthorized: false, // for https
			host: data.host,
			port: data.port || (data.protocol != 'https:' ? 80 : 443),
			path: data.path,
			headers: headers
		},
	};
}	


class UniversalLink{
	// @param {Object} url - link
	constructor(url){
		this._parse(url);
	}
	_parse(url){
		var 	pos;

		pos = url.indexOf('#');

		if(pos != -1){
			this.hash = url.substr(pos + 1);
			url = url.substr(0, pos);
		}
		pos = url.indexOf('?');

		if(pos != -1){
			this.query = url.substr(pos + 1);
			url = url.substr(0, pos);
		}	
		
		pos = url.indexOf('//');

		if(pos != -1){
			this.protocol = url.substr(0, pos);
			url = url.substr(pos + 2);
		}
		pos = url.indexOf('/');

		if(pos != -1){
			this.path = url.substr(pos);
			url = url.substr(0, pos);
		}else{
			this.path = '/';
		}
		pos = url.indexOf(':');

		if(pos != -1){ // skip port
			this.port = url.substr(pos);
			url = url.substr(0, pos);
		}
		this.host = url;		
	}
	// @param {UniversalLink} urlObject
	inherit(urlObject){
		if(urlObject instanceof this.constructor){
			if(!this.protocol){
				this.protocol = urlObject.protocol;
			}
			if(!this.host){
				this.host = urlObject.host;
			}
			if(!this.port){
				this.port = urlObject.port;
			}
			if(!this.path){
				this.path = urlObject.path;
			}else if(this.path.charAt(0) != '/'){
				this.path = urlObject.path + (urlObject.path.charAt(urlObject.path.length - 1) != '/' ? '/' : '') + this.path;
			}

			return urlObject;
		}
	}

	toString(){
		return (this.protocol || 'http') + '//' + this.host + (this.port ? ':' + this.port : '') + this.path + (this.query ? '?' + this.query : '');
	}

	getUriConfig(method_s, headers) {
		return {
			protocol: this.protocol,
			config: {
				method: method_s,
				rejectUnauthorized: false, // for https
				host: this.host,
				port: this.port || (this.protocol != 'https:' ? 80 : 443),
				path: this.path,
				headers: headers
			},
		};
	}
}	

module.exports.fetch = fetch;
module.exports.petch = petch;
module.exports.getUriConfig = getUriConfig;
module.exports.UniversalLink = UniversalLink;