const Utils = require('./utils')
const Authentication = require('./authentication')

let localStorageReference
if (typeof window === 'undefined' || window === null) {
  const LocalStorage = require('node-localstorage').LocalStorage
  localStorageReference = new LocalStorage('./local-storage')
} else {
  localStorageReference = window.localStorage
}

// primary account management key for HD wallet
// TODO - make these options that can be overridden
const PATH = "m/44'/60'/0'/0/0"
const hedgehogEntropyKey = 'hedgehog-entropy-key'

// Contains functions to help create and maintain user accounts client side
// The reason many functions return both buffer and hex strings is because different
// packages expect different formats. So if a value is used in multiple formats, all
// the formats are returned by the generation function
class WalletManager {
  static async createWalletObj (password) {
    let self = this

    const { ivBuffer, ivHex } = Authentication.createIV()
    const { keyBuffer } = await Authentication.createKey(password, ivHex)
    const { entropy } = Authentication.generateMnemonicAndEntropy()
    let walletObj = Authentication.generateWalletFromEntropy(entropy, PATH)
    const { cipherTextHex } = Authentication.encrypt(entropy, ivBuffer, keyBuffer)

    self.setEntropyInLocalStorage(entropy)
    return { ivHex: ivHex, cipherTextHex: cipherTextHex, walletObj: walletObj, entropy: entropy }
  }

  static async decryptCipherTextAndRetrieveWallet (password, ivHex, cipherTextHex) {
    const { keyBuffer } = await Authentication.createKey(password, ivHex)
    const ivBuffer = Utils.bufferFromHexString(ivHex)
    const decryptedEntrophy = Authentication.decrypt(ivBuffer, keyBuffer, cipherTextHex)
    let walletObj = Authentication.generateWalletFromEntropy(decryptedEntrophy, PATH)

    return { walletObj: walletObj, entropy: decryptedEntrophy }
  }

  static async createAuthLookupKey (email, password) {
    // lowercase email so the lookupKey is consistently generated to search in the database
    email = email.toLowerCase()
    // This iv is hardcoded because the auth lookup key should be deterministically
    // generated given the same email and password
    const ivHex = '0x4f7242b39969c3ac4c6712524d633ce9'
    const { keyHex } = await Authentication.createKey(email + ':::' + password, ivHex)

    return keyHex
  }

  static getEntropyFromLocalStorage () {
    let entropy = localStorageReference.getItem(hedgehogEntropyKey)

    // Sometimes the string 'undefined' was being written to localstorage
    // this is an explicit check for that
    if (entropy && entropy !== 'undefined') {
      return entropy
    } else return null
  }

  static getWalletObjFromLocalStorageIfExists () {
    let entropy = localStorageReference.getItem(hedgehogEntropyKey)
    let entropy = getEntropyFromLocalStorage()
    let walletObj = Authentication.generateWalletFromEntropy(entropy, PATH)
    if(walletObj) return walletObj
    else return null
  }

  static setEntropyInLocalStorage (entropy) {
    localStorageReference.setItem(hedgehogEntropyKey, entropy)
  }

  static deleteEntropyFromLocalStorage () {
    localStorageReference.removeItem(hedgehogEntropyKey)
  }

}

module.exports = WalletManager
