import Groestl from './Groestl'

let gr224 = new Groestl(224);
console.log('Groestl 224')
console.log("abc\n", gr224.hash("abc"))
console.log("abc.\n", gr224.hash("abc."))
console.log('====')
let gr256 = new Groestl(256);
console.log('Groestl 256')
console.log("\"The quick brown fox jumps over the lazy dog\"\n", gr256.hash("The quick brown fox jumps over the lazy dog"))
console.log("\"The quick brown fox jumps over the lazy dog.\"\n", gr256.hash("The quick brown fox jumps over the lazy dog."))
console.log('====')
let gr384 = new Groestl(384);
console.log('Groestl 384')
console.log("\"The quick brown fox jumps over the lazy dog\"\n", gr384.hash("The quick brown fox jumps over the lazy dog"))
console.log("\"The quick brown fox jumps over the lazy dog.\"\n", gr384.hash("The quick brown fox jumps over the lazy dog."))
console.log('====')
let gr512 = new Groestl(512);
console.log('Groestl 512')
console.log("\"The quick brown fox jumps over the lazy dog\"\n", gr512.hash("The quick brown fox jumps over the lazy dog"))
console.log("The quick brown fox jumps over the lazy dog.\n", gr512.hash("The quick brown fox jumps over the lazy dog."))