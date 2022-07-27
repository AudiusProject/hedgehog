const assert = require('assert')
const { WalletManager, getPlatformCreateKey } = require('../src')
const { entropy, walletAddress } = require('./helpers')
const { LocalStorage } = require('node-localstorage')

const createKey = getPlatformCreateKey()

describe('WalletManager', async function () {
  it('should create a wallet ', async function () {
    const localStorage = new LocalStorage('./local-storage')
    this.timeout(20000)
    const data = await WalletManager.createWalletObj(
      'testpassword',
      undefined,
      localStorage,
      createKey
    )

    assert.notDeepStrictEqual(data.ivHex, null)
    assert.notDeepStrictEqual(data.cipherTextHex, null)
    assert.notDeepStrictEqual(data.walletObj, null)
    assert.notDeepStrictEqual(data.walletObj.getAddressString(), null)
    assert.notDeepStrictEqual(data.entropy, null)
  })

  it('should decrypt ciphertext with correct password and return wallet and entropy', async function () {
    const localStorage = new LocalStorage('./local-storage')
    this.timeout(20000)
    const data = await WalletManager.createWalletObj(
      'testpassword',
      undefined,
      localStorage,
      createKey
    )

    const decryptedData =
      await WalletManager.decryptCipherTextAndRetrieveWallet(
        'testpassword',
        data.ivHex,
        data.cipherTextHex,
        createKey
      )
    assert.deepStrictEqual(decryptedData.entropy, data.entropy)
    assert.notDeepStrictEqual(decryptedData.walletObj, null)
  })

  it('should attempt to decrypt ciphertext and throw error for incorrect password', async function () {
    const localStorage = new LocalStorage('./local-storage')
    this.timeout(20000)
    const data = await WalletManager.createWalletObj(
      'testpassword',
      undefined,
      localStorage,
      createKey
    )

    try {
      await WalletManager.decryptCipherTextAndRetrieveWallet(
        'testpassword2',
        data.ivHex,
        data.cipherTextHex,
        createKey
      )

      assert.fail(
        'Should not be able to decrypt ciphertext with incorrect password'
      )
    } catch (e) {
      assert.deepStrictEqual(1, 1)
    }
  })

  it('should retrieve a wallet from value stored in localstorage', async function () {
    const localStorage = new LocalStorage('./local-storage')
    // delete existing localstorage value and check it's null
    await WalletManager.deleteEntropyFromLocalStorage(localStorage)
    const res = await WalletManager.getEntropyFromLocalStorage(localStorage)
    assert.deepStrictEqual(res, null)

    // set entropy in localstorage and verify it's persisted
    await WalletManager.setEntropyInLocalStorage(entropy, localStorage)
    const res2 = await WalletManager.getEntropyFromLocalStorage(localStorage)
    assert.deepStrictEqual(res2, entropy)
  })

  it("should check that we can't retrieve a wallet from localhost if entropy is null", async function () {
    const localStorage = new LocalStorage('./local-storage')
    await WalletManager.deleteEntropyFromLocalStorage(localStorage)
    const walletObj = await WalletManager.getWalletObjFromLocalStorageIfExists(
      localStorage
    )

    assert.deepStrictEqual(walletObj, null)
  })

  it('should check that we can retrieve a wallet from localhost if entropy is not null', async function () {
    const localStorage = new LocalStorage('./local-storage')
    await WalletManager.setEntropyInLocalStorage(entropy, localStorage)
    const walletObj = await WalletManager.getWalletObjFromLocalStorageIfExists(
      localStorage
    )

    assert.notDeepStrictEqual(walletObj, null)
    assert.deepStrictEqual(walletObj.getAddressString(), walletAddress)
  })
})
