'use strict'

// const expect = require('chai').expect;
// const uuid = require('uuid');
// const redis = require('redis').createClient();
// const mqtt = require('mqtt').connect('mqtt://localhost:1883');


// let soundOptions = {"haha":"haha"};
// mqtt.publish('sound_manager/play',JSON.stringify(soundOptions));
// let Choice = require('./choice.js');
// let choice =new Choice(1,2,1,3,85,6);

const util = require('./');
let playVoice =new util.PlayVoice('测试5');
playVoice.play('nihao.wav');
console.log('播放结束');