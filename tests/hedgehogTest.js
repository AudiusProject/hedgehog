const assert = require('assert')
const { Hedgehog, WalletManager } = require('../index')
const { ivHex, entropy, password, cipherTextHex, addressStr, lookupKey, email } = require('./helpers')

var hh = null
var data = null

// Makeshift DB logic
const getFn = (obj) => {
  if (obj && data && obj.lookupKey === data.lookupKey && obj.email === data.email) return data
  else return null
}
const setFn = (obj) => {
  data = obj
}
const resetDataInDB = () => {
  data = null
}
const setDataInDB = (d) => {
  data = d
}

// email is `email@address.com`, password is `testpassword`
const authArtifacts = {
  iv: ivHex,
  cipherText: cipherTextHex,
  ownerWallet: addressStr,
  lookupKey,
  email
}

beforeEach(function () {
  // brand new hedgehog instance before each test block
  // also clears entropy from local storage so there is no wallet or localStorage state between tests
  hh = new Hedgehog(getFn, setFn)
  WalletManager.deleteEntropyFromLocalStorage()
})

describe('Hedgehog', async function () {
  it('should fail with incorrect constructor arguments', async function () {
    try {
      Hedgehog()
      assert.fail('Should not be allowed to create Hedgehog object without setFn and getFn args')
    } catch (e) {
      assert.deepStrictEqual(1, 1)
    }
  })

  it('should attempt to login without a user account - should fail ', async function () {
    this.timeout(15000)
    resetDataInDB()

    try {
      await hh.login(email, password)
      assert.fail('Should not login if there\'s non user record')
    } catch (e) {
      assert.deepStrictEqual(1, 1)
      assert.deepStrictEqual(hh.isLoggedIn(), false)
    }
  })

  it('should sign up for an account ', async function () {
    this.timeout(15000)
    resetDataInDB()

    let walletObj = await hh.signUp(email, password)
    assert.notDeepStrictEqual(walletObj.getAddressString(), null)

    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)
  })

  it('should logout after logging in', async function () {
    this.timeout(15000)
    setDataInDB(authArtifacts)

    let walletObj = await hh.login(email, password)
    assert.notDeepStrictEqual(walletObj.getAddressString(), null)
    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)

    hh.logout()
    assert.deepStrictEqual(hh.isLoggedIn(), false)
    assert.deepStrictEqual(!!hh.getWallet(), false)
  })

  it('should restore wallet from entropy stored in localStorage', async function () {
    WalletManager.setEntropyInLocalStorage(entropy)
    let walletObj = hh.restoreLocalWallet()
    assert.deepStrictEqual(walletObj.getAddressString(), addressStr)
  })

  it('should not restore wallet if no entropy stored in localStorage', async function () {
    WalletManager.deleteEntropyFromLocalStorage()
    let walletObj = hh.restoreLocalWallet()
    assert.deepStrictEqual(walletObj, null)
  })

  it('should fail if attempting to create wallet object without password', async function () {
    try {
      await hh.createWalletObj()
      assert.fail('Should not allow creating a wallet object without a password')
    } catch (e) {
      assert.deepStrictEqual(1, 1)
    }
  })

  it('should create a wallet object', async function () {
    this.timeout(15000)
    assert.deepStrictEqual(hh.isLoggedIn(), false)
    assert.deepStrictEqual(hh.getWallet(), null)

    let walletObj = await hh.createWalletObj(password)
    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)
  })
})
