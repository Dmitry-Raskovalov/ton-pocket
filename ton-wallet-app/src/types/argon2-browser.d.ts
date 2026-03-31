declare module 'argon2-browser' {
  interface Argon2HashOptions {
    pass: string;
    salt: Uint8Array | string;
    time?: number;
    mem?: number;
    parallelism?: number;
    hashLen?: number;
    distPath?: string;
  }

  interface Argon2HashResult {
    hash: Uint8Array;
    hashHex: string;
    encoded: string;
  }

  interface Argon2VerifyOptions {
    encoded: string;
    pass: string;
  }

  export function hash(options: Argon2HashOptions): Promise<Argon2HashResult>;
  export function verify(options: Argon2VerifyOptions): Promise<boolean>;
}
