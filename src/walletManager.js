const Utils = require('./utils')
const Authentication = require('./authentication')

// primary account management key for HD wallet
// TODO - make these options that can be overridden
const PATH = "m/44'/60'/0'/0/0"
const hedgehogEntropyKey = 'hedgehog-entropy-key'

// Contains functions to help create and maintain user accounts client side
// The reason many functions return both buffer and hex strings is because different
// packages expect different formats. So if a value is used in multiple formats, all
// the formats are returned by the generation function
class WalletManager {
  static async createWalletObj (password, entropyOverride = null, localStorage) {
    let self = this
    let entropy

    if (!password) return new Error('Missing property: password')

    const { ivBuffer, ivHex } = Authentication.createIV()
    const { keyBuffer } = await Authentication.createKey(password, ivHex)
    if (!entropyOverride) {
      entropy = Authentication.generateMnemonicAndEntropy()['entropy']
    } else {
      entropy = entropyOverride
    }
    let walletObj = Authentication.generateWalletFromEntropy(entropy, PATH)
    const { cipherTextHex } = Authentication.encrypt(
      entropy,
      ivBuffer,
      keyBuffer
    )

    await self.setEntropyInLocalStorage(entropy, localStorage)
    return {
      ivHex: ivHex,
      cipherTextHex: cipherTextHex,
      walletObj: walletObj,
      entropy: entropy
    }
  }

  static async decryptCipherTextAndRetrieveWallet (
    password,
    ivHex,
    cipherTextHex
  ) {
    const { keyBuffer } = await Authentication.createKey(password, ivHex)
    const ivBuffer = Utils.bufferFromHexString(ivHex)
    const decryptedEntrophy = Authentication.decrypt(
      ivBuffer,
      keyBuffer,
      cipherTextHex
    )
    let walletObj = Authentication.generateWalletFromEntropy(
      decryptedEntrophy,
      PATH
    )

    return { walletObj: walletObj, entropy: decryptedEntrophy }
  }

  static async createAuthLookupKey (username, password) {
    // lowercase username so the lookupKey is consistently generated to search in the database
    username = username.toLowerCase()
    // This iv is hardcoded because the auth lookup key should be deterministically
    // generated given the same username and password
    const ivHex = '0x4f7242b39969c3ac4c6712524d633ce9'
    const { keyHex } = await Authentication.createKey(
      username + ':::' + password,
      ivHex
    )
    return keyHex
  }

  static async getEntropyFromLocalStorage (localStorage) {
    let entropy = await localStorage.getItem(hedgehogEntropyKey)

    // Sometimes the string 'undefined' was being written to localstorage
    // this is an explicit check for that
    if (entropy && entropy !== 'undefined') {
      return entropy
    } else return null
  }

  static async getWalletObjFromLocalStorageIfExists (localStorage) {
    let entropy = await this.getEntropyFromLocalStorage(localStorage)
    if (entropy) {
      let walletObj = Authentication.generateWalletFromEntropy(entropy, PATH)

      if (walletObj) return walletObj
      else return null
    } else return null
  }

  static async setEntropyInLocalStorage (entropy, localStorage) {
    await localStorage.setItem(hedgehogEntropyKey, entropy)
  }

  static async deleteEntropyFromLocalStorage (localStorage) {
    await localStorage.removeItem(hedgehogEntropyKey)
  }
}

module.exports = WalletManager
