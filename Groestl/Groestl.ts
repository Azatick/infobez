import * as Utils from './Utils'
import * as _ from 'lodash'

export default class Groestl {

    // размер вывода
    outputSize: outputSize;
    // размер блока
    blockSize: blockSize;
    // количество блоков
    blockCount: number;
    // количество раундов
    rounds: number;
    // количество столбцов
    NB: NB;


    constructor (outputSize: outputSize) {

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
    private getBlockSize (outputSize: outputSize) : blockSize {
        if (outputSize <= 256 ) return 512;
        else return 1024;
    }

    /**
     * Возвращает начальное значение iv
     */
    private getInitialValue () : number[][] {
        let iv = _.range(0, 8).map(row => {
            return _.range(0, this.NB).map(v => 0x00)
        })
        switch (this.outputSize) {
            case 224:
                iv[iv.length-1][this.NB-1] = 0xe0;
                return iv;
            case 256:
                iv[iv.length-1][this.NB-2] = 0x01;
                return iv;
            case 384:
                iv[iv.length-1][this.NB-1] = 0x80;
                iv[iv.length-1][this.NB-2] = 0x01;
                return iv;
            case 512:
                iv[iv.length-1][this.NB-2] = 0x02;
                return iv;
        }
    }

    // TODO: починить pad функцию - из-за нее все ломается
    pad (input: string) {
        const N = input.length;
        const w = (-N - 65) % this.blockSize;
        this.blockCount = ( N + w + 65 ) / this.blockSize;
        if (this.blockCount == 0) this.blockCount = 1;
        // console.log(N, w, ( N + w + 65 ) / this.blockSize);
        let bytes = Utils.stringBytesArray(input);
        bytes.push(0x1);
        _.range(0, w).map(v => bytes.push(0x0));
        // console.log(this.blockCount)
        return bytes;
    }

    private addRoundConstantP (state: number[][], round: number) {
        state = [...state];
        let PTable = Utils.getP(this.NB, round);
        return _.range(0, 8).map(r => {
            _.range(0, this.NB).map(c => {
                state[r][c] = PTable[r][c] ^ state[r][c];
            })
            return state[r];
        })
    }

    private addRoundConstantQ (state: number[][], round: number) {
        state = [...state];
        let QTable = Utils.getQ(this.NB, round);
        return _.range(0, 8).map(r => {
            _.range(0, this.NB).map(c => {
                state[r][c] = QTable[r][c] ^ state[r][c];
            })
            return state[r];
        })
    }

    private subBytes (state: number[][]) {
        state = [...state];
        return _.range(0, 8).map(r => {
            _.range(0, this.NB).map(c => {
                state[r][c] = Utils.getSBoxValue(state[r][c]);
            })
            return state[r];
        })
    }

    private shiftBytesP (state: number[][]) {
        state = [...state];
        let shiftArray = [];
        switch (this.blockSize) {
            case 512:
                shiftArray = [0, 1, 2, 3, 4, 5, 6, 7];
                break;
            case 1024:
                shiftArray = [1, 3, 5, 7, 0, 2, 4, 6];
        }
        _.range(0, 8)
            .map(row => state[row] = Utils.shiftToLeft(state[row], shiftArray[row]))
        return state;
    }

    private shiftBytesQ (state: number[][]) {
        state = [...state];
        let shiftArray = [];
        switch (this.blockSize) {
            case 512:
                shiftArray = [0, 1, 2, 3, 4, 5, 6, 11];
                break;
            case 1024:
                shiftArray = [1, 3, 5, 11, 0, 2, 4, 6];
        }
        _.range(0, 8)
            .map(row => state[row] = Utils.shiftToLeft(state[row], shiftArray[row]))
        return state;
    }

    private mixBytes (state: number[][]) {
        state = [...state]
        function mul1( b: number ) { return b ;}
        function mul2( b: number ) { return ((0 != (b>>>7))?((b)<<1)^0x1b:((b)<<1)); }
        function mul3( b: number ) { return (mul2(b) ^ mul1(b)); }
        function mul4( b: number ) { return (mul2( mul2( b ))); }
        function mul5( b: number ) { return (mul4(b) ^ mul1(b)); }
        function mul6( b: number ) { return (mul4(b) ^ mul2(b)); }
        function mul7( b: number ) { return (mul4(b) ^ mul2(b) ^ mul1(b)); }

        _.range(0, this.NB).map(col => {
            let temp = [];
            _.range(0, 8).map(row => {
                temp[row] =
                    mul2(state[(row + 0) % 8][col]) ^ mul2(state[(row + 1) % 8][col]) ^
                    mul3(state[(row + 2) % 8][col]) ^ mul4(state[(row + 3) % 8][col]) ^
                    mul5(state[(row + 4) % 8][col]) ^ mul3(state[(row + 5) % 8][col]) ^
                    mul5(state[(row + 6) % 8][col]) ^ mul7(state[(row + 7) % 8][col]);
            })
            _.range(0, 8).map(i => state[i][col] = temp[i])
        })
        return state;
    }

    private P (state: number[][]) : number[][] {

        _.range(0, this.rounds)
            .map(round => {
                state = this.addRoundConstantP(state, round);
                state = this.subBytes(state);
                state = this.shiftBytesP(state);
                state = this.mixBytes(state);
            })

        return state;
    }

    private Q (state: number[][]) : number[][] {

        _.range(0, this.rounds)
            .map(round => {
                state = this.addRoundConstantQ(state, round);
                state = this.subBytes(state);
                state = this.shiftBytesQ(state);
                state = this.mixBytes(state);
            })

        return state;
    }


    compress (block: number[][], chainingInput: number[][]) {

        return _.xor(_.xor(this.P(_.xor(chainingInput, block)), this.Q(block)), chainingInput);

    }

    hash (input: string) {

        let padded = this.pad(input);
        let blocks = new Array(this.blockCount);

        _.range(0, this.blockCount)
            .map(i => {
                let block = padded.slice(i*this.blockSize, this.blockSize);
                blocks.push(_.range(0, 8).map(row => {
                    return _.range(0, this.NB).map(col => {
                        return block[row * this.NB + col]
                    })
                }))
                // console.log(block.length, block.join())
            })

        let chainingOutputs = [ this.getInitialValue() ];

        blocks.map((block, i) => {
            chainingOutputs.push(this.compress(block, chainingOutputs[i == 0 ? 0 : i - 1]))
        })

        let finalOutput = this.final(chainingOutputs[this.blockCount-1]);

        return Utils.toHexString(finalOutput)

    }

    final (input: number[][]) {
        input = _.xor(this.P(input), input);
        return Utils.to1DArray(input).slice(-this.outputSize/4);
    }


}

export type outputSize = 224 | 256 | 384 | 512;
export type blockSize = 512 | 1024;
export type NB = 8 | 16;