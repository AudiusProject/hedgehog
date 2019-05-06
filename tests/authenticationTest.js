const assert = require('assert')
const { Authentication } = require('../index')

const PATH = "m/44'/60'/0'/0/0"
const ivHex = '072251f44fda8f9aad3cc04992372bf6'
const keyHex = '2f106076998c4ca94bfde584968c6945192ce19618d10d52d8c3ad3f8f87009b'
const entropy = '47b0e5e107cccc3297d88647c6e84a9f'
const password = 'testpassword'
const cipherTextHex = '9dba56a2d0c3cdd6184938658bfbb8ed7c1e582f58343d76c9bcc8e8026ccc5c772a6240928ba37db3cc678ad12f8927dc93d604182a029dab248ab84db9ccae'
const addressStr = '0xd20ec9deee07b4bdeb28ed5d6dd070cb33c5aa45'

describe('Authentication', async function () {
  it('should create a wallet given entropy', async function () {
    const wallet = Authentication.generateWalletFromEntropy(entropy, PATH)

    // This address is deterministic given an entropy and path
    assert.deepStrictEqual(wallet.getAddressString(), addressStr)
  })

  it('should generate a mnemonic and entropy', async function () {
    const data = Authentication.generateMnemonicAndEntropy()

    assert.notDeepStrictEqual(data.mnemonic, null)
    assert.notDeepStrictEqual(data.entropy, null)
  })

  it('should create an initialization vector', async function () {
    const iv = Authentication.createIV()

    assert.notDeepStrictEqual(iv.ivHex, null)
    assert.notDeepStrictEqual(iv.ivBuffer, null)
  })

  it('should create a key', async function () {
    this.timeout(15000)
    const key = await Authentication.createKey(password, ivHex)

    assert.deepStrictEqual(key.keyHex, keyHex)
  })

  it('should encrypt and return a ciphertext', async function () {
    const data = await Authentication.encrypt(entropy, Buffer.from(ivHex, 'hex'), Buffer.from(keyHex, 'hex'))
    assert.deepStrictEqual(data.cipherTextHex, cipherTextHex)
  })

  it('should decrypt and return entropy', async function () {
    const data = await Authentication.decrypt(Buffer.from(ivHex, 'hex'), Buffer.from(keyHex, 'hex'), cipherTextHex)
    assert.deepStrictEqual(data, entropy)
  })

  it('should not decrypt and throw error if entropy integrity cannot be verified', async function () {
    let wrongIVHex = '072251f44fda8f9aad3cc04992372bf7'

    try {
      await Authentication.decrypt(Buffer.from(wrongIVHex, 'hex'), Buffer.from(keyHex, 'hex'), cipherTextHex)
      assert.fail('Should not be able to derive entropy for incorrect iv hex')
    } catch (e) {
      assert.deepStrictEqual(1, 1)
    }
  })
})
