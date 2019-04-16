# Hedgehog

A drop-in replacement for Metamask to manage private keys and credentials client side

## Installation

## Usage

### Code organization
index.js - default exports
hedgehog.js - primary API meant for consumption
walletManager.js - wallet mangement including localstorage, and end to end authentication
authentication.js - low level authentication functions to perform individual tasks(eg create iv, encrypt hash etc)