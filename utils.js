const BufferSafe = require('safe-buffer').Buffer

const encryptPrefixStr = 'audius-entropy:::'

class Utils {
  // helpers to convert buffer to and from hex strings
  // https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript
  static bufferFromHexString (hexString) {
    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
  }

  static WebWorker (worker) {
    if (typeof window !== 'undefined' && window.Worker) {
      const code = worker.toString()
      const blob = new Blob(['(' + code + ')()'])
      return new window.Worker(URL.createObjectURL(blob))
    } else throw new Error('Cannot call web worker on the server')
  }

 /**
   * This prepends the encryptPrefixStr to the entropy, converts it to a buffer and returns the buffer
   * @param {String} entropy hex string of entropy
   * @returns {Buffer} buffer ready to encrypt via encryptFn
   */
  static createEncryptBuffer (entropy) {
    let buff = BufferSafe.from(encryptPrefixStr + entropy, 'utf8')
    return buff
  }

  // This accepts a buffer of the entropy, converts it to utf8 to check if the encryptPrefixStr
  // is present and returns the entropy string if valid, otherwise it throws an error
  /**
   * This converts the buffer returned by the decryption function, checks that the integrity
   * string exists so we know that the same encrypted value has been decrypted, parses the
   * entropy and returns
   * @param {Buffer} decryptedEntropyBuffer value returned by decryptFn decryption
   * @returns {String} entropy hex string
   */
  static verifyDecryptString (decryptedEntropyBuffer) {
    let decryptedEntrophy = decryptedEntropyBuffer.toString('utf8')

    if (decryptedEntrophy && decryptedEntrophy.indexOf(encryptPrefixStr) === 0) {
      return decryptedEntrophy.split(encryptPrefixStr)[1]
    } else throw new Error('Could not verify integrity of decrypted string')
  }
}

module.exports = Utils
