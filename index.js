'use strict';
const fs = require('fs');
const path = require('path');

const Choice = require('./util/choice');
const Play = require('./util/play');

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
		this.choice = new Choice();
		this.play = new Play(filepath);
		this.result = {};
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
				this.result = {
					sound: result[1]
				}
				return true;
			}
		}
		return null;
	}

	_checkIfSingle(str) { //检查是否为单语句的If模式
		let re = /([a-zA-Z0-9]*\.(wav|ogg))\s+([a-zA-Z0-9]*\.(wav|ogg))/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1] && result[3]) {
				this.result = {
					flag: result[1],
					sound: result[3]
				}
				return true;
			}
		}
		return null;
	}

	_checkChoice(str) { //检查是否为choice模式，含有默认值
		let re = /([a-zA-Z0-9]*\.(wav|ogg))\s+(\{.*\})\s+([a-zA-Z0-9]*\.(wav|ogg))/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1] && result[3] && result[4]) {
				this.result = {
					flag: result[1],
					choice: result[3],
					default: result[4]
				}
				return true;
			}
		}
		return null;
	}

	_checkChoiceNoDefault(str) { //检查choice模式，不含默认值
		let re = /([a-zA-Z0-9]*\.(wav|ogg))\s+(\{.*\})/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1] && result[3]) {
				this.result = {
					flag: result[1],
					choice: result[3]
				}
				return true;
			}
		}
		return null;
	}

	_checkChoiceOnly(str) {
		let re = /(\{.*\})/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1]) {
				this.result = {
					choice: result[1]
				}
				return true;
			}
		}
		return null;
	}

	_checkChoiceOnlyWithDefault(str) {
		let re = /(\{.*\})\s+([a-zA-Z0-9]*\.(wav|ogg))/;
		if (re.test(str)) {
			let result = re.exec(str);
			if (result[1] && result[2]) {
				this.result = {
					choice: result[1],
					default: result[2]
				}
				return true;
			}
		}
		return null
	}

	_checkShare(str) {
		return /\$share/.test(str);
	}

	_selected(str) {
		return this.user.select.indexOf(str) !== -1;
	}

	_abandon() {
		return this.user.abandon.indexOf(str) !== -1;
	}

	_check(str) {
		return new Promise((resolve, reject) => {
			if (this._checkJSON(str)) { //如果语句中含有json
				if (this._checkChoice(str)) { // c2.wav {'c5.wav': ['左'], 'c6.wav': ['右']} 01.wav
					console.log("_checkChoice " + JSON.stringify(this.result));
					if (this._selected(this.result.flag)) {
						//进入choice
						this.choice.init(this.result.choice, this.result.default).then(msg => {
							this.user.select.push(msg.selected);
							this.user.abandon.concat(msg.unselected);
							this.play.voice(msg.selected).then(msg => {
								// console.log("ok");
								this.getNext();
							});
						});
					} else {
						console.log("jump");
						this.getNext();
					}
				} else if (this._checkChoiceNoDefault(str)) { //c2.wav {'c5.wav': ['左'], 'c6.wav': ['右']}
					console.log("_checkChoiceNoDefault " + JSON.stringify(this.result));
					if (this._selected(this.result.flag)) {
						//进入choice
						this.choice.init(this.result.choice).then(msg => {
							this.user.select.push(msg.selected);
							this.user.abandon.concat(msg.unselected);
							this.play.voice(msg.selected).then(msg => {
								this.getNext();
							});
						});
					} else {
						console.log("jump");
						this.getNext();
					}
				} else if (this._checkChoiceOnlyWithDefault(str)) { //{'c5.wav': ['左'], 'c6.wav': ['右']} 01.wav
					console.log("_checkChoiceOnlyWithDefault " + JSON.stringify(this.result));
					//进入choice
					this.choice.init(this.result.choice, this.result.default).then(msg => {
						this.user.select.push(msg.selected);
						this.user.abandon.concat(msg.unselected);
						this.play.voice(msg.selected).then(msg => {
							console.log(msg);
							this.getNext();
						});
					});
				} else if (this._checkChoiceOnly(str)) { //{'c5.wav': ['左'], 'c6.wav': ['右']}
					console.log("_checkChoiceOnly " + JSON.stringify(this._checkChoiceOnly(str)));
					//进入choice模式
					this.choice.init(this.result.choice).then(msg => {
						this.user.select.push(msg.selected);
						this.user.abandon.concat(msg.unselected);
						this.play.voice(msg.selected).then(msg => {
							this.getNext();
						});
					});
				}
			} else { //如果语句中不含有json
				if (this._checkIfSingle(str)) { //c9.wav end1.wav
					console.log("_checkIfSingle " + JSON.stringify(this.result));
					if (this._selected(this.result.flag)) {
						this.user.select.push(this.result.sound);
						this.play.voice(this.result.sound).then(msg => {
							this.getNext();
						});
					} else {
						this.getNext();
					}
				} else if (this._checkSingle(str)) { //c9.wav
					console.log("_checkSingle " + JSON.stringify(this.result));
					this.user.select.push(this.result.sound);
					this.play.voice(this.result.sound).then(msg => {
						// console.log(msg);
						this.getNext();
					});
				} else if (this._checkShare(str)) { //$share
					console.log("_checkShare: share 模式。");
				}
			}
		});
	}

	init() {
		this.getNext();
	}
}

module.exports = Parsing;
