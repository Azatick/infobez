"use strict";
exports.__esModule = true;
var Utils = require("./Utils");
var _ = require("lodash");
var ECB_1 = require("../modes/ECB");
var PBC_1 = require("../modes/PBC");
var Rijndael = /** @class */ (function () {
    function Rijndael(mode, blockSize, keySize) {
        if (blockSize === void 0) { blockSize = 16; }
        if (keySize === void 0) { keySize = 16; }
        this.blockSize = blockSize;
        this.keySize = keySize;
        this.NB = blockSize / 4;
        this.mode = this.getMode(mode);
    }
    Rijndael.prototype.cipher = function (input, keySchedule) {
        var _this = this;
        var Nr = Utils.getNumRound(this.blockSize, this.keySize);
        var state = _.range(0, 4).map(function (v) { return []; });
        _.range(0, 4 * this.NB)
            .map(function (i) { return state[i % 4][Math.floor(i / 4)] = input[i]; });
        state = this.addRoundKey(state, keySchedule, 0);
        // Rounds
        _.range(1, Nr).map(function (round) {
            state = _this.byteSub(state);
            state = _this.shiftRows(state);
            state = _this.mixColumns(state);
            state = _this.addRoundKey(state, keySchedule, round);
        });
        //FinalRound
        state = this.byteSub(state);
        state = this.shiftRows(state);
        state = this.addRoundKey(state, keySchedule, Nr);
        var prepared = _.range(0, 4 * this.NB)
            .map(function (i) { return state[i % 4][Math.floor(i / 4)]; });
        return prepared;
    };
    Rijndael.prototype.decipher = function (input, keySchedule) {
        var _this = this;
        var Nr = Utils.getNumRound(this.blockSize, this.keySize);
        var state = _.range(0, 4).map(function (v) { return []; });
        _.range(0, 4 * this.NB)
            .map(function (id) { return state[id % 4][Math.floor(id / 4)] = input[id]; });
        state = this.addRoundKey(state, keySchedule, Nr);
        _.range(Nr - 1, 0).map(function (round) {
            state = _this.invByteSub(state);
            state = _this.invShiftRows(state);
            state = _this.addRoundKey(state, keySchedule, round);
            state = _this.invMixColumns(state);
        });
        state = this.invByteSub(state);
        state = this.invShiftRows(state);
        state = this.addRoundKey(state, keySchedule, 0);
        var prepared = _.range(0, 4 * this.NB)
            .map(function (i) { return state[i % 4][Math.floor(i / 4)]; });
        return prepared;
    };
    Rijndael.prototype.byteSub = function (state) {
        var _this = this;
        state = state.slice();
        return _.range(0, 4).map(function (i) {
            _.range(0, _this.NB)
                .map(function (k) { return state[i][k] = Utils.getSBoxValue(state[i][k]); });
            return state[i];
        });
    };
    Rijndael.prototype.invByteSub = function (state) {
        var _this = this;
        state = state.slice();
        return _.range(0, 4).map(function (i) {
            _.range(0, _this.NB)
                .map(function (k) { return state[i][k] = Utils.getInvSBoxValue(state[i][k]); });
            return state[i];
        });
    };
    Rijndael.prototype.mixColumns = function (state) {
        var _this = this;
        state = state.slice();
        var sp = new Array(4), b02 = 0x02, b03 = 0x03;
        _.range(0, 4).map(function (c) {
            sp[0] = _this.FGMult(b02, state[0][c]) ^ _this.FGMult(b03, state[1][c]) ^ state[2][c] ^ state[3][c];
            sp[1] = state[0][c] ^ _this.FGMult(b02, state[1][c]) ^ _this.FGMult(b03, state[2][c]) ^ state[3][c];
            sp[2] = state[0][c] ^ state[1][c] ^ _this.FGMult(b02, state[2][c]) ^ _this.FGMult(b03, state[3][c]);
            sp[3] = _this.FGMult(b03, state[0][c]) ^ state[1][c] ^ state[2][c] ^ _this.FGMult(b02, state[3][c]);
            _.range(0, 4).map(function (i) { return state[i][c] = sp[i]; });
        });
        return state;
    };
    Rijndael.prototype.invMixColumns = function (state) {
        var _this = this;
        state = state.slice();
        var sp = new Array(4), b02 = 0x0e, b03 = 0x0b, b04 = 0x0d, b05 = 0x09;
        _.range(0, 4).map(function (c) {
            sp[0] = _this.FGMult(b02, state[0][c]) ^ _this.FGMult(b03, state[1][c]) ^ _this.FGMult(b04, state[2][c]) ^ _this.FGMult(b05, state[3][c]);
            sp[1] = _this.FGMult(b05, state[0][c]) ^ _this.FGMult(b02, state[1][c]) ^ _this.FGMult(b03, state[2][c]) ^ _this.FGMult(b04, state[3][c]);
            sp[2] = _this.FGMult(b04, state[0][c]) ^ _this.FGMult(b05, state[1][c]) ^ _this.FGMult(b02, state[2][c]) ^ _this.FGMult(b03, state[3][c]);
            sp[3] = _this.FGMult(b03, state[0][c]) ^ _this.FGMult(b04, state[1][c]) ^ _this.FGMult(b05, state[2][c]) ^ _this.FGMult(b02, state[3][c]);
            _.range(0, 4).map(function (i) { return state[i][c] = sp[i]; });
        });
        return state;
    };
    Rijndael.prototype.FGMult = function (a, b) {
        var aa = a, bb = b, r = 0, t;
        while (aa != 0) {
            if ((aa & 1) != 0)
                r = r ^ bb;
            t = bb & 0x80;
            bb = bb << 1;
            if (t != 0)
                bb = bb ^ 0x11b;
            aa = (aa & 0xff) >> 1;
        }
        return r;
    };
    Rijndael.prototype.shiftRows = function (state) {
        var _this = this;
        var tempArray = new Array(4);
        // r - row
        _.range(1, 4).map(function (row) {
            _.range(0, 4)
                .map(function (column) { return tempArray[column] = state[row][(row + column) % _this.NB]; });
            _.range(0, 4)
                .map(function (column) { return state[row][column] = tempArray[column]; });
        });
        return state;
    };
    Rijndael.prototype.invShiftRows = function (state) {
        var _this = this;
        state = state.slice();
        var tempArray = new Array(4);
        _.range(1, 4).map(function (row) {
            _.range(0, _this.NB)
                .map(function (column) { return tempArray[(column + row) % _this.NB] = state[row][column]; });
            _.range(0, _this.NB)
                .map(function (column) { return state[row][column] = tempArray[column]; });
        });
        return state;
    };
    Rijndael.prototype.addRoundKey = function (state, roundKey, round) {
        var _this = this;
        state = state.slice();
        _.range(0, 4).map(function (i) {
            _.range(0, _this.NB)
                .map(function (k) { return state[i][k] ^= roundKey[round * _this.NB + k][i]; });
        });
        return state;
    };
    Rijndael.prototype.keyExpansion = function (input) {
        var _this = this;
        this.NK = input.length / 4;
        var Nr = Utils.getNumRound(this.blockSize, this.keySize);
        var w = new Array(this.NB * (Nr + 1));
        var temp = new Array(4);
        // инициализируем первые NK слов
        _.range(0, this.NK).map(function (i) {
            w[i] = [input[4 * i], input[4 * i + 1], input[4 * i + 2], input[4 * i + 3]];
        });
        // вычисляем остальные Wj ключей
        _.range(this.NK, this.NB * (Nr + 1)).map(function (i) {
            w[i] = new Array(4);
            _.range(0, 4).map(function (t) {
                temp[t] = w[i - 1][t];
            });
            if (i % _this.NK == 0) {
                temp = _this.subByte(_this.rotByte(temp));
                _.range(0, 4)
                    .map(function (t) { return temp[t] ^= Utils.getRConValue(i / _this.NK, t); });
            }
            else if (_this.NK > 6 && i % _this.NK == 4) {
                temp = _this.subByte(temp);
            }
            _.range(0, 4)
                .map(function (t) { return w[i][t] = w[i - _this.NK][t] ^ temp[t]; });
        });
        return w;
    };
    Rijndael.prototype.subByte = function (word) {
        return _.range(0, 4).map(function (i) { return Utils.getSBoxValue(word[i]); });
    };
    Rijndael.prototype.rotByte = function (word) {
        var temp = word[0];
        _.range(0, 3).map(function (i) { return word[i] = word[i + 1]; });
        word[3] = temp;
        return word;
    };
    Rijndael.prototype.encode = function (input, password, iv) {
        return this.mode.encode(input, password, iv);
    };
    Rijndael.prototype.decode = function (input, password, iv) {
        return this.mode.decode(input, password, iv);
    };
    Rijndael.prototype.getMode = function (mode) {
        switch (mode) {
            case "ecb": return new ECB_1["default"](this);
            case "pbc": return new PBC_1["default"](this);
        }
    };
    return Rijndael;
}());
exports["default"] = Rijndael;
