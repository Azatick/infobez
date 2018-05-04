"use strict";
exports.__esModule = true;
var mocha_1 = require("mocha");
var chai_1 = require("chai");
var Groestl_1 = require("./Groestl");
mocha_1.describe('blockSizing', function () {
    mocha_1.it('Размер blockSize для выходного размера в 224 бит', function () {
        var groestl = new Groestl_1["default"](224);
        chai_1.assert.equal(groestl.blockSize, 512);
    });
    mocha_1.it('Размер blockSize для выходного размера в 256 бит', function () {
        var groestl = new Groestl_1["default"](256);
        chai_1.assert.equal(groestl.blockSize, 512);
    });
    mocha_1.it('Размер blockSize для выходного размера в 384 бит', function () {
        var groestl = new Groestl_1["default"](384);
        chai_1.assert.equal(groestl.blockSize, 1024);
    });
    mocha_1.it('Размер blockSize для выходного размера в 512 бит', function () {
        var groestl = new Groestl_1["default"](512);
        chai_1.assert.equal(groestl.blockSize, 1024);
    });
});
