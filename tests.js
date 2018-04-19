"use strict";
exports.__esModule = true;
var mocha_1 = require("mocha");
var chai_1 = require("chai");
var Rijndael_1 = require("./Rijndael");
var cipher = new Rijndael_1["default"](16, 16);
mocha_1.describe('cipher', function () {
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
