# Hedgehog - TODO
A drop-in replacement for Metamask to manage private keys and credentials on a user's browser. This module is intended as a full service, drop in tool with minimal setup and configuration. 

Hedgehog generates a set of artifacts similar to a MyEtherWallet keystore file and is secured with a password. Those artifacts can then be stored in the database of your choice and can be retrieved with a given hash comprised of the email address, password and an initialization vector. The private key is only computed and available client side and is never transmitted or stored anywhere besides the user's browser.


## Installation
Hedgehog is available as an [npm package](). 

`npm install @audius/hedgehog`

## Usage
After installing the npm package as a dependency, initialize the module like such.

```js
const { Hedgehog, WalletManager, Authentication } = require('@audius/hedgehog')
const axios = require('axios')

// This is a helper function that makes XHR requests to a server of your choice
// and parses the response status code
const requestToAudiusService = async (axiosRequestObj) => {
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
  await requestToAudiusService({
    url: '/authentication/sign_up',
    method: 'post',
    data: obj
  })
}
const getFn = async (obj) => {
  return requestToAudiusService({
    url: '/authentication/login',
    method: 'get',
    params: obj
  })
}

const hedgehog = new Hedgehog(getFn, setFn)

module.exports.WalletManager = WalletManager
module.exports.hedgehog = hedgehog

```

### Code organization
* index.js - default exports for the npm module
* hedgehog.js -  onstructor with primary consumable public facing API
* walletManager.js - wallet mangement logic including localstorage, and end to end authentication functionality
* authentication.js - low level authentication functions to perform individual tasks(eg create iv, encrypt hash etc)