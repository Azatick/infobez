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
var PBC = /** @class */ (function (_super) {
    __extends(PBC, _super);
    function PBC(rijndael) {
        return _super.call(this, rijndael) || this;
    }
    PBC.prototype.encode = function (input, password, iv) {
        var _this = this;
        var plaintext = Utils.utf8Encode(input);
        this.rijndael.password = Utils.utf8Encode(password);
        var ivBytes = Utils.getBytesArray(iv, this.rijndael.blockSize);
        var passwordBytes = Utils.getBytesArray(this.rijndael.password, this.rijndael.keySize);
        var keySchedule = this.rijndael.keyExpansion(passwordBytes);
        var countOfBlocks = Math.ceil(plaintext.length / this.rijndael.blockSize);
        var textBlocks = _.range(0, countOfBlocks).map(function (b) {
            return plaintext.slice(b * _this.rijndael.blockSize, (b + 1) * _this.rijndael.blockSize);
        });
        var cipherText = '';
        _.range(0, countOfBlocks)
            .map(function (block) {
            var cipheredBlock;
            if (block == 0) {
                var cipher = _this.rijndael.cipher(Utils.getBytesArray(textBlocks[block], _this.rijndael.blockSize), keySchedule);
                cipheredBlock = Utils.xorArrays(cipher, ivBytes);
            }
            else {
                var cipher = _this.rijndael.cipher(Utils.getBytesArray(textBlocks[block], _this.rijndael.blockSize), keySchedule);
                cipheredBlock = Utils.xorArrays(Utils.getBytesArray(textBlocks[block - 1], _this.rijndael.blockSize), cipher);
            }
            var cipherChar = new Array(_this.rijndael.blockSize);
            _.range(0, _this.rijndael.blockSize)
                .map(function (i) {
                cipherChar[i] = String.fromCharCode(cipheredBlock[i]);
            });
            cipherText += cipherChar.join('');
        });
        return Utils.base64Encode(cipherText);
    };
    PBC.prototype.decode = function (input, password, iv) {
        var _this = this;
        var encodedText = Utils.base64Decode(String(input));
        var ivBytes = Utils.getBytesArray(iv, this.rijndael.blockSize);
        var passwordBytes = Utils.getBytesArray(Utils.utf8Encode(password), this.rijndael.keySize);
        var keySchedule = this.rijndael.keyExpansion(passwordBytes);
        // разделяем зашифрованный текст на блоки
        var countOfBlocks = Math.ceil((encodedText.length - 8) / this.rijndael.blockSize);
        var ct = new Array(countOfBlocks);
        _.range(0, countOfBlocks)
            .map(function (b) { return ct[b] = encodedText.slice(b * _this.rijndael.blockSize, b * _this.rijndael.blockSize + _this.rijndael.blockSize); });
        var decipherText = '';
        var decipheredBlocks = [];
        _.range(0, countOfBlocks)
            .map(function (block) {
            if (block == 0) {
                var xored = Utils.xorArrays(Utils.getBytesArray(ct[block], _this.rijndael.blockSize), ivBytes);
                var decipher = _this.rijndael.decipher(xored, keySchedule);
                decipheredBlocks.push(decipher);
            }
            else {
                var xored = Utils.xorArrays(Utils.getBytesArray(ct[block], _this.rijndael.blockSize), decipheredBlocks[block - 1]);
                var decipher = _this.rijndael.decipher(xored, keySchedule);
                decipheredBlocks.push(decipher);
            }
            var decipherChars = new Array(_this.rijndael.blockSize);
            _.range(0, _this.rijndael.blockSize)
                .map(function (i) {
                decipherChars[i] = String.fromCharCode(decipheredBlocks[block][i]);
            });
            decipherText += decipherChars.join('');
        });
        return Utils.removeNullFromString(decipherText);
    };
    return PBC;
}(AMode_1["default"]));
exports["default"] = PBC;
