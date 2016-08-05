'use strict'
const uuid = require('node-uuid');
const mqtt = require('mqtt').connect('mqtt://localhost:1883');
const redis = require('redis').createClient();
const event = require('events').EventEmitter;
const evt = new event();
const _ = require('lodash');

class Choice {
	constructor() {
		mqtt.subscribe('environmental_perception/mic/recording/done');
		mqtt.subscribe('speech2text/do/reply');
		mqtt.on('message', (topic, message) => {
			let msg;
			switch (topic) {
			case 'environmental_perception/mic/recording/done':
				// console.log("done");
				msg = JSON.parse(message.toString());
				if (msg && msg.correlationId && msg.correlationId == this.correlationId) {
					mqtt.publish('speech2text/do/request', JSON.stringify({
						"correlationId": this.correlationId,
						"file": msg.file
					}));
				}
				break;
			case 'speech2text/do/reply':
				msg = JSON.parse(message.toString());
				if (msg && msg.correlationId && msg.correlationId == this.correlationId) {
					let text = msg.text;
					let once = true;
					_.forEach(JSON.parse(this.option.replace(/'/g, '"')), (value, key) => {
						for (let t of value) {
							if (text.indexOf(t) !== -1 && once) {
								evt.emit('reply', key);
								once = false;
								break;
							}
						}
					});
					evt.emit('reply', this.def);
				}
			}
		});
	}

	getAllChoice() {
		let allChoice = [];
		if (this.def) allChoice.push(this.def);
		_.forEach(JSON.parse(this.option.replace(/'/g, '"')), (value, key) => {
			allChoice.push(key);
		});
		return allChoice;
	}

	getUnselected(str) {
		let unselect = [];
		for (let choice of this.allChoice) {
			if (choice !== str) {
				unselect.push(choice);
			}
		}
		return unselect;
	}

	init(option, def) {
		this.option = option;
		this.def = def || null;
		this.allChoice = this.getAllChoice();
		this.correlationId = uuid.v4();
		// console.log(this.allChoice);
		return new Promise((resolve, reject) => {
			mqtt.publish('environmental_perception/mic/recording/start', JSON.stringify({
				"correlationId": this.correlationId
			}), () => {
				evt.on("reply", (data) => {
					// console.log(!!data);
					if (!!data) {
						// console.log("msg");
						resolve({
							selected: data,
							unselected: this.getUnselected(data)
						});
					} else {
						// console.log("null");
						resolve(null)
					}
				});
			});
		});
	}
}

module.exports = Choice;
