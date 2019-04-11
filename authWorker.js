// This file is to do the computation for createKey inside a WebWorker.
// It's saved as a blob on the browser and is imported and called as necessary.
// This means that the API support is limited to what a WebWorker supports, so
// no require statements, no breaking out functions to refactor with multiple
// exports etc.

module.exports = function () {
  self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.js')

  const createKey = (password, ivHex) => {
    const cryptoIV = self.CryptoJS.enc.Utf8.parse(ivHex) // cryptoJS expects the iv to be in this special format
    const key = self.CryptoJS.PBKDF2(password, cryptoIV, { keySize: 8, iterations: 50000, hasher: self.CryptoJS.algo.SHA512 })

    // This is the private key
    const keyHex = key.toString(self.CryptoJS.enc.Hex)
    let keyBuffer = bufferFromHexString(keyHex)

    postMessage({ keyHex: keyHex, keyBuffer: keyBuffer })
  }

  function bufferFromHexString (hexString) {
    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
  }

  self.onmessage = e => {
    if (!e) return
    let d = JSON.parse(e.data)
    createKey(d.password, d.ivHex)
  }
}
