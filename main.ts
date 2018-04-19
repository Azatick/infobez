import Rijndael from './Rijndael'
import _ = require('lodash');

const cipher = new Rijndael('pbc', 16, 16)

let pass = '5656'
let iv = (_.random(0, _.random(0, 1000)) * new Date().valueOf()).toString();
let encoded = cipher.encode("The secret 12345 dsfdis", pass, iv)
let decoded = cipher.decode(encoded, pass, iv)
console.log(`Encoded: ${encoded}`)
console.log(`Decoded: ${decoded}`)