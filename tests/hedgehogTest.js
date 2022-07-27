const assert = require('assert')
const { Hedgehog, WalletManager } = require('../src')
const { LocalStorage } = require('node-localstorage')
const {
  ivHex,
  entropy,
  password,
  cipherTextHex,
  walletAddress,
  lookupKey,
  username,
  users
} = require('./helpers')

let hh = null
let authData = null
let userData = null

// Makeshift DB logic
const getFn = (obj) => {
  if (obj && authData && userData && obj.lookupKey === authData.lookupKey) {
    return authData
  } else return null
}
const setAuthFn = (obj) => {
  authData = obj
}

const setUserFn = (obj) => {
  userData = obj
}

const resetDataInDB = () => {
  authData = null
  userData = null
}
const setDataInDB = (auth, user) => {
  authData = auth
  userData = user
}

const authValues = {
  iv: ivHex,
  cipherText: cipherTextHex,
  lookupKey
}

const userValues = {
  walletAddress,
  username
}

const localStorage = new LocalStorage('./local-storage')

beforeEach(async function () {
  // brand new hedgehog instance before each test block
  // also clears entropy from local storage so there is no wallet or localStorage state between tests
  await WalletManager.deleteEntropyFromLocalStorage(localStorage)
  hh = new Hedgehog(getFn, setAuthFn, setUserFn, true, localStorage)
})

describe('Hedgehog', async function () {
  it('should fail with incorrect constructor arguments', async function () {
    try {
      Hedgehog()
      assert.fail(
        'Should not be allowed to create Hedgehog object without setAuthFn, setUserFn and getFn args'
      )
    } catch (e) {
      assert.deepStrictEqual(1, 1)
    }
  })

  it('should attempt to login without a user account - should fail ', async function () {
    this.timeout(15000)
    resetDataInDB()

    try {
      await hh.login(username, password)
      assert.fail("Should not login if there's non user record")
    } catch (e) {
      assert.deepStrictEqual(1, 1)
      assert.deepStrictEqual(hh.isLoggedIn(), false)
    }
  })

  it('should sign up for an account ', async function () {
    this.timeout(15000)
    resetDataInDB()

    const walletObj = await hh.signUp(username, password)
    assert.notDeepStrictEqual(walletObj.getAddressString(), null)

    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)
  })

  it('should logout after logging in', async function () {
    this.timeout(15000)
    setDataInDB(authValues, userValues)

    const walletObj = await hh.login(username, password)
    assert.notDeepStrictEqual(walletObj.getAddressString(), null)
    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)

    await hh.logout()
    assert.deepStrictEqual(hh.isLoggedIn(), false)
    assert.deepStrictEqual(!!hh.getWallet(), false)
  })

  it('should log in and fail one credential confirmation and pass the other', async function () {
    this.timeout(15000)
    setDataInDB(authValues, userValues)
    await hh.login(username, password)
    assert.strictEqual(
      await hh.confirmCredentials(username, password + '~'),
      false,
      'credentials should not confirm - wrong password'
    )
    assert.strictEqual(
      await hh.confirmCredentials(username, password),
      true,
      'credentials should confirm'
    )
  })

  it('should fail credential confirmation as not logged in', async function () {
    this.timeout(15000)
    assert.strictEqual(
      await hh.confirmCredentials(username, password),
      false,
      'credentials should not confirm - not logged in'
    )
  })

  it('should fail credential confirmation as the credentials are for the wrong user', async function () {
    this.timeout(15000)
    setDataInDB(authValues, userValues)
    await hh.login(username, password)
    setDataInDB(
      {
        iv: users[1].ivHex,
        cipherText: users[1].cipherTextHex,
        lookupKey: users[1].lookupKey
      },
      { walletAddress: users[1].walletAddress, username: users[1].username }
    )
    const result = await hh.confirmCredentials(
      users[1].username,
      users[1].password
    )
    assert.strictEqual(
      result,
      false,
      'credentials should not confirm for wrong user'
    )
  })

  it('should restore wallet from entropy stored in localStorage', async function () {
    await WalletManager.setEntropyInLocalStorage(entropy, localStorage)
    const walletObj = await hh.restoreLocalWallet()
    assert.deepStrictEqual(walletObj.getAddressString(), walletAddress)
  })

  it('should not restore wallet if no entropy stored in localStorage', async function () {
    await WalletManager.deleteEntropyFromLocalStorage(localStorage)
    const walletObj = await hh.restoreLocalWallet()
    assert.deepStrictEqual(walletObj, null)
  })

  it('should fail if attempting to create wallet object without password', async function () {
    try {
      await hh.createWalletObj()
      assert.fail(
        'Should not allow creating a wallet object without a password'
      )
    } catch (e) {
      assert.deepStrictEqual(1, 1)
    }
  })

  it('should create a wallet object', async function () {
    this.timeout(15000)
    assert.deepStrictEqual(hh.isLoggedIn(), false)
    assert.deepStrictEqual(hh.getWallet(), null)

    const walletObj = await hh.createWalletObj(password)
    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)
  })
})
