'use strict'

const expect = require('chai').expect;
const uuid = require('uuid');
const redis = require('redis').createClient();
const mqtt = require('mqtt').connect('mqtt://localhost:1883');
const PlayVoice = require('./playVoice.js');
let fileName = uuid.v4();
let storyName = '测试故事';
let playVoice = new PlayVoice(storyName);
const event = require('events').EventEmitter;
const evt = new event();
describe('playVoice播放声音方法', () => {
	let msg;
	mqtt.on('connect', () => {
		mqtt.subscribe('#');
	});
	mqtt.on('message', function (topic, payload) {
		if (topic == 'sound_manager/play') {
			msg = payload.toString()
			evt.emit("test");
		};

	});
	let soundId;
	it('是否存储了flag', (done) => {
		playVoice.play(fileName);
		evt.on("test", () => {
			redis.lrange('story-flag-' + storyName, 0, 0, (err, reply) => {
				soundId = reply[0] //将soundId取出作为下个测试使用
				redis.get(reply[0], (err, reply) => {
					expect(JSON.parse(reply).file).to.contain(fileName);
					expect(JSON.parse(reply).t).to.be.equal(0);
					done();
				})
			})
		})
	})

	it('pllayVoice订阅到声音中断,讲声音播放时间更新为中断时间', (done) => {
		mqtt.publish('sound_manager/' + soundId + '/terminate', JSON.stringify({
			"progress": uuid.v1()
		}));
		setTimeout(function () {
			redis.get(soundId, (err, reply) => {
				expect(JSON.parse(reply).t).to.not.include('done');
				expect(JSON.parse(reply).t).to.not.be.equal(0);
				done();
			})
		}, 50);
	})

	it('playVoice订阅到声音播放完成,讲声音播放时间更新为done', (done) => {
		mqtt.publish('sound_manager/' + soundId + '/complete');
		setTimeout(function () {
			redis.get(soundId, (err, reply) => {
				expect(JSON.parse(reply).t).to.include('done');
				done();
			})
		}, 50);
	})
});

describe('playVoice播放声音方法', () => {

});
