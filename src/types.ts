export type LocalStorage = {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};

export type CreateKey = (
  encryptStr: string,
  ivHex: string
) => Promise<PrivateKey>;

export type PrivateKey = { keyHex: string; keyBuffer: Uint8Array };

export type GetFn = (params: {
  lookupKey: string;
  [key: string]: unknown;
}) =>
  | Promise<{ iv: string; cipherText: string }>
  | { iv: string; cipherText: string };

export type SetAuthFn = (params: {
  iv: string;
  cipherText: string;
  lookupKey: string;
  oldLookupKey?: string;
  [key: string]: unknown;
}) => any | Promise<any>;

export type SetUserFn = (params: {
  walletAddress: string;
  username: string;
  [key: string]: unknown;
}) => any | Promise<any>;
