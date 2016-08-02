const Parse = require('.');
var parse = new Parse('manifest.rc');

console.log(parse.getNext());
console.log(parse.getNext());
