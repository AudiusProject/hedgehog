const Utils = require('./utils')
const AuthHelpers = require('./authHelpers')

let localStorageReference
if (typeof window === 'undefined' || window === null) {
  const LocalStorage = require('node-localstorage').LocalStorage
  localStorageReference = new LocalStorage('./local-storage')
} else {
  localStorageReference = window.localStorage
}

// primary account management key for HD wallet
const PATH = "m/44'/60'/0'/0/0"
const audiusEntropyKey = 'audius-entropy-key'

// Contains functions to help create and maintain user accounts client side
// The reason many functions return both buffer and hex strings is because different
// packages expect different formats. So if a value is used in multiple formats, all
// the formats are returned by the generation function
class WalletManager {
  static async createWalletObj (password) {
    let self = this

    const { ivBuffer, ivHex } = AuthHelpers.createIV()
    const { keyBuffer } = await AuthHelpers.createKey(password, ivHex)
    const { entropy } = AuthHelpers.generateMnemonicAndEntropy()
    let walletObj = AuthHelpers.generateWalletFromEntropy(entropy, PATH)
    const { cipherTextHex } = AuthHelpers.encrypt(entropy, ivBuffer, keyBuffer)

    self.setEntropyInLocalStorage(entropy)
    return { ivHex: ivHex, cipherTextHex: cipherTextHex, walletObj: walletObj, entropy: entropy }
  }

  static async decryptCipherTextAndRetrieveWallet (password, ivHex, cipherTextHex) {
    let self = this
    const { keyBuffer } = await AuthHelpers.createKey(password, ivHex)
    const ivBuffer = Utils.bufferFromHexString(ivHex)
    const decryptedEntrophy = AuthHelpers.decrypt(ivBuffer, keyBuffer, cipherTextHex)
    let walletObj = AuthHelpers.generateWalletFromEntropy(decryptedEntrophy, PATH)

    return { walletObj: walletObj, entropy: decryptedEntrophy }
  }

  static async createAuthLookupKey (email, password) {
    let self = this

    // lowercase email so the lookupKey is consistently generated to search in the database
    email = email.toLowerCase()
    // This iv is hardcoded because the auth lookup key should be deterministically
    // generated given the same email and password
    const ivHex = '0x4f7242b39969c3ac4c6712524d633ce9'
    const { keyHex } = await AuthHelpers.createKey(email + ':::' + password, ivHex)

    return keyHex
  }

  static getWalletObjFromLocalStorageIfExists () {
    let self = this
    let entropy = localStorageReference.getItem(audiusEntropyKey)

    if (entropy && entropy !== 'undefined') {
      let walletObj = AuthHelpers.generateWalletFromEntropy(entropy, PATH)
      return walletObj
    } else return false
  }

  static setEntropyInLocalStorage (entropy) {
    localStorageReference.setItem(audiusEntropyKey, entropy)
  }
}

module.exports = WalletManager
