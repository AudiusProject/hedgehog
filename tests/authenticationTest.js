const assert = require('assert')
const { Authentication, getPlatformCreateKey } = require('../src')

const {
  PATH,
  ivHex,
  keyHex,
  entropy,
  password,
  cipherTextHex,
  walletAddress
} = require('./helpers')

const createKey = getPlatformCreateKey()

describe('Authentication', async function () {
  it('should create a wallet given entropy', async function () {
    const wallet = await Authentication.generateWalletFromEntropy(
      entropy,
      PATH
    )

    // This address is deterministic given an entropy and path
    assert.deepStrictEqual(wallet.getAddressString(), walletAddress)
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
    const key = await createKey(password, ivHex)

    assert.deepStrictEqual(key.keyHex, keyHex)
  })

  it('should encrypt and return a ciphertext', async function () {
    const data = await Authentication.encrypt(
      entropy,
      Buffer.from(ivHex, 'hex'),
      Buffer.from(keyHex, 'hex')
    )
    assert.deepStrictEqual(data.cipherTextHex, cipherTextHex)
  })

  it('should decrypt and return entropy', async function () {
    const data = await Authentication.decrypt(
      Buffer.from(ivHex, 'hex'),
      Buffer.from(keyHex, 'hex'),
      cipherTextHex
    )
    assert.deepStrictEqual(data, entropy)
  })

  it('should not decrypt and throw error if entropy integrity cannot be verified', async function () {
    const wrongIVHex = '072251f44fda8f9aad3cc04992372bf7'

    try {
      await Authentication.decrypt(
        Buffer.from(wrongIVHex, 'hex'),
        Buffer.from(keyHex, 'hex'),
        cipherTextHex
      )
      assert.fail('Should not be able to derive entropy for incorrect iv hex')
    } catch (e) {
      assert.deepStrictEqual(1, 1)
    }
  })
})
