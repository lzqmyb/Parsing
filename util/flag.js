'use strict'

const redis = require('redis').createClient();

class Flag {
  constructor() {

  }

  getFlag(filename) {
    this.redis.lrange('story-flag-' + filename, 0, -1, (err, reply) => {
      return reply;
    });
  }

  setFlag(key,value) {
    return new Promise((resolve,inject) => {
      this.redis.set(key,value,(err,reply) => {
        resolve(reply);
      });
    });
  }
}

module.exports = Flag;
