/**
 * file: contract-factory.ts
 * description: Wallet contract factory and version auto-detection for TON wallets
 * dependencies: client.ts, @ton/ton
 * created: 2026-03-31
 */

import { WalletContractV3R2, WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { getTonClient } from '../ton/client';

// --- Types ---

export type WalletVersion = 'v3R2' | 'v4R2' | 'v5R1';

export type WalletContract = WalletContractV3R2 | WalletContractV4 | WalletContractV5R1;

export interface DetectedWallet {
  version: WalletVersion;
  /** Address in raw format (0:...) */
  addressRaw: string;
  /** Address in user-friendly bounceable format (EQ...) */
  addressFriendly: string;
  balance: bigint;
  isDeployed: boolean;
}

const DEFAULT_VERSION: WalletVersion = 'v4R2';
const WORKCHAIN = 0;

// --- Factory ---

/**
 * Create a wallet contract instance for the given public key and version.
 */
export function createContract(publicKey: Buffer, version: WalletVersion): WalletContract {
  switch (version) {
    case 'v3R2':
      return WalletContractV3R2.create({ workchain: WORKCHAIN, publicKey });
    case 'v4R2':
      return WalletContractV4.create({ workchain: WORKCHAIN, publicKey });
    case 'v5R1':
      return WalletContractV5R1.create({ workchain: WORKCHAIN, publicKey });
  }
}

// --- Auto-detection ---

const ALL_VERSIONS: WalletVersion[] = ['v3R2', 'v4R2', 'v5R1'];

/**
 * Detect which wallet versions are deployed for the given public key.
 * Queries all three versions in parallel via TonClient.getContractState.
 * Returns a list of deployed wallets; if none are found, returns a single
 * default v4R2 entry with isDeployed=false.
 */
export async function detectVersions(publicKey: Buffer): Promise<DetectedWallet[]> {
  const client = getTonClient();

  const results = await Promise.all(
    ALL_VERSIONS.map(async (version): Promise<DetectedWallet | null> => {
      const contract = createContract(publicKey, version);
      const address = contract.address;

      try {
        const state = await client.getContractState(address);
        const isDeployed = state.state === 'active';
        return {
          version,
          addressRaw: address.toRawString(),
          addressFriendly: address.toString({ bounceable: true, testOnly: true }),
          balance: state.balance,
          isDeployed,
        };
      } catch {
        return null;
      }
    }),
  );

  const found = results.filter((r): r is DetectedWallet => r !== null && r.isDeployed);

  if (found.length > 0) {
    return found;
  }

  // No deployed wallets found — return default v4R2 placeholder
  const defaultContract = createContract(publicKey, DEFAULT_VERSION);
  const address = defaultContract.address;
  return [
    {
      version: DEFAULT_VERSION,
      addressRaw: address.toRawString(),
      addressFriendly: address.toString({ bounceable: true, testOnly: true }),
      balance: 0n,
      isDeployed: false,
    },
  ];
}

/**
 * Pick the best wallet from detected list.
 * Priority: first deployed wallet, or the single default entry.
 */
export function pickDefaultWallet(detected: DetectedWallet[]): DetectedWallet {
  return detected[0];
}
