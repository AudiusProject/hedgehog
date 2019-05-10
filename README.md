# Hedgehog
A drop-in alternative for Metamask to manage a user's private key and wallet locally on the browser. This module is intended as a full service tool with minimal setup and configuration. 

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

In addition to the entropy itself, Hedgehog generates auth artifacts that contain the entropy encrypted in a ciphertext along with the user's password. These auth artifacts can be securely stored in an encrypted database. The entropy can be re-generated with the users email and password, which are taken as inputs on the client side and never sent from the browser. Using the ciphertext and the user's password, the entropy can be derived and used client side.

For API of functions to access and modify wallet state, please see the [API](#api) section

#### Code Organization

The Hedgehog package has been organized into several files with varying degrees of control.

* <b>index.js</b> - default exports for the npm module, exports each of the src/ modules below
* <b>src/hedgehog.js</b> -  main constructor with primary consumable public facing API and high level functions
* <b>src/walletManager.js</b> - wallet management logic including localstorage, and end to end authentication functionality
* <b>src/authentication.js</b> - low level authentication functions (eg create iv, encrypt hash etc)

#### Security Considerations

All third party javascript should be audited for localStorage access. If a library accesses localStorage and extracts all keys, it could present a possible data breach

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
 * and wallet management in your codebase
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
