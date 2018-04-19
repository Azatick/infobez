import * as Utils from "./Utils"
import * as _ from 'lodash'

export default class Rijndael {

    password: string
    blockSize: Utils.bytesCount
    keySize: Utils.bytesCount
    NB: number
    NK: number

    constructor (blockSize: Utils.bytesCount = 16, keySize: Utils.bytesCount = 16) {
        this.blockSize = blockSize
        this.keySize = keySize
        this.NB = blockSize / 4
    }

    cipher (input: number[], keySchedule: number[][]) {

        const Nr =  Utils.getNumRound(this.blockSize, this.keySize)

        let state: number[][] = _.range(0, 4).map(v => [])

        _.range(0, 4*this.NB)
            .map(i => state[i%4][Math.floor(i/4)] = input[i])

        state = this.addRoundKey(state, keySchedule, 0)

        // Rounds
        _.range(1, Nr).map(round => {
            state = this.byteSub(state)
            state = this.shiftRows(state)
            state = this.mixColumns(state)
            state = this.addRoundKey(state, keySchedule, round)
        })

        //FinalRound
        state = this.byteSub(state)
        state = this.shiftRows(state)
        state = this.addRoundKey(state, keySchedule, Nr)

        let prepared = _.range(0, 4*this.NB)
            .map(i => state[i%4][Math.floor(i/4)])

        return prepared
    }

    decipher (input: number[], keySchedule: number[][]) {

        const Nr =  Utils.getNumRound(this.blockSize, this.keySize)

        let state: number[][] = _.range(0, 4).map(v => [])

        _.range(0, 4*this.NB)
            .map(id => state[id%4][Math.floor(id/4)] = input[id])

        state = this.addRoundKey(state, keySchedule, Nr)

        _.range(Nr - 1, 0).map(round => {
            state = this.invByteSub(state)
            state = this.invShiftRows(state)
            state = this.addRoundKey(state, keySchedule, round)
            state = this.invMixColumns(state)

        })

        state = this.invByteSub(state)
        state = this.invShiftRows(state)
        state = this.addRoundKey(state, keySchedule, 0)

        const prepared = _.range(0, 4*this.NB)
            .map(i => state[i%4][Math.floor(i/4)])

        return prepared
    }

    private byteSub (state: number[][]) {
        state = [...state]
        return _.range(0, 4).map(i => {
            _.range(0, this.NB)
                .map(k => state[i][k] = Utils.getSBoxValue(state[i][k]))
            return state[i]
        })
    }

    private invByteSub (state: number[][]) {
        state = [...state]
        return _.range(0, 4).map(i => {
            _.range(0, this.NB)
                .map(k => state[i][k] = Utils.getInvSBoxValue(state[i][k]))
            return state[i]
        })
    }

    public mixColumns (state: number[][]) {
        state = [...state]
        let sp = new Array(4), b02 = 0x02, b03 = 0x03;
        _.range(0, 4).map(c => {
            sp[0] = this.FGMult(b02, state[0][c]) ^ this.FGMult(b03, state[1][c]) ^ state[2][c]  ^ state[3][c]
            sp[1] = state[0][c]  ^ this.FGMult(b02, state[1][c]) ^ this.FGMult(b03, state[2][c]) ^ state[3][c];
            sp[2] = state[0][c]  ^ state[1][c]  ^ this.FGMult(b02, state[2][c]) ^ this.FGMult(b03, state[3][c]);
            sp[3] = this.FGMult(b03, state[0][c]) ^ state[1][c]  ^ state[2][c]  ^ this.FGMult(b02, state[3][c]);
            _.range(0, 4).map(i => state[i][c] = sp[i])
        })
        return state;
    }

    private invMixColumns (state: number[][]) {
        state = [...state]
        let sp = new Array(4), b02 = 0x0e, b03 = 0x0b, b04 = 0x0d, b05 = 0x09;
        _.range(0, 4).map(c => {
            sp[0] = this.FGMult(b02, state[0][c]) ^ this.FGMult(b03, state[1][c]) ^ this.FGMult(b04,state[2][c])  ^ this.FGMult(b05,state[3][c]);
            sp[1] = this.FGMult(b05, state[0][c]) ^ this.FGMult(b02, state[1][c]) ^ this.FGMult(b03,state[2][c])  ^ this.FGMult(b04,state[3][c]);
            sp[2] = this.FGMult(b04, state[0][c]) ^ this.FGMult(b05, state[1][c]) ^ this.FGMult(b02,state[2][c])  ^ this.FGMult(b03,state[3][c]);
            sp[3] = this.FGMult(b03, state[0][c]) ^ this.FGMult(b04, state[1][c]) ^ this.FGMult(b05,state[2][c])  ^ this.FGMult(b02,state[3][c]);
            _.range(0, 4).map(i => state[i][c] = sp[i])
        })
        return state
    }

    private FGMult (a: number, b: number) {
        let aa = a, bb = b, r = 0, t;
        while (aa != 0) {
            if ((aa & 1) != 0) r = r ^ bb;
            t = bb & 0x80;
            bb = bb << 1;
            if (t != 0) bb = bb ^ 0x11b;
            aa = (aa & 0xff) >> 1;
        }
        return r;
    }

    private shiftRows (state: number[][]) {
        const tempArray = new Array(4)
        // r - row
        _.range(1, 4).map(row => {
            _.range(0, 4)
                .map(column => tempArray[column] = state[row][(row + column)%this.NB])
            _.range(0, 4)
                .map(column => state[row][column] = tempArray[column])
        })
        return state
    }

    private invShiftRows (state: number[][]) {
        state = [...state]
        const tempArray = new Array(4)
        _.range(1, 4).map(row => {
            _.range(0, this.NB)
                .map(column => tempArray[(column + row)%this.NB] = state[row][column])
            _.range(0, this.NB)
                .map(column => state[row][column] = tempArray[column])
        })
        return state
    }

    private addRoundKey (state: number[][], roundKey: number[][], round: number) {
        state = [...state]
        _.range(0, 4).map(i => {
            _.range(0, this.NB)
                .map(k => state[i][k] ^= roundKey[round*this.NB+k][i])
        })
        return state
    }

    keyExpansion (input: number[]) {
        this.NK = input.length / 4
        const Nr = Utils.getNumRound(this.blockSize, this.keySize)

        const w = new Array(this.NB*(Nr+1))
        let temp = new Array(4)

        // инициализируем первые NK слов
        _.range(0, this.NK).map(i => {
            w[i] = [ input[4*i], input[4*i+1], input[4*i+2], input[4*i+3] ]
        })

        // вычисляем остальные Wj ключей
        _.range(this.NK, this.NB*(Nr+1)).map(i => {
            w[i] = new Array(4)
            _.range(0, 4).map(t => {
                temp[t] = w[i-1][t]
            })
            if (i % this.NK == 0) {
                temp = this.subByte(this.rotByte(temp))
                _.range(0, 4)
                    .map(t => temp[t] ^= Utils.getRConValue(i/this.NK, t))
            } else if (this.NK > 6 && i%this.NK == 4) {
                temp = this.subByte(temp)
            }
            _.range(0, 4)
                .map(t => w[i][t] = w[i - this.NK][t] ^ temp[t])
        })
        return w
    }

    private subByte (word: number[]) {
        return _.range(0, 4).map(i => Utils.getSBoxValue(word[i]))
    }

    private rotByte (word: number[]) {
        const temp = word[0]
        _.range(0, 3).map(i => word[i] = word[i+1])
        word[3] = temp
        return word
    }

    encode (input: string, password: string) {

        let plaintext = Utils.utf8Encode(input)
        this.password = Utils.utf8Encode(password)

        const passwordBytes = Utils.getBytesArray(this.password, this.keySize)

        const keySchedule = this.keyExpansion(passwordBytes)

        const countOfBlocks = Math.ceil(plaintext.length / this.blockSize)
        let cipherText = ''

        _.range(0, countOfBlocks)
            .map(block => {
                const textBlock = plaintext.slice(block*this.blockSize, (block+1)*this.blockSize)

                const cipher = this.cipher(Utils.getBytesArray(textBlock, this.blockSize), keySchedule)

                const cipherChar = new Array(this.blockSize)

                _.range(0, this.blockSize)
                    .map(i => {
                        cipherChar[i] = String.fromCharCode(cipher[i])
                    })

                cipherText += cipherChar.join('')

            })
        return Utils.base64Encode(cipherText)
    }

    decode (input: string, password: string) {

        let encodedText = Utils.base64Decode(String(input))

        const passwordBytes = Utils.getBytesArray(password, this.keySize)

        const keySchedule = this.keyExpansion(passwordBytes)

        // разделяем зашифрованный текст на блоки
        const countOfBlocks = Math.ceil((encodedText.length - 8) / this.blockSize)
        let ct = new Array(countOfBlocks)
        _.range(0, countOfBlocks)
            .map(b => ct[b] = encodedText.slice(8+b*this.blockSize, 8+b*this.blockSize + this.blockSize))
        let decipherText = ''

        console.log(countOfBlocks)

        _.range(0, countOfBlocks)
            .map(block => {
                const encodedBlock = encodedText.slice(block*this.blockSize, (block+1)*this.blockSize)
                const decipher = this.decipher(Utils.getBytesArray(encodedBlock, this.blockSize), keySchedule)

                let decipherChars = new Array(this.blockSize)

                _.range(0, this.blockSize)
                    .map(i => {
                        decipherChars[i] = String.fromCharCode(decipher[i])
                    })

                decipherText += decipherChars.join('')

            })
        return decipherText
    }

}