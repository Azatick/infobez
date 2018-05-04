import Rijndael from "../Rijndael/Rijndael";

export default abstract class AMode {

    rijndael: Rijndael

    constructor (rijndael: Rijndael) {
        this.rijndael = rijndael
    }

    abstract encode (input: string, password: string, iv?: string)
    abstract decode (input: string, password: string, iv?: string)

}