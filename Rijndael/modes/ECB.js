"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var _ = require("lodash");
var Utils = require("../Utils");
var AMode_1 = require("./AMode");
var ECB = /** @class */ (function (_super) {
    __extends(ECB, _super);
    function ECB(rijndael) {
        return _super.call(this, rijndael) || this;
    }
    ECB.prototype.encode = function (input, password, iv) {
        var _this = this;
        var plaintext = Utils.utf8Encode(input);
        this.rijndael.password = Utils.utf8Encode(password);
        var passwordBytes = Utils.getBytesArray(this.rijndael.password, this.rijndael.keySize);
        var keySchedule = this.rijndael.keyExpansion(passwordBytes);
        var countOfBlocks = Math.ceil(plaintext.length / this.rijndael.blockSize);
        var cipherText = '';
        _.range(0, countOfBlocks)
            .map(function (block) {
            var textBlock = plaintext.slice(block * _this.rijndael.blockSize, (block + 1) * _this.rijndael.blockSize);
            var cipher = _this.rijndael.cipher(Utils.getBytesArray(textBlock, _this.rijndael.blockSize), keySchedule);
            var cipherChar = new Array(_this.rijndael.blockSize);
            _.range(0, _this.rijndael.blockSize)
                .map(function (i) {
                cipherChar[i] = String.fromCharCode(cipher[i]);
            });
            cipherText += cipherChar.join('');
        });
        return Utils.base64Encode(cipherText);
    };
    ECB.prototype.decode = function (input, password, iv) {
        var _this = this;
        var encodedText = Utils.base64Decode(String(input));
        var passwordBytes = Utils.getBytesArray(Utils.utf8Encode(password), this.rijndael.keySize);
        var keySchedule = this.rijndael.keyExpansion(passwordBytes);
        // разделяем зашифрованный текст на блоки
        var countOfBlocks = Math.ceil((encodedText.length - 8) / this.rijndael.blockSize);
        var ct = new Array(countOfBlocks);
        _.range(0, countOfBlocks)
            .map(function (b) { return ct[b] = encodedText.slice(8 + b * _this.rijndael.blockSize, 8 + b * _this.rijndael.blockSize + _this.rijndael.blockSize); });
        var decipherText = '';
        _.range(0, countOfBlocks)
            .map(function (block) {
            var encodedBlock = encodedText.slice(block * _this.rijndael.blockSize, (block + 1) * _this.rijndael.blockSize);
            var decipher = _this.rijndael.decipher(Utils.getBytesArray(encodedBlock, _this.rijndael.blockSize), keySchedule);
            var decipherChars = new Array(_this.rijndael.blockSize);
            _.range(0, _this.rijndael.blockSize)
                .map(function (i) {
                decipherChars[i] = String.fromCharCode(decipher[i]);
            });
            decipherText += decipherChars.join('');
        });
        return Utils.removeNullFromString(decipherText);
    };
    return ECB;
}(AMode_1["default"]));
exports["default"] = ECB;
