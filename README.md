# Hedgehog
A drop-in alternative for Metamask that allows you to to manage a user's private key and wallet on the browser as well as a way to securely encrypt and persist, decrypt and retrieve the auth artifacts necessary to derive the private key. These auth artifacts can be stored in any database and server of your choice. Hedgehog exposes an API for a very familiar authentication scheme with sign up and login functions while also abstracting away all the logic necessary interact with these auth artifacts. It also performs all encryption and decryption necessary to create and manage user private keys along the way.

For more in depth explanations and examples, please read the [Technical Overview](#technical-overview) and [Usage](#usage) sections.

Table of contents
=================

<!--ts-->
   * [Installation](#installation)
   * [Technical Overview](#technical-overview)
     * [Wallet creation](#wallet-creation)
     * [Wallet management](#wallet-management)
     * [Code Organization](#code-organization)
     * [Security Considerations](#security-considerations)
   * [Usage](#usage)
   * [API](#api)
<!--te-->


## Installation
Hedgehog is available as an [npm package](). 

`npm install --save @audius/hedgehog`

## Technical Overview

Hedgehog generates a set of artifacts similar to a MyEtherWallet keystore file. Those artifacts can then be persisted to a database of your choice and can be retrieved with a hash computed with email address, password and an initialization vector. The private key is only computed and available client side and is never transmitted or stored anywhere besides the user's browser.

#### Wallet creation

Wallets are created by first generating a wallet seed and entropy as per the [BIP-39 spec](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki). The entropy can them be used to derive a hierarchical deterministic wallet given a path, as stated in the [BIP-32 spec](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki). This entropy is stored in the browser's localStorage to allow users access across multiple sessions without any server side backing. If a user was previously logged in and returns to your app, this entropy can be read from localStorage, and a wallet can be generated and stored in the `wallet` property on the Hedgehog class. The wallet is an object returned by the `ethereumjs-wallet` npm package.

In addition to the entropy, Hedgehog generates an initialization vector(`iv`), `lookupKey` and `ciphertext`. These three values can be securely stored in a database and retrieved from a server to authenticate a user. The `iv` is a random hex string generated for each user to secure authentication. The `lookupKey` is the email and password combined with a pre-defined, constant, initialization vector(not the same `iv` that's stored in the database). This `lookupKey` acts as the primary key in the database to retrieve the `ciphertext` and `iv` values. The `ciphertext` is generated using an aes-256-cbc cipher with the `iv` and a key derived from a combination of the user's password and the iv using scrypt and stores the entropy. 

Since entropy is stored in the `ciphertext`, it can be derived from there if we know the `iv` and key(scrypt of user's password and `iv`). After the entropy is decrypted, it's stored in the browser on a local `ethereumjs-wallet` object as well as in localStorage. The encryption and decryption process happens exclusively on the client side with the user's password or entropy never leaving the browser without first being encrypted.

For API of functions to access and modify wallet state, please see the [API](#api) section

#### Code Organization

The Hedgehog package has been organized into several files with varying degrees of control.

* <b>index.js</b> - default exports for the npm module, exports each of the src/ modules below
* <b>src/hedgehog.js</b> -  main constructor with primary consumable public facing API and high level functions
* <b>src/walletManager.js</b> - wallet management logic including localStorage, and end to end authentication functionality
* <b>src/authentication.js</b> - low level authentication functions (eg create iv, encrypt hash etc)

#### Security Considerations

All third party javascript should be audited for localStorage access. One possible attack vector is a script that loops through all localStorage keys and sends them to a third party server from where those keys could be used to sign transactions on behalf of malicious actors. To mitigate this, all third party javascript should be audited and stored locally to serve, instead of being loaded dynamically through scripts.

Email should be stored separately from auth artifacts in different tables. The table containing the authentication values should be independent with no relation to the table storing email addresses

## Usage

The code below shows a simple wrapper to integrate Hedgehog into your own application. For a fully working end-to-end example, please see the Codepen demo [here](http://www.google.com)
```js
/**
 * hedgehogWrapper.js
 * 
 * Something similar to this file would reside in your codebase.
 * This initializes the hedgehog module and exports it for the rest of your project to consume
 */

// Hedgehog is the package export that should be used by most users
// WalletManager and Authentication imports are possible but not recommended
// and should only be used by advanced users
const { Hedgehog, /*WalletManager, Authentication */ } = require('@audius/hedgehog')
const axios = require('axios')

// This is a helper function that makes XHR requests to a server of your choice
// and parses the response status code
const makeRequestToService = async (axiosRequestObj) => {
  axiosRequestObj.baseURL = 'http://hedgehog.base-url.com'

  try {
    const resp = await axios(axiosRequestObj)
    if (resp.status === 200) {
      return resp.data
    } else {
      throw new Error(`Server returned error: ${resp.status.toString()} ${resp.data['error']}`)
    }
  } catch (e) {
    console.error(e)
    throw new Error(`Server returned error: ${e.response.status.toString()} ${e.response.data['error']}`)
  }
}

// The Hedgehog constructor takes in two functions, a `setFn` and a `getFn`. 
// Each one of these will be called in the appropriate places to write to
// or read from a data store
const setFn = async (obj) => {
  await makeRequestToService({
    url: '/authentication/sign_up',
    method: 'post',
    data: obj
  })
}
const getFn = async (obj) => {
  return makeRequestToService({
    url: '/authentication/login',
    method: 'get',
    params: obj
  })
}

const hedgehog = new Hedgehog(getFn, setFn)

module.exports = hedgehog

```

```js
/**
 * This is how you use the hedgehog module to do authentication
 * and wallet management in your codebase.
 * 
 * The import is from the hedgehogWrapper.js code snippet above
 */

const hedgehog = require('./hedgehogWrapper')

// wallet management and creation/login flow
let walletObj = null

try {
  if (hedgehog.isLoggedIn()) {
    walletObj = hedgehog.getWallet()
  }
  else {
    // Ask for email/password input for login or signup

    walletObj = await hedgehog.login('email@domain.com', 'password')
    // or
    walletObj = await hedgehog.signUp('email@domain.com', 'password')
  }
}
catch(e) {
  throw e
}
```

## API

The functions exposed via hedgehog are:

  ```js
  /**
   * Given user credentials, create a client side wallet and all other authentication artifacts,
   * call setFn to persist the artifacts to a server and return the wallet object
   * @param {String} email user email address
   * @param {String} password user password
   * @returns {Object} ethereumjs-wallet wallet object
   */
async signUp (email, password)

/**
   * Given user credentials, attempt to get authentication artifacts from server using
   * getFn, create the private key using the artifacts and the user password
   * @param {String} email user email address
   * @param {String} password user password
   * @returns {Object} ethereumjs-wallet wallet object
   */
async login (email, password)

/**
   * Deletes the local client side wallet including entropy and all associated
   * authentication artifacts
   */
logout ()

/**
   * Returns is the user has a client side wallet. If they do, calls can be made against
   * that wallet, if they don't the user has to login or signup
   * @returns {Boolean} true if the user has a client side wallet, false otherwise
   */
isLoggedIn ()

/**
   * Returns the current user wallet
   * @returns {Object} ethereumjs-wallet wallet object if a wallet exists, otherwise null
   */
getWallet ()

/**
   * If a user refreshes or navigates away from the page and comes back later, this attempts
   * to restore the client side wallet from localStorage, if it exists
   * @returns {Object/null} If the user has a wallet client side, the wallet object is returned,
   *                        otherwise null is returned
   */
restoreLocalWallet ()

/**
   * Create a new client side wallet object without going through the signup flow. This is useful
   * if you need a temporary, read-only wallet that is ephemeral and does not need to be persisted
   * @param {String} password user password
   * @returns {Object} ethereumjs-wallet wallet object
   */
async createWalletObj (password)
```
