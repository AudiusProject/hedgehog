
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
}

module.exports = Utils
