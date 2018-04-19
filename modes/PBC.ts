import * as _ from "lodash";
import * as Utils from "../Utils";
import AMode from "./AMode";
import Rijndael from "../Rijndael";

export default class PBC extends AMode {

    constructor (rijndael: Rijndael) {
        super(rijndael)
    }

    encode (input: string, password: string, iv: string) {

        let plaintext = Utils.utf8Encode(input)
        this.rijndael.password = Utils.utf8Encode(password)

        const ivBytes = Utils.getBytesArray(iv, this.rijndael.blockSize)
        const passwordBytes = Utils.getBytesArray(this.rijndael.password, this.rijndael.keySize)

        const keySchedule = this.rijndael.keyExpansion(passwordBytes)

        const countOfBlocks = Math.ceil(plaintext.length / this.rijndael.blockSize)
        const textBlocks = _.range(0, countOfBlocks).map(b => {
            return plaintext.slice(b*this.rijndael.blockSize, (b+1)*this.rijndael.blockSize)
        })
        let cipherText = ''

        _.range(0, countOfBlocks)
            .map(block => {
                let cipheredBlock;
                if (block == 0) {
                    let cipher = this.rijndael.cipher(Utils.getBytesArray(textBlocks[block], this.rijndael.blockSize), keySchedule)
                    cipheredBlock = Utils.xorArrays(cipher, ivBytes)
                } else {
                    let cipher = this.rijndael.cipher(Utils.getBytesArray(textBlocks[block], this.rijndael.blockSize), keySchedule)
                    cipheredBlock = Utils.xorArrays(Utils.getBytesArray(textBlocks[block-1], this.rijndael.blockSize), cipher)
                }

                const cipherChar = new Array(this.rijndael.blockSize)

                _.range(0, this.rijndael.blockSize)
                    .map(i => {
                        cipherChar[i] = String.fromCharCode(cipheredBlock[i])
                    })

                cipherText += cipherChar.join('')

            })
        return Utils.base64Encode(cipherText)

    }

    decode (input: string, password: string, iv: string) {

        let encodedText = Utils.base64Decode(String(input))

        const ivBytes = Utils.getBytesArray(iv, this.rijndael.blockSize)
        const passwordBytes = Utils.getBytesArray(Utils.utf8Encode(password), this.rijndael.keySize)

        const keySchedule = this.rijndael.keyExpansion(passwordBytes)

        // разделяем зашифрованный текст на блоки
        const countOfBlocks = Math.ceil((encodedText.length - 8) / this.rijndael.blockSize)
        let ct = new Array(countOfBlocks)
        _.range(0, countOfBlocks)
            .map(b => ct[b] = encodedText.slice(b*this.rijndael.blockSize, b*this.rijndael.blockSize + this.rijndael.blockSize))
        let decipherText = ''

        let decipheredBlocks = [];

        _.range(0, countOfBlocks)
            .map(block => {
                if (block == 0) {
                    let xored = Utils.xorArrays(Utils.getBytesArray(ct[block], this.rijndael.blockSize), ivBytes)
                    let decipher = this.rijndael.decipher(xored, keySchedule)
                    decipheredBlocks.push(decipher)
                } else {
                    let xored = Utils.xorArrays(Utils.getBytesArray(ct[block], this.rijndael.blockSize), decipheredBlocks[block-1])
                    let decipher = this.rijndael.decipher(xored, keySchedule)
                    decipheredBlocks.push(decipher);
                }

                let decipherChars = new Array(this.rijndael.blockSize)

                _.range(0, this.rijndael.blockSize)
                    .map(i => {
                        decipherChars[i] = String.fromCharCode(decipheredBlocks[block][i])
                    })

                decipherText += decipherChars.join('')

            })
        return Utils.removeNullFromString(decipherText)

    }

}