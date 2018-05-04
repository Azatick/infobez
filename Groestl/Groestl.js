"use strict";
exports.__esModule = true;
var Utils = require("./Utils");
var _ = require("lodash");
var Groestl = /** @class */ (function () {
    function Groestl(outputSize) {
        this.outputSize = outputSize;
        this.blockSize = this.getBlockSize(outputSize);
        this.rounds = this.blockSize == 512 ? 7 : 9;
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
    // TODO: починить pad функцию - из-за нее все ломается
    Groestl.prototype.pad = function (input) {
        var N = input.length;
        var w = (-N - 65) % this.blockSize;
        this.blockCount = (N + w + 65) / this.blockSize;
        if (this.blockCount == 0)
            this.blockCount = 1;
        // console.log(N, w, ( N + w + 65 ) / this.blockSize);
        var bytes = Utils.stringBytesArray(input);
        bytes.push(0x1);
        _.range(0, w).map(function (v) { return bytes.push(0x0); });
        // console.log(this.blockCount)
        return bytes;
    };
    Groestl.prototype.addRoundConstantP = function (state, round) {
        var _this = this;
        state = state.slice();
        var PTable = Utils.getP(this.NB, round);
        return _.range(0, 8).map(function (r) {
            _.range(0, _this.NB).map(function (c) {
                state[r][c] = PTable[r][c] ^ state[r][c];
            });
            return state[r];
        });
    };
    Groestl.prototype.addRoundConstantQ = function (state, round) {
        var _this = this;
        state = state.slice();
        var QTable = Utils.getQ(this.NB, round);
        return _.range(0, 8).map(function (r) {
            _.range(0, _this.NB).map(function (c) {
                state[r][c] = QTable[r][c] ^ state[r][c];
            });
            return state[r];
        });
    };
    Groestl.prototype.subBytes = function (state) {
        var _this = this;
        state = state.slice();
        return _.range(0, 8).map(function (r) {
            _.range(0, _this.NB).map(function (c) {
                state[r][c] = Utils.getSBoxValue(state[r][c]);
            });
            return state[r];
        });
    };
    Groestl.prototype.shiftBytesP = function (state) {
        state = state.slice();
        var shiftArray = [];
        switch (this.blockSize) {
            case 512:
                shiftArray = [0, 1, 2, 3, 4, 5, 6, 7];
                break;
            case 1024:
                shiftArray = [1, 3, 5, 7, 0, 2, 4, 6];
        }
        _.range(0, 8)
            .map(function (row) { return state[row] = Utils.shiftToLeft(state[row], shiftArray[row]); });
        return state;
    };
    Groestl.prototype.shiftBytesQ = function (state) {
        state = state.slice();
        var shiftArray = [];
        switch (this.blockSize) {
            case 512:
                shiftArray = [0, 1, 2, 3, 4, 5, 6, 11];
                break;
            case 1024:
                shiftArray = [1, 3, 5, 11, 0, 2, 4, 6];
        }
        _.range(0, 8)
            .map(function (row) { return state[row] = Utils.shiftToLeft(state[row], shiftArray[row]); });
        return state;
    };
    Groestl.prototype.mixBytes = function (state) {
        state = state.slice();
        function mul1(b) { return b; }
        function mul2(b) { return ((0 != (b >>> 7)) ? ((b) << 1) ^ 0x1b : ((b) << 1)); }
        function mul3(b) { return (mul2(b) ^ mul1(b)); }
        function mul4(b) { return (mul2(mul2(b))); }
        function mul5(b) { return (mul4(b) ^ mul1(b)); }
        function mul6(b) { return (mul4(b) ^ mul2(b)); }
        function mul7(b) { return (mul4(b) ^ mul2(b) ^ mul1(b)); }
        _.range(0, this.NB).map(function (col) {
            var temp = [];
            _.range(0, 8).map(function (row) {
                temp[row] =
                    mul2(state[(row + 0) % 8][col]) ^ mul2(state[(row + 1) % 8][col]) ^
                        mul3(state[(row + 2) % 8][col]) ^ mul4(state[(row + 3) % 8][col]) ^
                        mul5(state[(row + 4) % 8][col]) ^ mul3(state[(row + 5) % 8][col]) ^
                        mul5(state[(row + 6) % 8][col]) ^ mul7(state[(row + 7) % 8][col]);
            });
            _.range(0, 8).map(function (i) { return state[i][col] = temp[i]; });
        });
        return state;
    };
    Groestl.prototype.P = function (state) {
        var _this = this;
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
        return _.xor(_.xor(this.P(_.xor(chainingInput, block)), this.Q(block)), chainingInput);
    };
    Groestl.prototype.hash = function (input) {
        var _this = this;
        var padded = this.pad(input);
        var blocks = new Array(this.blockCount);
        _.range(0, this.blockCount)
            .map(function (i) {
            var block = padded.slice(i * _this.blockSize, _this.blockSize);
            blocks.push(_.range(0, 8).map(function (row) {
                return _.range(0, _this.NB).map(function (col) {
                    return block[row * _this.NB + col];
                });
            }));
            // console.log(block.length, block.join())
        });
        var chainingOutputs = [this.getInitialValue()];
        blocks.map(function (block, i) {
            chainingOutputs.push(_this.compress(block, chainingOutputs[i == 0 ? 0 : i - 1]));
        });
        var finalOutput = this.final(chainingOutputs[this.blockCount - 1]);
        return Utils.toHexString(finalOutput);
    };
    Groestl.prototype.final = function (input) {
        input = _.xor(this.P(input), input);
        return Utils.to1DArray(input).slice(-this.outputSize / 4);
    };
    return Groestl;
}());
exports["default"] = Groestl;
