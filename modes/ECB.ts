import * as _ from "lodash";
import * as Utils from "../Utils";
import Rijndael from "../Rijndael";
import AMode from "./AMode";

export default class ECB extends AMode {

    constructor (rijndael: Rijndael) {
        super(rijndael)
    }

    encode (input: string, password: string, iv?: string) {

        let plaintext = Utils.utf8Encode(input)
        this.rijndael.password = Utils.utf8Encode(password)

        const passwordBytes = Utils.getBytesArray(this.rijndael.password, this.rijndael.keySize)

        const keySchedule = this.rijndael.keyExpansion(passwordBytes)

        const countOfBlocks = Math.ceil(plaintext.length / this.rijndael.blockSize)
        let cipherText = ''

        _.range(0, countOfBlocks)
            .map(block => {
                const textBlock = plaintext.slice(block*this.rijndael.blockSize, (block+1)*this.rijndael.blockSize)

                const cipher = this.rijndael.cipher(Utils.getBytesArray(textBlock, this.rijndael.blockSize), keySchedule)

                const cipherChar = new Array(this.rijndael.blockSize)

                _.range(0, this.rijndael.blockSize)
                    .map(i => {
                        cipherChar[i] = String.fromCharCode(cipher[i])
                    })

                cipherText += cipherChar.join('')

            })
        return Utils.base64Encode(cipherText)

    }

    decode (input: string, password: string, iv?: string) {

        let encodedText = Utils.base64Decode(String(input))

        const passwordBytes = Utils.getBytesArray(Utils.utf8Encode(password), this.rijndael.keySize)

        const keySchedule = this.rijndael.keyExpansion(passwordBytes)

        // разделяем зашифрованный текст на блоки
        const countOfBlocks = Math.ceil((encodedText.length - 8) / this.rijndael.blockSize)
        let ct = new Array(countOfBlocks)
        _.range(0, countOfBlocks)
            .map(b => ct[b] = encodedText.slice(8+b*this.rijndael.blockSize, 8+b*this.rijndael.blockSize + this.rijndael.blockSize))
        let decipherText = ''

        _.range(0, countOfBlocks)
            .map(block => {
                const encodedBlock = encodedText.slice(block*this.rijndael.blockSize, (block+1)*this.rijndael.blockSize)
                const decipher = this.rijndael.decipher(Utils.getBytesArray(encodedBlock, this.rijndael.blockSize), keySchedule)

                let decipherChars = new Array(this.rijndael.blockSize)

                _.range(0, this.rijndael.blockSize)
                    .map(i => {
                        decipherChars[i] = String.fromCharCode(decipher[i])
                    })

                decipherText += decipherChars.join('')

            })
        return Utils.removeNullFromString(decipherText)

    }

}