// This file is to do the computation for createKey inside a WebWorker.
// It's saved as a blob on the browser and is imported and called as necessary.
// This means that the API support is limited to what a WebWorker supports, so
// no require statements, no breaking out functions to refactor with multiple
// exports etc.

module.exports = function () {
  // Package and deps for https://github.com/ricmoo/scrypt-js
  self.importScripts('https://cdn.jsdelivr.net/npm/scrypt-js@2.0.4/scrypt.min.js')
  self.importScripts('https://raw.githack.com/ricmoo/scrypt-js/master/thirdparty/buffer.js')

  const createKey = (password, ivHex) => {
    const passwordBuffer = self.buffer.SlowBuffer(password)
    const ivBuffer = self.buffer.SlowBuffer(ivHex)

    const N = 32768
    const r = 8
    const p = 1
    const dkLen = 32

    self.scrypt(passwordBuffer, ivBuffer, N, r, p, dkLen, function (error, progress, key) {
      if (error) {
        throw error
      } else if (key) {
        key = new self.buffer.SlowBuffer(key)
        const keyHex = key.toString('hex')
        postMessage({ keyHex: keyHex, keyBuffer: key })
      } else {
        throw new Error('did not get a valid key from scrypt')
      }
    })
  }

  self.onmessage = e => {
    if (!e) return
    let d = JSON.parse(e.data)
    createKey(d.password, d.ivHex)
  }
}
