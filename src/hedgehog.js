const Utils = require('./utils')
const WalletManager = require('./walletManager')

class Hedgehog {
  constructor (getFn, setAuthFn, setUserFn, useLocalStorage = true, localStorage = Utils.getPlatformLocalStorage()) {
    if (getFn && setAuthFn && setUserFn) {
      this.getFn = getFn
      this.setAuthFn = setAuthFn
      this.setUserFn = setUserFn
      this.wallet = null
      this.localStorage = localStorage
      this.ready = false

      // If there's entropy in localStorage, recover that and create a wallet object and put it
      // on the wallet property in the class

      if (useLocalStorage) {
        this.restoreLocalWallet().then(() => {
          this.ready = true
        })
      } else {
        this.ready = true
      }
    } else {
      throw new Error('Please pass in valid getFn, setAuthFn and setUserFn parameters into the Hedgehog constructor')
    }
  }

  /**
   * Helper function to check if Hedgehog instance is ready.
   * Only needed if `useLocalStorage = true`
   * Otherwise, Hedgehog will be ready as soon as it is constructed.
   */
  isReady () {
    return this.ready
  }

  /**
   * Helper function to wait until Hedgehog instance is ready.
   * Only needed if `useLocalStorage = true`
   * Otherwise, Hedgehog will be ready as soon as it is constructed.
   */
  async waitUntilReady () {
    await Utils.waitUntil(() => this.isReady())
  }

  /**
   * Given user credentials, create a client side wallet and all other authentication artifacts,
   * call setFn to persist the artifacts to a server and return the wallet object
   * @param {String} username username
   * @param {String} password user password
   * @returns {Object} ethereumjs-wallet wallet object
   */
  async signUp (username, password) {
    let self = this

    const createWalletPromise = WalletManager.createWalletObj(password, null, this.localStorage)
    const lookupKeyPromise = WalletManager.createAuthLookupKey(username, password)

    try {
      let result = await Promise.all([createWalletPromise, lookupKeyPromise])

      const { ivHex, cipherTextHex, walletObj } = result[0]
      const lookupKey = result[1]

      const walletAddress = walletObj.getAddressString()

      const authData = {
        iv: ivHex,
        cipherText: cipherTextHex,
        lookupKey: lookupKey
      }

      const userData = {
        username: username,
        walletAddress: walletAddress
      }
      await self.setUserFn(userData)
      await self.setAuthFn(authData)

      // set the wallet at the very end to make sure the isLoggedIn() function doesn't return true
      self.wallet = walletObj

      return walletObj
    } catch (e) {
      await self.logout()
      throw e
    }
  }

  /**
   * Generate new set of auth credentials to allow login
   * If the old password is included, the setAuthFn will include the old lookup key for deletion
   * @param {String} username - username
   * @param {String} password - new password
   */
  async resetPassword (username, password) {
    let self = this
    let entropy = await WalletManager.getEntropyFromLocalStorage(this.localStorage)
    if (entropy === null) {
      throw new Error('resetPassword - missing entropy')
    }

    const createWalletPromise = WalletManager.createWalletObj(password, entropy, this.localStorage)
    const lookupKeyPromise = WalletManager.createAuthLookupKey(username, password)

    try {
      let result = await Promise.all([createWalletPromise, lookupKeyPromise])

      const { ivHex, cipherTextHex, walletObj } = result[0]
      const lookupKey = result[1]

      const authData = {
        iv: ivHex,
        cipherText: cipherTextHex,
        lookupKey: lookupKey
      }

      await self.setAuthFn(authData)
      self.wallet = walletObj
    } catch (e) {
      await self.logout()
      throw e
    }
  }

  /**
   * Generate new set of auth credentials to allow login and remove the old password
   * Note: Doesn't log out on error
   * @param {String} username - username
   * @param {String} password - new password
   * @param {String} oldPassword - old password
   */
  async changePassword (username, password, oldPassword) {
    let self = this
    let entropy = await WalletManager.getEntropyFromLocalStorage(this.localStorage)
    if (entropy === null) {
      throw new Error('changePassword - missing entropy')
    }

    const createWalletPromise = WalletManager.createWalletObj(password, entropy, this.localStorage)
    const lookupKeyPromise = WalletManager.createAuthLookupKey(username, password)
    const oldLookupKeyPromise = WalletManager.createAuthLookupKey(username, oldPassword)
    try {
      let result = await Promise.all([createWalletPromise, lookupKeyPromise, oldLookupKeyPromise])

      const { ivHex, cipherTextHex, walletObj } = result[0]
      const lookupKey = result[1]
      const oldLookupKey = result[2]

      const authData = {
        iv: ivHex,
        cipherText: cipherTextHex,
        lookupKey: lookupKey,
        oldLookupKey: oldLookupKey
      }

      await self.setAuthFn(authData)
      self.wallet = walletObj
    } catch (e) {
      throw e
    }
  }

  /**
   * Given user credentials, attempt to get authentication artifacts from server using
   * getFn, create the private key using the artifacts and the user password
   * @param {String} username username
   * @param {String} password user password
   * @returns {Object} ethereumjs-wallet wallet object
   */
  async login (username, password) {
    let self = this
    let lookupKey = await WalletManager.createAuthLookupKey(username, password)
    let data = await self.getFn({ lookupKey: lookupKey })

    if (data && data.iv && data.cipherText) {
      const { walletObj, entropy } = await WalletManager.decryptCipherTextAndRetrieveWallet(
        password,
        data.iv,
        data.cipherText
      )

      // set wallet property on the class
      self.wallet = walletObj

      // set entropy in localStorage
      await WalletManager.setEntropyInLocalStorage(entropy, this.localStorage)
      return walletObj
    } else {
      throw new Error('No account record for user')
    }
  }

  /**
   * Confirms the user credentials given generate the same entropy after using artifacts from the server
   * @param {String} username username
   * @param {String} password user password
   * @returns {boolean} whether or not the credentials are valid for the current user
   */
  async confirmCredentials (username, password) {
    const self = this

    const existingEntropy = await WalletManager.getEntropyFromLocalStorage(this.localStorage)
    if (!existingEntropy) return false // not logged in yet

    const lookupKey = await WalletManager.createAuthLookupKey(username, password)
    const data = await self.getFn({ lookupKey })

    if (data && data.iv && data.cipherText) {
      const { walletObj, entropy } = await WalletManager.decryptCipherTextAndRetrieveWallet(
        password,
        data.iv,
        data.cipherText
      )

      // test against current entropy in localStorage and current wallet
      return entropy === existingEntropy &&
          self.wallet !== null &&
          self.wallet.getAddressString() === walletObj.getAddressString()
    }
    return false
  }

  /**
   * Deletes the local client side wallet including entropy and all associated
   * authentication artifacts
   */
  async logout () {
    delete this.wallet
    await WalletManager.deleteEntropyFromLocalStorage(this.localStorage)
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

  /**
   * If a user refreshes or navigates away from the page and comes back later, this attempts
   * to restore the client side wallet from localStorage, if it exists
   * @returns {Object/null} If the user has a wallet client side, the wallet object is returned,
   *                        otherwise null is returned
   */
  async restoreLocalWallet () {
    const walletObj = await WalletManager.getWalletObjFromLocalStorageIfExists(this.localStorage)
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
      const { walletObj, entropy } = await WalletManager.createWalletObj(password, null, this.localStorage)
      this.wallet = walletObj
      await WalletManager.setEntropyInLocalStorage(entropy, this.localStorage)
      return walletObj
    } else {
      throw new Error('Please pass in a valid password')
    }
  }
}

module.exports = Hedgehog
