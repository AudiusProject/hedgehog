const assert = require('assert')
const { Hedgehog, WalletManager } = require('../index')

var hh = null
var data = null

const entropy = '47b0e5e107cccc3297d88647c6e84a9f'
const addressStr = '0xd20ec9deee07b4bdeb28ed5d6dd070cb33c5aa45'
const email = 'email@address.com'
const password = 'testpassword'

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
  'iv': 'c112af7cfd50b6155e56952ef26afe96',
  'cipherText': 'de9e25a4f7e041fd999463a9312cb4737c07382182d3b83d0d38e8f2fbbcba713070cd21751e2423373fc1eed20ad6340b77da8ab8701cd74dbce5eefb927523',
  'lookupKey': '6cb45551ead35655c833c947a282eff6ae5897895c3249dc935624e8af6fdbd9',
  'email': 'email@address.com',
  'ownerWallet': '0x692612b50cafb6c61cd2d934b5af5615c38b693d'
}

beforeEach(function () {
  // brand new hedgehog instance before each test block
  // also clears entropy from local storage so there is no wallet or localStorage state between tests
  hh = new Hedgehog(getFn, setFn)
  WalletManager.deleteEntropyFromLocalStorage()
})

describe('Hedgehog', async function () {
  it('should attempt to login without a user account - should fail ', async function () {
    this.timeout(15000)
    resetDataInDB()

    try {
      await hh.login(email, password)
      assert.fail('Should not login if there\'s non user record')
    } catch (e) {
      assert.deepStrictEqual(1, 1)
      assert.deepStrictEqual(hh.isLoggedIn(), false)
      assert.deepStrictEqual(hh.walletExistsLocally(), false)
    }
  })

  it('should sign up for an account ', async function () {
    this.timeout(15000)
    resetDataInDB()

    let walletObj = await hh.signUp(email, password)
    assert.notDeepStrictEqual(walletObj.getAddressString(), null)

    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.walletExistsLocally(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)
  })

  it('should logout after logging in', async function () {
    this.timeout(15000)
    setDataInDB(authArtifacts)

    let walletObj = await hh.login(email, password)
    assert.notDeepStrictEqual(walletObj.getAddressString(), null)
    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.walletExistsLocally(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)

    hh.logout()
    assert.deepStrictEqual(hh.isLoggedIn(), false)
    assert.deepStrictEqual(hh.walletExistsLocally(), false)
    assert.deepStrictEqual(!!hh.getWallet(), false)
  })

  it('should restore wallet from entropy stored in localStorage', async function () {
    WalletManager.setEntropyInLocalStorage(entropy)
    let walletObj = hh.restoreLocalSession()
    assert.deepStrictEqual(walletObj.getAddressString(), addressStr)
  })

  it('should not restore wallet if no entropy stored in localStorage', async function () {
    WalletManager.deleteEntropyFromLocalStorage()
    let walletObj = hh.restoreLocalSession()
    assert.deepStrictEqual(walletObj, null)
  })

  it('should create a wallet object', async function () {
    this.timeout(15000)
    assert.deepStrictEqual(hh.isLoggedIn(), false)
    assert.deepStrictEqual(hh.walletExistsLocally(), false)
    assert.deepStrictEqual(hh.getWallet(), null)

    let walletObj = await hh.createWalletObj(password)
    assert.deepStrictEqual(hh.isLoggedIn(), true)
    assert.deepStrictEqual(hh.walletExistsLocally(), true)
    assert.deepStrictEqual(hh.getWallet(), walletObj)
  })
})
