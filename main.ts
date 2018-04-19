import Rijndael from './Rijndael'

const cipher = new Rijndael(16, 16)

let pass = '5656'
let encoded = cipher.encode("The secret", pass)
let decoded = cipher.decode(encoded, pass)
console.log(`Encoded: ${encoded}`)
console.log(`Decoded: ${decoded}`)