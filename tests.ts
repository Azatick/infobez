import { describe, it } from 'mocha'
import { assert } from 'chai'
import * as Utils from './Utils'

import Rijndael from './Rijndael'

let cipher = new Rijndael(16, 16);

describe('cipher', () => {
    it('Шифрование и расшифрование открытого текста с правильным паролем', () => {
        let pass = '12345'
        let text = 'The secret Azat Message asasasas'
        let encrypt = cipher.encode(text, pass)
        let decrypt = cipher.decode(encrypt, pass)
        assert.equal(decrypt, text)
    })
    it('Шифрование и расшифрование открытого текста с неправильным паролем', () => {
        let pass = '12345'
        let text = 'The secret Azat Message asasasas'
        let encrypt = cipher.encode(text, pass)
        let decrypt = cipher.decode(encrypt, '1234')
        assert.notEqual(decrypt, text)
    })
})

