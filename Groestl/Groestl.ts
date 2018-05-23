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
        this.rounds = this.blockSize == 512 ? 10 : 14;
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

    pad (input: string) {
        const N = input.length * 8,
            l = this.blockSize,
            w = Utils.negMod(- N - 65, l),
            t = ( N + w + 65 ) / l;
        this.blockCount = t;
        let bytes = Utils.stringToBytesArray(input);
        let bits = bytes.map(v => Utils.toBitsString(v)).join('')
        bits += 1;
        bits += _.range(0, w).fill(0).join('');
        bits += Utils.get64Representation(t).map(v => Utils.toBitsString(v)).join('');
        return Utils.bitsStringToBytes(bits);
    }

    private addRoundConstantP (state: number[][], round: number) {
        return Utils.xorMatrix(state, Utils.getPTableConstant(this.NB, round));
    }

    private addRoundConstantQ (state: number[][], round: number) {
        return Utils.xorMatrix(state, Utils.getQTableContstant(this.NB, round))
    }

    private subBytes (state: number[][]) {
        return state.map(row => {
            return row.map(e => {
                return Utils.getSBoxValue(e)
            })
        })
    }

    private shiftBytesP (state: number[][]) {
        let shiftArray = Utils.getPShifts(this.blockSize);
        return _.range(0, 8).map(row => Utils.shiftToLeft(state[row], shiftArray[row]))
    }

    private shiftBytesQ (state: number[][]) {
        let shiftArray = Utils.getQShifts(this.blockSize);
        return _.range(0, 8).map(row => Utils.shiftToLeft(state[row], shiftArray[row]))
    }

    private mixBytes (state: number[][]) {
        let b02 = 2, b03 = 3, b05 = 5, b04 = 4, b07 = 7;
        _.range(0, this.NB).map(c => {
            let sp = [];
            sp[0] = Utils.GF256(b02, state[0][c]) ^ Utils.GF256(b02, state[1][c]) ^ Utils.GF256(b03, state[2][c]) ^
                Utils.GF256(b04, state[3][c]) ^ Utils.GF256(b05, state[4][c]) ^ Utils.GF256(b03, state[5][c]) ^
                Utils.GF256(b05, state[6][c]) ^ Utils.GF256(b07, state[7][c])
            sp[1] = Utils.GF256(b07, state[0][c]) ^ Utils.GF256(b02, state[1][c]) ^ Utils.GF256(b02, state[2][c]) ^
                Utils.GF256(b03, state[3][c]) ^ Utils.GF256(b04, state[4][c]) ^ Utils.GF256(b05, state[5][c]) ^
                Utils.GF256(b03, state[6][c]) ^ Utils.GF256(b05, state[7][c])
            sp[2] = Utils.GF256(b05, state[0][c]) ^ Utils.GF256(b07, state[1][c]) ^ Utils.GF256(b02, state[2][c]) ^
                Utils.GF256(b02, state[3][c]) ^ Utils.GF256(b03, state[4][c]) ^ Utils.GF256(b04, state[5][c]) ^
                Utils.GF256(b05, state[6][c]) ^ Utils.GF256(b03, state[7][c])
            sp[3] = Utils.GF256(b03, state[0][c]) ^ Utils.GF256(b05, state[1][c]) ^ Utils.GF256(b07, state[2][c]) ^
                Utils.GF256(b02, state[3][c]) ^ Utils.GF256(b02, state[4][c]) ^ Utils.GF256(b03, state[5][c]) ^
                Utils.GF256(b04, state[6][c]) ^ Utils.GF256(b05, state[7][c])
            sp[4] = Utils.GF256(b05, state[0][c]) ^ Utils.GF256(b03, state[1][c]) ^ Utils.GF256(b05, state[2][c]) ^
                Utils.GF256(b07, state[3][c]) ^ Utils.GF256(b02, state[4][c]) ^ Utils.GF256(b02, state[5][c]) ^
                Utils.GF256(b03, state[6][c]) ^ Utils.GF256(b04, state[7][c])
            sp[5] = Utils.GF256(b04, state[0][c]) ^ Utils.GF256(b05, state[1][c]) ^ Utils.GF256(b03, state[2][c]) ^
                Utils.GF256(b05, state[3][c]) ^ Utils.GF256(b07, state[4][c]) ^ Utils.GF256(b02, state[5][c]) ^
                Utils.GF256(b02, state[6][c]) ^ Utils.GF256(b03, state[7][c])
            sp[6] = Utils.GF256(b03, state[0][c]) ^ Utils.GF256(b04, state[1][c]) ^ Utils.GF256(b05, state[2][c]) ^
                Utils.GF256(b03, state[3][c]) ^ Utils.GF256(b05, state[4][c]) ^ Utils.GF256(b07, state[5][c]) ^
                Utils.GF256(b02, state[6][c]) ^ Utils.GF256(b02, state[7][c])
            sp[7] = Utils.GF256(b02, state[0][c]) ^ Utils.GF256(b03, state[1][c]) ^ Utils.GF256(b04, state[2][c]) ^
                Utils.GF256(b05, state[3][c]) ^ Utils.GF256(b03, state[4][c]) ^ Utils.GF256(b05, state[5][c]) ^
                Utils.GF256(b07, state[6][c]) ^ Utils.GF256(b02, state[7][c])
            _.range(0, 8).map(i => state[i][c] = sp[i])
        })
        return state;
    }

    private P (state: number[][]) : number[][] {
        state = [...state]
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
        state = [...state]
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
        return Utils.xorMatrix(
            Utils.xorMatrix(
                this.P(Utils.xorMatrix(chainingInput, block)),
                this.Q(block)
            ),
            chainingInput
        )

    }

    hash (input: string) {

        let padded = this.pad(input);

        let blocks = [];

        _.range(0, this.blockCount)
            .map(i => {
                let block = padded.slice(i*this.blockSize/8, (i+1)*this.blockSize/8);
                blocks.push(Utils.to2DArray(block, this.NB, 8))
            })

        let chainingOutputs = [ this.getInitialValue() ];

        _.range(0, this.blockCount).map(i => {
            chainingOutputs[i+1] = this.compress(blocks[i], chainingOutputs[i]);
        })

        let finalOutput = this.final(chainingOutputs.slice(-1)[0]);

        return Utils.toHexString(finalOutput)

    }

    private truncate (input: number[][]) {
        let input1D = Utils.to1DArray(input);
        let bits = input1D.map(v => Utils.toBitsString(v)).join('')
        return Utils.bitsStringToBytes(bits.slice(-this.outputSize))
    }

    final (input: number[][]) {
        return this.truncate(Utils.xorMatrix(this.P(input), input));
    }


}

export type outputSize = 224 | 256 | 384 | 512;
export type blockSize = 512 | 1024;
export type NB = 8 | 16;