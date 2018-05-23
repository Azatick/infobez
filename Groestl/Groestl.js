"use strict";
exports.__esModule = true;
var Utils = require("./Utils");
var _ = require("lodash");
var Groestl = /** @class */ (function () {
    function Groestl(outputSize) {
        this.outputSize = outputSize;
        this.blockSize = this.getBlockSize(outputSize);
        this.rounds = this.blockSize == 512 ? 10 : 14;
        this.NB = this.blockSize == 512 ? 8 : 16;
    }
    /**
     * Возвращает размер l блока
     * @param {outputSize} outputSize
     * @returns {blockSize}
     */
    Groestl.prototype.getBlockSize = function (outputSize) {
        if (outputSize <= 256)
            return 512;
        else
            return 1024;
    };
    /**
     * Возвращает начальное значение iv
     */
    Groestl.prototype.getInitialValue = function () {
        var _this = this;
        var iv = _.range(0, 8).map(function (row) {
            return _.range(0, _this.NB).map(function (v) { return 0x00; });
        });
        switch (this.outputSize) {
            case 224:
                iv[iv.length - 1][this.NB - 1] = 0xe0;
                return iv;
            case 256:
                iv[iv.length - 1][this.NB - 2] = 0x01;
                return iv;
            case 384:
                iv[iv.length - 1][this.NB - 1] = 0x80;
                iv[iv.length - 1][this.NB - 2] = 0x01;
                return iv;
            case 512:
                iv[iv.length - 1][this.NB - 2] = 0x02;
                return iv;
        }
    };
    Groestl.prototype.pad = function (input) {
        var N = input.length * 8, l = this.blockSize, w = Utils.negMod(-N - 65, l), t = (N + w + 65) / l;
        this.blockCount = t;
        var bytes = Utils.stringToBytesArray(input);
        var bits = bytes.map(function (v) { return Utils.toBitsString(v); }).join('');
        bits += 1;
        bits += _.range(0, w).fill(0).join('');
        bits += Utils.get64Representation(t).map(function (v) { return Utils.toBitsString(v); }).join('');
        return Utils.bitsStringToBytes(bits);
    };
    Groestl.prototype.addRoundConstantP = function (state, round) {
        return Utils.xorMatrix(state, Utils.getPTableConstant(this.NB, round));
    };
    Groestl.prototype.addRoundConstantQ = function (state, round) {
        return Utils.xorMatrix(state, Utils.getQTableContstant(this.NB, round));
    };
    Groestl.prototype.subBytes = function (state) {
        return state.map(function (row) {
            return row.map(function (e) {
                return Utils.getSBoxValue(e);
            });
        });
    };
    Groestl.prototype.shiftBytesP = function (state) {
        var shiftArray = Utils.getPShifts(this.blockSize);
        return _.range(0, 8).map(function (row) { return Utils.shiftToLeft(state[row], shiftArray[row]); });
    };
    Groestl.prototype.shiftBytesQ = function (state) {
        var shiftArray = Utils.getQShifts(this.blockSize);
        return _.range(0, 8).map(function (row) { return Utils.shiftToLeft(state[row], shiftArray[row]); });
    };
    Groestl.prototype.mixBytes = function (state) {
        var b02 = 2, b03 = 3, b05 = 5, b04 = 4, b07 = 7;
        _.range(0, this.NB).map(function (c) {
            var sp = [];
            sp[0] = Utils.GF256(b02, state[0][c]) ^ Utils.GF256(b02, state[1][c]) ^ Utils.GF256(b03, state[2][c]) ^
                Utils.GF256(b04, state[3][c]) ^ Utils.GF256(b05, state[4][c]) ^ Utils.GF256(b03, state[5][c]) ^
                Utils.GF256(b05, state[6][c]) ^ Utils.GF256(b07, state[7][c]);
            sp[1] = Utils.GF256(b07, state[0][c]) ^ Utils.GF256(b02, state[1][c]) ^ Utils.GF256(b02, state[2][c]) ^
                Utils.GF256(b03, state[3][c]) ^ Utils.GF256(b04, state[4][c]) ^ Utils.GF256(b05, state[5][c]) ^
                Utils.GF256(b03, state[6][c]) ^ Utils.GF256(b05, state[7][c]);
            sp[2] = Utils.GF256(b05, state[0][c]) ^ Utils.GF256(b07, state[1][c]) ^ Utils.GF256(b02, state[2][c]) ^
                Utils.GF256(b02, state[3][c]) ^ Utils.GF256(b03, state[4][c]) ^ Utils.GF256(b04, state[5][c]) ^
                Utils.GF256(b05, state[6][c]) ^ Utils.GF256(b03, state[7][c]);
            sp[3] = Utils.GF256(b03, state[0][c]) ^ Utils.GF256(b05, state[1][c]) ^ Utils.GF256(b07, state[2][c]) ^
                Utils.GF256(b02, state[3][c]) ^ Utils.GF256(b02, state[4][c]) ^ Utils.GF256(b03, state[5][c]) ^
                Utils.GF256(b04, state[6][c]) ^ Utils.GF256(b05, state[7][c]);
            sp[4] = Utils.GF256(b05, state[0][c]) ^ Utils.GF256(b03, state[1][c]) ^ Utils.GF256(b05, state[2][c]) ^
                Utils.GF256(b07, state[3][c]) ^ Utils.GF256(b02, state[4][c]) ^ Utils.GF256(b02, state[5][c]) ^
                Utils.GF256(b03, state[6][c]) ^ Utils.GF256(b04, state[7][c]);
            sp[5] = Utils.GF256(b04, state[0][c]) ^ Utils.GF256(b05, state[1][c]) ^ Utils.GF256(b03, state[2][c]) ^
                Utils.GF256(b05, state[3][c]) ^ Utils.GF256(b07, state[4][c]) ^ Utils.GF256(b02, state[5][c]) ^
                Utils.GF256(b02, state[6][c]) ^ Utils.GF256(b03, state[7][c]);
            sp[6] = Utils.GF256(b03, state[0][c]) ^ Utils.GF256(b04, state[1][c]) ^ Utils.GF256(b05, state[2][c]) ^
                Utils.GF256(b03, state[3][c]) ^ Utils.GF256(b05, state[4][c]) ^ Utils.GF256(b07, state[5][c]) ^
                Utils.GF256(b02, state[6][c]) ^ Utils.GF256(b02, state[7][c]);
            sp[7] = Utils.GF256(b02, state[0][c]) ^ Utils.GF256(b03, state[1][c]) ^ Utils.GF256(b04, state[2][c]) ^
                Utils.GF256(b05, state[3][c]) ^ Utils.GF256(b03, state[4][c]) ^ Utils.GF256(b05, state[5][c]) ^
                Utils.GF256(b07, state[6][c]) ^ Utils.GF256(b02, state[7][c]);
            _.range(0, 8).map(function (i) { return state[i][c] = sp[i]; });
        });
        return state;
    };
    Groestl.prototype.P = function (state) {
        var _this = this;
        state = state.slice();
        _.range(0, this.rounds)
            .map(function (round) {
            state = _this.addRoundConstantP(state, round);
            state = _this.subBytes(state);
            state = _this.shiftBytesP(state);
            state = _this.mixBytes(state);
        });
        return state;
    };
    Groestl.prototype.Q = function (state) {
        var _this = this;
        state = state.slice();
        _.range(0, this.rounds)
            .map(function (round) {
            state = _this.addRoundConstantQ(state, round);
            state = _this.subBytes(state);
            state = _this.shiftBytesQ(state);
            state = _this.mixBytes(state);
        });
        return state;
    };
    Groestl.prototype.compress = function (block, chainingInput) {
        return Utils.xorMatrix(Utils.xorMatrix(this.P(Utils.xorMatrix(chainingInput, block)), this.Q(block)), chainingInput);
    };
    Groestl.prototype.hash = function (input) {
        var _this = this;
        var padded = this.pad(input);
        var blocks = [];
        _.range(0, this.blockCount)
            .map(function (i) {
            var block = padded.slice(i * _this.blockSize / 8, (i + 1) * _this.blockSize / 8);
            blocks.push(Utils.to2DArray(block, _this.NB, 8));
        });
        var chainingOutputs = [this.getInitialValue()];
        _.range(0, this.blockCount).map(function (i) {
            chainingOutputs[i + 1] = _this.compress(blocks[i], chainingOutputs[i]);
        });
        var finalOutput = this.final(chainingOutputs.slice(-1)[0]);
        return Utils.toHexString(finalOutput);
    };
    Groestl.prototype.truncate = function (input) {
        var input1D = Utils.to1DArray(input);
        var bits = input1D.map(function (v) { return Utils.toBitsString(v); }).join('');
        return Utils.bitsStringToBytes(bits.slice(-this.outputSize));
    };
    Groestl.prototype.final = function (input) {
        return this.truncate(Utils.xorMatrix(this.P(input), input));
    };
    return Groestl;
}());
exports["default"] = Groestl;
