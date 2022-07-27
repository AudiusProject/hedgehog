import type { CreateKey, LocalStorage } from "./types";
import { bufferFromHexString } from "./utils";
import { Authentication } from "./Authentication";

// primary account management key for HD wallet
// TODO - make these options that can be overridden
const PATH = "m/44'/60'/0'/0/0";
const hedgehogEntropyKey = "hedgehog-entropy-key";

// Contains functions to help create and maintain user accounts client side
// The reason many functions return both buffer and hex strings is because different
// packages expect different formats. So if a value is used in multiple formats, all
// the formats are returned by the generation function
export class WalletManager {
  static async createWalletObj(
    password: string,
    entropyOverride: string | null = null,
    localStorage: LocalStorage,
    createKey: CreateKey
  ) {
    let self = this;
    let entropy;

    if (!password) return new Error("Missing property: password");

    const { ivBuffer, ivHex } = Authentication.createIV();
    const { keyBuffer } = await createKey(password, ivHex);
    if (!entropyOverride) {
      entropy = Authentication.generateMnemonicAndEntropy()["entropy"];
    } else {
      entropy = entropyOverride;
    }
    let walletObj = await Authentication.generateWalletFromEntropy(
      entropy,
      PATH
    );
    const { cipherTextHex } = Authentication.encrypt(
      entropy,
      ivBuffer,
      keyBuffer
    );

    await self.setEntropyInLocalStorage(entropy, localStorage);
    return {
      ivHex: ivHex,
      cipherTextHex: cipherTextHex,
      walletObj: walletObj,
      entropy: entropy,
    };
  }

  static async decryptCipherTextAndRetrieveWallet(
    password: string,
    ivHex: string,
    cipherTextHex: string,
    createKey: CreateKey
  ) {
    const { keyBuffer } = await createKey(password, ivHex);
    const ivBuffer = bufferFromHexString(ivHex);
    const decryptedEntrophy = Authentication.decrypt(
      ivBuffer,
      keyBuffer,
      cipherTextHex
    );
    const walletObj = await Authentication.generateWalletFromEntropy(
      decryptedEntrophy,
      PATH
    );

    return { walletObj, entropy: decryptedEntrophy };
  }

  static async createAuthLookupKey(
    username: string,
    password: string,
    createKey: CreateKey
  ) {
    // lowercase username so the lookupKey is consistently generated to search in the database
    username = username.toLowerCase();
    // This iv is hardcoded because the auth lookup key should be deterministically
    // generated given the same username and password
    const ivHex = "0x4f7242b39969c3ac4c6712524d633ce9";
    const { keyHex } = await createKey(username + ":::" + password, ivHex);
    return keyHex;
  }

  static async getEntropyFromLocalStorage(localStorage: LocalStorage) {
    let entropy = await localStorage.getItem(hedgehogEntropyKey);

    // Sometimes the string 'undefined' was being written to localstorage
    // this is an explicit check for that
    if (entropy && entropy !== "undefined") {
      return entropy;
    } else return null;
  }

  static async getWalletObjFromLocalStorageIfExists(
    localStorage: LocalStorage
  ) {
    let entropy = await this.getEntropyFromLocalStorage(localStorage);
    if (entropy) {
      const walletObj = await Authentication.generateWalletFromEntropy(
        entropy,
        PATH
      );

      if (walletObj) return walletObj;
      else return null;
    } else return null;
  }

  static async setEntropyInLocalStorage(
    entropy: string,
    localStorage: LocalStorage
  ) {
    await localStorage.setItem(hedgehogEntropyKey, entropy);
  }

  static async deleteEntropyFromLocalStorage(localStorage: LocalStorage) {
    await localStorage.removeItem(hedgehogEntropyKey);
  }
}
