import { describe, it } from 'mocha'
import { assert } from 'chai'

import Groestl from './Groestl'

describe('blockSizing', () => {

    it('Размер blockSize для выходного размера в 224 бит', () => {

        let groestl = new Groestl(224)

        assert.equal(groestl.blockSize, 512)


    })

    it('Размер blockSize для выходного размера в 256 бит', () => {

        let groestl = new Groestl(256)

        assert.equal(groestl.blockSize, 512)


    })

    it('Размер blockSize для выходного размера в 384 бит', () => {

        let groestl = new Groestl(384)

        assert.equal(groestl.blockSize, 1024)

    })

    it('Размер blockSize для выходного размера в 512 бит', () => {

        let groestl = new Groestl(512)

        assert.equal(groestl.blockSize, 1024)

    })

})