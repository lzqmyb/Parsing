'use strict';
const fs = require('fs');
const path = require('path');

class Parsing {
	constructor(file) {
		this.lines = fs.readFileSync(file, 'utf-8').split('\n');
		this.currLineNum = 11;
		this.totalLines = this.lines.length
	}
	getNext() {
		this.currLineNum++;
		if (this.currLineNum >= this.totalLines) {
			return null;
		} else {
			return this.lines[this.currLineNum - 1];
		}
	}
}

module.exports = Parsing;
