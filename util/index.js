'use strict'
const PlayVoice = require('./playVoice.js');
const Choice = require('./choice.js');
const Flag = require('./flag.js');

module.exports = {
	PlayVoice: PlayVoice,
	choice: Choice.choice,
	getFlag: Flag.getFlag
}
