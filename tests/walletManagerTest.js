const assert = require('assert')
const { WalletManager } = require('../index')
const { entropy, walletAddress } = require('./helpers')

describe('WalletManager', async function () {
  it('should create a wallet ', async function () {
    this.timeout(20000)
    const data = await WalletManager.createWalletObj('testpassword')

    assert.notDeepStrictEqual(data.ivHex, null)
    assert.notDeepStrictEqual(data.cipherTextHex, null)
    assert.notDeepStrictEqual(data.walletObj, null)
    assert.notDeepStrictEqual(data.walletObj.getAddressString(), null)
    assert.notDeepStrictEqual(data.entropy, null)
  })

  it('should decrypt ciphertext with correct password and return wallet and entropy', async function () {
    this.timeout(20000)
    const data = await WalletManager.createWalletObj('testpassword')

    let decryptedData = await WalletManager.decryptCipherTextAndRetrieveWallet('testpassword', data.ivHex, data.cipherTextHex)
    assert.deepStrictEqual(decryptedData.entropy, data.entropy)
    assert.notDeepStrictEqual(decryptedData.walletObj, null)
  })

  it('should attempt to decrypt ciphertext and throw error for incorrect password', async function () {
    this.timeout(20000)
    const data = await WalletManager.createWalletObj('testpassword')

    try {
      await WalletManager.decryptCipherTextAndRetrieveWallet('testpassword2', data.ivHex, data.cipherTextHex)

      assert.fail('Should not be able to decrypt ciphertext with incorrect password')
    } catch (e) {
      assert.deepStrictEqual(1, 1)
    }
  })

  it('should retrieve a wallet from value stored in localstorage', async function () {
    // delete existing localstorage value and check it's null
    WalletManager.deleteEntropyFromLocalStorage()
    assert.deepStrictEqual(WalletManager.getEntropyFromLocalStorage(), null)

    // set entropy in localstorage and verify it's persisted
    WalletManager.setEntropyInLocalStorage(entropy)
    assert.deepStrictEqual(WalletManager.getEntropyFromLocalStorage(), entropy)
  })

  it(`should check that we can't retrieve a wallet from localhost if entropy is null`, async function () {
    WalletManager.deleteEntropyFromLocalStorage()
    let walletObj = WalletManager.getWalletObjFromLocalStorageIfExists()

    assert.deepStrictEqual(walletObj, null)
  })

  it('should check that we can retrieve a wallet from localhost if entropy is not null', async function () {
    WalletManager.setEntropyInLocalStorage(entropy)
    let walletObj = WalletManager.getWalletObjFromLocalStorageIfExists()

    assert.notDeepStrictEqual(walletObj, null)
    assert.deepStrictEqual(walletObj.getAddressString(), walletAddress)
  })
})
