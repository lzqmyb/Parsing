'use strict'

const redis = require('redis').createClient();

class Flag {
	constructor() {

	}

	getFlag(filename) {
		this.redis.lrange('story-flag-' + filename, 0, -1, (err, reply) => {
			return reply;
		})
	}
}

module.exports = Flag;
