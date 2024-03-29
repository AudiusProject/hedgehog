/**
 * WARNING!
 * This file should NOT be modified unless you know what you're doing.
 * All public functions are exposed via hedgehog.js and walletManager.js
 */

import {
  entropyToMnemonic,
  generateMnemonic,
  mnemonicToEntropy,
  mnemonicToSeed,
} from "bip39";
import { hdkey } from "ethereumjs-wallet";
import randomBytes from "randombytes";
import Cipher from "browserify-cipher/browser";
import { Buffer as BufferSafe } from "safe-buffer";
import { bufferFromHexString } from "./utils";

const mode = "aes-256-cbc";
const encryptPrefixStr = "hedgehog-entropy:::";

export class Authentication {
  /**
   * Given an entropy string and a HD wallet path, return the wallet address
   * @param entropy Hex string generated by generateMnemonicAndEntropy()
   *                         Looks like `47b0e5e107cccc3297d88647c6e84a9f`
   * @param path Path for hierarchical deterministic wallet
   *                      Looks like `m/44'/60'/0'/0/0`
   * @returns ethereumjs-wallet wallet object
   */
  static async generateWalletFromEntropy(entropy: string, path: string) {
    const seed = await mnemonicToSeed(entropyToMnemonic(entropy));

    // generate HD wallet, not necessary for authentication
    const hdwallet = hdkey.fromMasterSeed(seed);

    // wallet is an ethereumjs-wallet object
    const wallet = hdwallet.derivePath(path).getWallet();

    return wallet;
  }

  /**
   * Creates a random mnemonic and creates an entropy string from the mnemonic
   * @returns `{mnemonic: '...mnemonic string...', entropy: '47b0e5e107cccc3297d88647c6e84a9f'}`
   */
  static generateMnemonicAndEntropy() {
    const mnemonic = generateMnemonic();

    // this is what we encrypt as private key
    const entropy = mnemonicToEntropy(mnemonic);

    return { mnemonic: mnemonic, entropy: entropy };
  }

  /**
   * Generate a 16 byte initialization vector and returns it as both a hex string and a buffer
   */
  static createIV() {
    const ivBuffer = randomBytes(16);
    const ivHex = ivBuffer.toString("hex");

    return { ivHex, ivBuffer };
  }

  /**
   * Given a iv buffer and key buffer, generate a ciphertext
   * @param entropy Hex string of entropy
   * @param ivBuffer Buffer version of iv
   * @param keyBuffer Buffer version of key
   */
  static encrypt(entropy: string, ivBuffer: Buffer, keyBuffer: Uint8Array) {
    let encryptFn = Cipher.createCipheriv(mode, keyBuffer, ivBuffer);
    const entropyBuffer = createEncryptBuffer(entropy);
    let cipherText = BufferSafe.concat([
      encryptFn.update(entropyBuffer),
      encryptFn.final(),
    ]);
    let cipherTextHex = cipherText.toString("hex");

    return { cipherText: cipherText, cipherTextHex: cipherTextHex };
  }

  /**
   * Given an iv buffer, key buffer and ciphertext, decrypt the plaintext value of the entropy
   * @param ivBuffer Buffer version of iv
   * @param keyBuffer Buffer version of key
   * @param cipherTextHex Hex string of the ciphertext
   * @returns Hex string of the entropy. If everything is correct, this should be the same
   *                   as the input entropy, allowing us to check that the generated wallet address
   *                   is the same as the current wallet address for the user
   */
  static decrypt(
    ivBuffer: Uint8Array,
    keyBuffer: Uint8Array,
    cipherTextHex: string
  ) {
    const decryptFn = Cipher.createDecipheriv(mode, keyBuffer, ivBuffer);
    const cipherText = BufferSafe.from(bufferFromHexString(cipherTextHex));
    const decryptedEntropyBuffer = BufferSafe.concat([
      decryptFn.update(cipherText),
      decryptFn.final(),
    ]);
    const decryptedEntropy = verifyDecryptString(decryptedEntropyBuffer);
    return decryptedEntropy;
  }
}

/**
 * This prepends the encryptPrefixStr to the entropy, converts it to a buffer and returns the buffer
 * @param entropy hex string of entropy
 * @returns buffer ready to encrypt via encryptFn
 */
function createEncryptBuffer(entropy: string) {
  let buff = BufferSafe.from(encryptPrefixStr + entropy, "utf8");
  return buff;
}

/**
 * This converts the buffer returned by the `decrypt` function to string, checks that the
 * integrity of the string to check if the encryptPrefixStr exists so we know that the same encrypted value has
 * been decrypted, parses the entropy and returns
 * @param decryptedEntropyBuffer value returned by decryptFn decryption
 * @returns entropy hex string
 */
function verifyDecryptString(decryptedEntropyBuffer: BufferSafe) {
  let decryptedEntrophy = decryptedEntropyBuffer.toString("utf8");

  if (decryptedEntrophy && decryptedEntrophy.indexOf(encryptPrefixStr) === 0) {
    return decryptedEntrophy.split(encryptPrefixStr)[1] as string;
  } else throw new Error("Could not verify integrity of decrypted string");
}
