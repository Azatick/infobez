import { describe, it } from 'mocha'
import { assert } from 'chai'

import Rijndael from './Rijndael'
import _ = require('lodash');


describe('ecb', () => {
    let cipher = new Rijndael('ecb', 16, 16);
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

describe('pbc', () => {
    let cipher = new Rijndael('pbc', 16, 16);
    it('Шифрование и расшифрование открытого текста с правильным паролем', () => {
        let pass = '12345'
        let text = 'The secret message'
        let iv = (_.random(0, _.random(0, 1000)) * new Date().valueOf()).toString();
        let encrypt = cipher.encode(text, pass, iv)
        let decrypt = cipher.decode(encrypt, pass, iv)
        assert.equal(decrypt, text)
    })
    it('Шифрование и расшифрование открытого текста с неправильным паролем', () => {
        let pass = '12345'
        let text = 'The secret message'
        let iv = (_.random(0, _.random(0, 1000)) * new Date().valueOf()).toString();
        let encrypt = cipher.encode(text, pass, iv)
        let decrypt = cipher.decode(encrypt, '1234', iv)
        assert.notEqual(decrypt, text)
    })
    it('Шифрование и расшифрование открытого текста с неправильным IV', () => {
        let pass = '12345'
        let text = 'The secret message'
        let iv = (_.random(0, _.random(0, 1000)) * new Date().valueOf()).toString();
        let encrypt = cipher.encode(text, pass, iv)
        let decrypt = cipher.decode(encrypt, '1234', 'fhdusfd126126')
        assert.notEqual(decrypt, text)
    })
})
