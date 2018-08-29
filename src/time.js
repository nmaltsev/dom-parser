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

module.exports.Time = Time;