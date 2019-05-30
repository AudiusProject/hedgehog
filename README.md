<br />
<br />

<p align="center">
  <img src="https://user-images.githubusercontent.com/2731362/58195666-5cba9a00-7c7d-11e9-8409-5aa34b780ea2.png" width="240" />
</p>

<br />
<br />

**Hedgehog** is alternative to Metamask that manages a user's private key and wallet on the browser. It exposes a simple API to allow you to create an authentication scheme to let users sign up and login to their wallet across multiple browsers and devices. [hedgehog.audius.co](https://hedgehog.audius.co).

With Hedgehog:

* 😍 Users can make accounts in your DApp with a username + password.
* 😱 Users don't have to worry about private keys, no mnemonics.
* 🔏 You can build systems that fund users' wallets, sign transactions, but never control those wallets directly.
* 🌇 You can focus on building your business logic, rather than managing wallets.

[![npm version](https://badge.fury.io/js/%40audius%2Fhedgehog.svg)](https://badge.fury.io/js/%40audius%2Fhedgehog) [![CircleCI](https://circleci.com/gh/AudiusProject/hedgehog.svg?style=svg&circle-token=dc1943e26d04e05beca719fb45baaab93fe04bce)](https://circleci.com/gh/AudiusProject/audius-hedgehog)

## Installation

```
npm i --save @audius/hedgehog
```

## Docs && Examples

Check out our full technical [docs](http://audiusproject.github.io/hedgehog-docs) and [api how-to](http://audiusproject.github.io/hedgehog-docs#how-to).

For a quick browser-side demo, [look no further](https://codesandbox.io/embed/pp9zzv2n00). For a full end-to-end auth demonstration, see our [demo repo](https://github.com/AudiusProject/audius-hedgehog-demo).

## Why Use This?

### Not All Transactions Are Created Equal
Currently available wallets treat every transaction as if it were moving around your life’s savings. Hedgehog was built for use-cases involving low-to-no financial value.

**NOTE**: The primary improvement to end-user experience is by hiding wallet complexity and not forcing users to constantly confirm transactions - The opposite of what you’d want when moving significant money around.

### Is Hedgehog Right for your DApp?
Hedgehog isn’t right for every DApp. Massive improvements in user experience are only possible through tradeoffs. As a general rule Hedgehog should not be used for apps involving significant sums of money. As a bridge, one could start users on Hedgehog and suggest migrating to a more secure wallet if their stored value increases beyond a certain threshold; the Hedgehog paradigm is interoperable with existing web3 providers too.

*[Good use cases]*

* **Signing data**: If you’re building decentralized applications that rely on user signed data (eg. via EIP-712-esque signing schemes), Hedgehog could help simplify the experience if the stakes are low enough.
* **Gaming DApp**: Nothing ruins fun as much as signing transactions. If you’re building a gaming DApp that doesn’t use significant financial assets, improving UX is key.
* **Decentralized Music Player**: If you’re building consumer-facing DApps, Hedgehog will dramatically improve user experience and significantly increase your potential userbase. 

*[Bad use cases]*

If your DApp involves moving around significant sums of money, then the tradeoff in security is most likely not worth it. Hedgehog’s primary improvement to end-user experience is by hiding the wallet and not forcing users to confirm transactions - The opposite of what you’d want when moving money around. We absolutely don’t recommend using Hedgehog in situations like these:

* **Banking DApp**
* **Decentralized Lending**
* **Prediction Markets**


## A Closer Look 

Hedgehog is a package that lives in your front end application to create and manage a user's entropy (from which a private key is derived). Hedgehog relies on a username and password to create auth artifacts, so it's able to simulate a familiar authentication system that allows users to sign up or login from multiple browsers or devices and retrieve their entropy. Those artifacts, through hedgehog, are persisted to a backend of your choosing.

**NOTE**: A private key is only computed and available client side and is never transmitted or stored anywhere besides the user's browser.

```javascript
// Provide getFn, setAuthFn, setUserFn as requests to your database/backend service (more details in docs).
const hedgehog = new Hedgehog(getFn, setAuthFn, setUserFn)
let wallet
if (hedgehog.isLoggedIn()) {
  wallet = hedgehog.getWallet()
} else {
  wallet = await hedgehog.login('username', 'password')
  // or
  wallet = await hedgehog.signUp('username', 'password')
}

```

After creating or retrieving a user's wallet, you can either **fund their wallet directly** to pay transaction fees or **relay their transactions through a EIP-712 relayer**.

More details in the [docs](http://audiusproject.github.io/hedgehog-docs).
