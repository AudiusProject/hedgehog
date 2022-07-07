class Utils {
  // helpers to convert buffer to and from hex strings
  // https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript
  static bufferFromHexString (hexString) {
    return new Uint8Array(
      hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    )
  }

  static WebWorker (worker) {
    if (typeof window !== 'undefined' && window.Worker) {
      const code = worker.toString()
      const blob = new Blob(['(' + code + ')()'])
      return new window.Worker(URL.createObjectURL(blob))
    } else throw new Error('Cannot call web worker on the server')
  }

  /**
   * Fallback for localStorage that works in node and the browser
   * @returns localStorage
   */
  static getPlatformLocalStorage () {
    if (typeof window === 'undefined' || window === null) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const LocalStorage = require('node-localstorage').LocalStorage
      return new LocalStorage('./local-storage')
    } else {
      return window.localStorage
    }
  }
}

module.exports = Utils
