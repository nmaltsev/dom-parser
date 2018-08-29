/*
Example of usage
tf = new Phrase('{0.YY}-{0.MM}-{0.DD}'),
tf.compile(DateFormat(new Date())))
*/

//===================================
// Phrase
//===================================
function Phrase(template, overrides){
	this.parts = this._parse(template);
	this.overrides = overrides || {};
}
Phrase.prototype._parse = function(str){
	var 	parts = [],
			pos = 0,
			prev = 0,
			dotPos,
			part,
			direction = true;
	
	while(pos != -1){
		pos = str.indexOf((direction ? '{' : '}'), prev);
		part = pos != -1 ? str.substring(prev, pos) : str.substring(prev);
		
		if(str[pos-1] != '\\' ){ // open 
			if(direction){ // text
				part && parts.push(part);
			}else{ // variable
				dotPos = part.indexOf('.');
				parts.push(dotPos != -1 ? {
					id: part.substring(0, dotPos) || 0,
					prop: part.substring(dotPos + 1)
				} : {
					id: part
				});	
			}
			direction = !direction;
		}else{ // escaping without change direction
			parts.push(part.slice(0, -1) + (direction ? '{' : '}'));
		}
		prev = pos + 1;
	}
	return parts;
}
Phrase.prototype.compile = function(){
	var 	str = '',
			inst,
			i = this.parts.length;
	
	while(i-- > 0){
		if(sub = this.parts[i]){
			if(typeof(sub) == 'object'){
				inst = arguments[sub.id] || arguments[0][sub.id];
				sub = sub.prop && inst && inst.exec ? inst.exec(sub.prop) : (inst + '');
			}
			str = sub + str;	
		}
	}
	return str;
};

//===================================
// FormatDate
//===================================
function DateFormat(date, overrides){
	if(!(this instanceof DateFormat)){
		return new DateFormat(date, overrides);
	}
	this._overrides = overrides || {};
	this._d = date instanceof Date ? date : new Date(date);
}
DateFormat.prototype.withZero = function(n){
	return (n < 10 ? '0': '') + n;
};
DateFormat.prototype.patterns = {
	'hh': function(self, d){ return self.withZero(d.getHours());},
	'h12': function(self, d){
		var h = d.getHours();
		return h > 12 ? h - 12 : h;
	},
	'mm': function(self, d){ return self.withZero(d.getMinutes());},
	'ss': function(self, d){ return self.withZero(d.getSeconds());},
	'D': function(self, d){ return d.getDate();},
	'DD': function(self, d){ return self.withZero(d.getDate());},
	'MM': function(self, d){ return self.withZero(d.getMonth() + 1);},
	'YY': function(self, d){return d.getFullYear();},
	'Y': function(self, d){return d.getFullYear() - 2000;},
}
DateFormat.prototype.exec = function(method){
	return (this._overrides[method] || this.patterns[method])(this, this._d);
}
// Todo Use monkey patching for localization of months!
DateFormat.define = function(key, pattern){
	this.prototype.patterns[key] = pattern;
};

module.exports.Phrase = Phrase;
module.exports.DateFormat = DateFormat;