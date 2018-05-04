import Groestl from './Groestl'
import * as Utils from './Utils'

let gr = new Groestl(224);


// let P512 = Utils.getP(512, 0);
//
// console.log(P512.length, P512.join());
//
// let P1024 = Utils.getP(16, 0);

// console.log(P1024.length, P1024);
//
// let Q512 = Utils.getQ(8, 0);
//
// console.log(Q512.length, Q512);

// let Q1024 = Utils.getQ(1024, 0);
//
// console.log(Q1024.length, Q1024);

console.log("aaa", gr.hash("aaa"))
console.log("aaa1", gr.hash("aaa1"))