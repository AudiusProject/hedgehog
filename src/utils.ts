import crypto from "crypto";
import type { PrivateKey } from "./types";

// https://stackoverflow.com/questions/38987784/how-to-convert-a-hexadecimal-string-to-uint8array-and-back-in-javascript
export function bufferFromHexString(hexString: string) {
  const byteArray = hexString
    .match(/.{1,2}/g)
    ?.map((byte) => parseInt(byte, 16));
  return new Uint8Array(byteArray as number[]);
}

export function WebWorker(worker: Worker) {
  if (typeof window !== "undefined" && window.Worker) {
    const code = worker.toString();
    const blob = new Blob(["(" + code + ")()"]);
    return new window.Worker(URL.createObjectURL(blob));
  } else throw new Error("Cannot call web worker on the server");
}

/**
 * Fallback for localStorage that works in node and the browser
 */
export function getPlatformLocalStorage() {
  if (isNodeEnv()) {
    const LocalStorage = require("node-localstorage").LocalStorage;
    return new LocalStorage("./local-storage");
  }
  if (isWebEnv()) {
    return window.localStorage;
  }
  throw new Error(
    "Please pass in valid localStorage object into the Hedgehog constructor"
  );
}

function isReactNativeEnv() {
  return (
    typeof navigator !== "undefined" && navigator.product === "ReactNative"
  );
}

function isWebEnv() {
  return (
    typeof window !== "undefined" &&
    window &&
    window.Worker &&
    !isReactNativeEnv()
  );
}

function isNodeEnv() {
  return typeof window === "undefined" || window === null;
}

export function getPlatformCreateKey() {
  /**
   * Given a user encryptStr and initialization vector, generate a private key
   * @param encryptStr String to encrypt (can be user password or some kind of lookup key)
   * @param ivHex hex string iv value
   */
  const createKey = async (encryptStr: string, ivHex: string) => {
    if (isWebEnv()) {
      return new Promise<PrivateKey>((resolve) => {
        const worker = WebWorker(require("./authWorker.js").toString());
        worker.postMessage(JSON.stringify({ encryptStr, ivHex }));

        worker.onmessage = (event) => {
          resolve(event.data);
        };
      });
    }

    if (isNodeEnv()) {
      return new Promise<PrivateKey>((resolve, reject) => {
        const N = 32768;
        const r = 8;
        const p = 1;
        const dkLen = 32;
        const encryptStrBuffer = Buffer.from(encryptStr);
        const ivBuffer = Buffer.from(ivHex);
        // https://github.com/nodejs/node/issues/21524#issuecomment-400012811
        const maxmem = 128 * p * r + 128 * (2 + N) * r;

        crypto.scrypt(
          encryptStrBuffer,
          ivBuffer,
          dkLen,
          { N, r, p, maxmem },
          (err, derivedKey) => {
            if (err) {
              reject(err);
            } else {
              const keyHex = derivedKey.toString("hex");

              // This is the private key
              const keyBuffer = bufferFromHexString(keyHex);
              resolve({ keyHex, keyBuffer });
            }
          }
        );
      });
    }

    throw new Error(
      "Please pass in valid createKey function into the Hedgehog constructor"
    );
  };

  return createKey;
}

export function waitUntil(condition: () => boolean) {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (!condition()) {
        return;
      }

      clearInterval(interval);
      resolve();
    }, 100);
  });
}
