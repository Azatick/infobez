"use strict";
exports.__esModule = true;
var mocha_1 = require("mocha");
var chai_1 = require("chai");
var Rijndael_1 = require("./Rijndael");
var _ = require("lodash");
mocha_1.describe('ecb', function () {
    var cipher = new Rijndael_1["default"]('ecb', 16, 16);
    mocha_1.it('Шифрование и расшифрование открытого текста с правильным паролем', function () {
        var pass = '12345';
        var text = 'The secret Azat Message asasasas';
        var encrypt = cipher.encode(text, pass);
        var decrypt = cipher.decode(encrypt, pass);
        chai_1.assert.equal(decrypt, text);
    });
    mocha_1.it('Шифрование и расшифрование открытого текста с неправильным паролем', function () {
        var pass = '12345';
        var text = 'The secret Azat Message asasasas';
        var encrypt = cipher.encode(text, pass);
        var decrypt = cipher.decode(encrypt, '1234');
        chai_1.assert.notEqual(decrypt, text);
    });
});
mocha_1.describe('pbc', function () {
    var cipher = new Rijndael_1["default"]('pbc', 16, 16);
    mocha_1.it('Шифрование и расшифрование открытого текста с правильным паролем', function () {
        var pass = '12345';
        var text = 'The secret message';
        var iv = (_.random(0, _.random(0, 1000)) * new Date().valueOf()).toString();
        var encrypt = cipher.encode(text, pass, iv);
        var decrypt = cipher.decode(encrypt, pass, iv);
        chai_1.assert.equal(decrypt, text);
    });
    mocha_1.it('Шифрование и расшифрование открытого текста с неправильным паролем', function () {
        var pass = '12345';
        var text = 'The secret message';
        var iv = (_.random(0, _.random(0, 1000)) * new Date().valueOf()).toString();
        var encrypt = cipher.encode(text, pass, iv);
        var decrypt = cipher.decode(encrypt, '1234', iv);
        chai_1.assert.notEqual(decrypt, text);
    });
    mocha_1.it('Шифрование и расшифрование открытого текста с неправильным IV', function () {
        var pass = '12345';
        var text = 'The secret message';
        var iv = (_.random(0, _.random(0, 1000)) * new Date().valueOf()).toString();
        var encrypt = cipher.encode(text, pass, iv);
        var decrypt = cipher.decode(encrypt, '1234', 'fhdusfd126126');
        chai_1.assert.notEqual(decrypt, text);
    });
});
