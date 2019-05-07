const WalletManager = require('./walletManager')

class Hedgehog {
  constructor (getFn, setFn) {
    if (getFn && setFn) {
      this.getFn = getFn
      this.setFn = setFn
      this.wallet = null
    } else {
      throw new Error('Please pass in valid getFn and setFn parameters into the Hedgehog constructor')
    }
  }

  /**
   * Given user credentials, create a client side wallet and all other authentication artifacts,
   * call setFn to persist the artifacts to a server and return the wallet object
   * @param {String} email user email address
   * @param {String} password user password
   * @returns {Object} ethereumjs-wallet wallet object
   */
  async signUp (email, password) {
    // TODO (DM) - check that wallet doesn't already exist
    let self = this

    const createWalletPromise = WalletManager.createWalletObj(password)
    const lookupKeyPromise = WalletManager.createAuthLookupKey(email, password)

    try {
      let result = await Promise.all([createWalletPromise, lookupKeyPromise])

      const { ivHex, cipherTextHex, walletObj } = result[0]
      const lookupKey = result[1]

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
    } catch (e) {
      throw e
    }
  }

  /**
   * Given user credentials, attempt to get authentication artifacts from server using
   * getFn, create the private key using the artifacts and the user password
   * @param {String} email user email address
   * @param {String} password user password
   * @returns {Object} ethereumjs-wallet wallet object
   */
  async login (email, password) {
    let self = this
    let lookupKey = await WalletManager.createAuthLookupKey(email, password)
    let data = await self.getFn({ lookupKey: lookupKey, email: email })

    if (data && data.iv && data.cipherText) {
      const { walletObj, entropy } = await WalletManager.decryptCipherTextAndRetrieveWallet(
        password,
        data.iv,
        data.cipherText
      )

      // set wallet property on the class
      self.wallet = walletObj

      // set entropy in localStorage
      WalletManager.setEntropyInLocalStorage(entropy)
      return walletObj
    } else {
      throw new Error('No account record for user')
    }
  }

  /**
   * Deletes the local client side wallet including entropy and all associated
   * authentication artifacts
   */
  logout () {
    delete this.wallet
    WalletManager.deleteEntropyFromLocalStorage()
  }

  /**
   * Returns is the user has a client side wallet. If they do, calls can be made against
   * that wallet, if they don't the user has to login or signup
   * @returns {Boolean} true if the user has a client side wallet, false otherwise
   */
  isLoggedIn () {
    return !!this.wallet
  }

  /**
   * Returns the current user wallet
   * @returns {Object} ethereumjs-wallet wallet object if a wallet exists, otherwise null
   */
  getWallet () {
    return this.wallet
  }

  walletExistsLocally () {
    let entropy = WalletManager.getEntropyFromLocalStorage()
    if (entropy) return true
    else return false
  }

  /**
   * If a user refreshes or navigates away from the page and comes back later, this attempts
   * to restore the client side wallet from localStorage, if it exists
   * @returns {Object/null} If the user has a wallet client side, the wallet object is returned,
   *                        otherwise null is returned
   */
  restoreLocalSession () {
    const walletObj = WalletManager.getWalletObjFromLocalStorageIfExists()
    if (walletObj) {
      this.wallet = walletObj
      return walletObj
    } else return null
  }

  /**
   * Create a new client side wallet object without going through the signup flow. This is useful
   * if you need a temporary, read-only wallet that is ephemeral and does not need to be persisted
   * @param {String} password user password
   * @returns {Object} ethereumjs-wallet wallet object
   */
  async createWalletObj (password) {
    if (password) {
      const { walletObj, entropy } = await WalletManager.createWalletObj(password)
      this.wallet = walletObj
      WalletManager.setEntropyInLocalStorage(entropy)
      return walletObj
    } else {
      throw new Error('Please pass in a valid password')
    }
  }
}

module.exports = Hedgehog
