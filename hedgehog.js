const WalletManager = require('./walletManager')

class Hedgehog {
  constructor (getFn, setFn) {
    this.getFn = getFn
    this.setFn = setFn
    this.wallet = null
  }

  async signUp (email, password) {
    let self = this
    const { ivHex, cipherTextHex, walletObj } = await WalletManager.createWalletObj(password)
    const lookupKey = await WalletManager.createAuthLookupKey(email, password)

    self.wallet = walletObj
    const walletAddress = walletObj.getAddressString()

    const data = {
      iv: ivHex,
      cipherText: cipherTextHex,
      lookupKey: lookupKey,
      email: email,
      ownerWallet: walletAddress
    }
    await self.setFn(data)
    return walletObj
  }

  async login (email, password) {
    let self = this
    let lookupKey = await WalletManager.createAuthLookupKey(email, password)
    let data = await self.getFn({ lookupKey: lookupKey, email: email })

    if (data && data.iv && data.cipherText) {
      const { walletObj } = await WalletManager.decryptCipherTextAndRetrieveWallet(password, data.iv, data.cipherText)

      self.wallet = walletObj
      return walletObj
    } else {
      throw new Error('No account record for user')
    }
  }
}

module.exports = Hedgehog