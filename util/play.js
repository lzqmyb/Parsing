'use strict'
const uuid = require('node-uuid');
const mqtt = require('mqtt').connect('mqtt://localhost:1883');
const redis = require('redis').createClient();
const event = require('events').EventEmitter;
const evt = new event();

class PlayVoice {
  constructor(storyName) {
    mqtt.subscribe('sound_manager/+/complete');
    mqtt.subscribe('sound_manager/+/terminate');
    mqtt.subscribe('interaction_story/pause');
    this.soundOptions = {
      storyName: storyName
    }
    mqtt.on('message', (topic, message) => {
      let fileId;
      console.log(topic);
      if (topic.indexOf('complete')) {
        fileId = topic.split('/')[1];
        if (fileId == this.fileId) {
          let fileOptions = {
            file: this.soundOptions,
            t: 'done'
          }
          redis.set(this.fileId, JSON.stringify(fileOptions));
          evt.emit('play-voice-to-end', 'complete');
        }
      } else if (topic.
        indexOf('terminate')) {
        fileId = topic.split('/')[1];
        if (fileId == this.fileId) {
          let fileOptions = {
            file: this.soundOptions.file,
            t: JSON.parse(message.toString()).progress
          }
          redis.set(this.fileId, JSON.stringify(fileOptions));
          evt.emit('play-voice-to-end', 'terminate');
        }
      } else if (topic.indexOf('pause')) {
        evt.emit('play-voice-to-end', 'pause');
      }
    });
  }

  voice(file) {
    this.fileId = uuid.v4();
    redis.lpush('story-flag-' + this.soundOptions.storyName, this.fileId, (err, reply) => {
      this.soundOptions.file = file;
      this.soundOptions.soundId = this.fileId;
      mqtt.publish('sound_manager/play', JSON.stringify(this.soundOptions), (err) => {
        if (err) console.log(err);
      });
      let fileOptions = {
        file: file,
        t: 0
      }
      redis.set(this.fileId, JSON.stringify(fileOptions));
    });
    return new Promise((resolve, inject) => {
      evt.on('play-voice-to-end', (msg) => {
        // console.log(msg);
        //complete: sound_manager finish play
        //terminate: sound_manager terminate
        //pause: interaction_story gives a pause
        resolve(msg);
      });
    });
  }
}

module.exports = PlayVoice;
