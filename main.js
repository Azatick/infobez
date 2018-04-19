"use strict";
exports.__esModule = true;
var Rijndael_1 = require("./Rijndael");
var cipher = new Rijndael_1["default"](16, 16);
var pass = '5656';
var encoded = cipher.encode("The secret", pass);
var decoded = cipher.decode(encoded, pass);
console.log("Encoded: " + encoded);
console.log("Decoded: " + decoded);
