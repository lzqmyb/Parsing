'use strict';
const fs = require('fs');
const path = require('path');

const manifestFile = 'manifest.rc'

class Parsing {
	constructor(filepath) {
		if (fs.existsSync(path.join(filepath, manifestFile)))
			this.lines = fs.readFileSync(path.join(filepath, manifestFile), 'utf-8').split('\n');
		else {
			console.log('Parsing: can not get ' + path.join(filepath, manifestFile) + '.');
		}
		this.currLineNum = 0;
		this.totalLines = this.lines.length;
		this.user = {
			select: [],
			abandon: []
		};
	}

	getNext() {
		this.currLineNum++;
		if (this.currLineNum > this.totalLines) {
			return null;
		} else {
			return this._check(this.lines[this.currLineNum - 1]);
		}
	}

	_checkJSON(str) {
		return /\{.*\}/.test(str)
	}

	_checkComment(str) { //检查是否为注释模式
		return /###.*/.test(str);
	}

	_checkSingle(str) { //检查是否为单语句
		let re = /([a-zA-Z0-9]*\.(wav|ogg))/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1]) {
				return {
					sound: result[1]
				}
			}
		}
		return null;
	}

	_checkIfSingle(str) { //检查是否为单语句的If模式
		let re = /([a-zA-Z0-9]*\.(wav|ogg))\s+([a-zA-Z0-9]*\.(wav|ogg))/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1] && result[3]) {
				return {
					flag: result[1],
					sound: result[3]
				}
			}
		}
		return null;
	}

	_checkChoice(str) { //检查是否为choice模式，含有默认值
		let re = /([a-zA-Z0-9]*\.(wav|ogg))\s+(\{.*\})\s+([a-zA-Z0-9]*\.(wav|ogg))/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1] && result[3] && result[4]) {
				return {
					flag: result[1],
					choice: result[3],
					default: result[4]
				}
			}
		}
		return null;
	}

	_checkChoiceNoDefault(str) { //检查choice模式，不含默认值
		let re = /([a-zA-Z0-9]*\.(wav|ogg))\s+(\{.*\})/;
		if (re.test(str)) {
			let result = re.exec(str);
			// console.log(result);
			if (result[1] && result[3]) {
				return {
					flag: result[1],
					choice: result[3]
				}
			}
		}
		return null;
	}

	_checkChoiceOnly(str) {
		let re = /(\{.*\})/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1]) {
				return {
					choice: result[1]
				}
			}
		}
		return null;
	}

	_checkChoiceOnlyWithDefault(str) {
		let re = /(\{.*\})\s+([a-zA-Z0-9]*\.(wav|ogg))/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1] && result[2]) {
				return {
					choice: result[1],
					sound: result[2]
				}
			}
		}
	}

	_checkShare(str) {
		let re = /\$share/;
		if (re.test(str)) return true;
		return null;
	}

	_selected(str) {
		return this.user.select.indexOf(str) !== -1;
	}

	_abandon() {
		return this.user.abandon.indexOf(str) !== -1;
	}

	_check(str) {
		if (this._checkJSON(str)) { //如果语句中含有json
			if (this._checkChoice(str)) { // c2.wav {'c5.wav': ['左'], 'c6.wav': ['右']} 01.wav
				if (this._selected(this._checkChoice(str).flag)) {
					//进入choice
				} else {
					this.getNext();
				}
				console.log("_checkChoice" + JSON.stringify(this._checkChoice(str)));
			} else if (this._checkChoiceNoDefault(str)) { //c2.wav {'c5.wav': ['左'], 'c6.wav': ['右']}
				if (this._selected(this._checkChoiceNoDefault(str))) {
					//进入choice
				} else {
					this.getNext();
				}
				console.log("_checkChoiceNoDefault" + JSON.stringify(this._checkChoiceNoDefault(str)));
			} else if (this._checkChoiceOnlyWithDefault(str)) { //{'c5.wav': ['左'], 'c6.wav': ['右']} 01.wav


				console.log("_checkChoiceOnlyWithDefault" + JSON.stringify(this._checkChoiceOnlyWithDefault(str)));
			} else if (this._checkChoiceOnly(str)) { //{'c5.wav': ['左'], 'c6.wav': ['右']}
				console.log("_checkChoiceOnly" + JSON.stringify(this._checkChoiceOnly(str)));
			}
		} else { //如果语句中不含有json
			if (this._checkIfSingle(str)) { //c9.wav end1.wav
				if (this._selected(this._checkIfSingle(str).flag)) {
					this.user.select.push(this._checkIfSingle(str).flag);
				} else {
					this.getNext();
				}
				console.log("_checkIfSingle" + JSON.stringify(this._checkIfSingle(str)));
			} else if (this._checkSingle(str)) { //c9.wav
				this.user.select.push(this._checkSingle(str).flag);
				console.log("_checkSingle" + JSON.stringify(this._checkSingle(str)));
			} else if (this._checkShare(str)) { //$share
				console.log("_checkShare: share 模式。");
			}
		}
	}

	init() {
		while (this.currLineNum <= this.totalLines) this.getNext();
	}
}

module.exports = Parsing;
