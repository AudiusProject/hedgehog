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
}) =>
  | Promise<{ iv: string; cipherText: string }>
  | { iv: string; cipherText: string };

export type SetAuthFn = (params: {
  iv: string;
  cipherText: string;
  lookupKey: string;
}) => any | Promise<any>;

export type SetUserFn = (params: {
  walletAddress: string;
  username: string;
}) => any | Promise<any>;
