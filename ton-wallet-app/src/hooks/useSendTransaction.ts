/**
 * file: hooks/useSendTransaction.ts
 * description: Encapsulates async send-transaction logic, decoupling it from SendScreen UI
 * dependencies: vault, session, transfer, balance, address-book, wallet-store, ui-store
 * created: 2026-04-21
 */

import { useState } from 'react';
import { Address } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { loadVault, decrypt } from '@/crypto/vault';
import { getSessionPassword } from '@/crypto/session';
import { sendTransfer, ESTIMATED_FEE } from '@/services/ton/transfer';
import { getBalance } from '@/services/ton/balance';
import { createContract } from '@/services/wallet/contract-factory';
import { addressBook } from '@/services/address-book/address-book';
import { useWalletStore } from '@/store/wallet-store';
import { useUIStore } from '@/store/ui-store';
import type { TransferResult } from '@/services/ton/transfer';
import type { WalletVersion } from '@/services/wallet/contract-factory';

export type ResultState = 'pending' | 'success' | 'error' | 'timeout';

export interface UseSendTransactionResult {
  isSending: boolean;
  resultState: ResultState;
  transferResult: TransferResult | null;
  /** Returns true if decryption succeeded and send was initiated; false if decryption failed. */
  sendTransaction: (params: SendParams) => Promise<boolean>;
  resetResult: () => void;
}

interface SendParams {
  recipient: string;
  amount: bigint;
  comment?: string;
}

export function useSendTransaction(): UseSendTransactionResult {
  const [isSending, setIsSending] = useState(false);
  const [resultState, setResultState] = useState<ResultState>('pending');
  const [transferResult, setTransferResult] = useState<TransferResult | null>(null);

  const rawAddress = useWalletStore((s) => s.address);
  const version = useWalletStore((s) => s.version);
  const publicKeyHex = useWalletStore((s) => s.publicKey);
  const updateBalance = useWalletStore((s) => s.updateBalance);
  const addToast = useUIStore((s) => s.addToast);

  const sendTransaction = async ({ recipient, amount, comment }: SendParams): Promise<boolean> => {
    const sessionPassword = getSessionPassword();
    if (!rawAddress || !publicKeyHex || !version || !sessionPassword) return false;

    setIsSending(true);
    try {
      const vault = loadVault();
      if (!vault) {
        addToast({ type: 'error', message: 'Wallet vault not found', duration: 4000 });
        return false;
      }

      let words: string[];
      try {
        const mnemonicJson = await decrypt(vault, sessionPassword);
        const parsed: unknown = JSON.parse(mnemonicJson);
        if (!Array.isArray(parsed) || !parsed.every((w) => typeof w === 'string')) {
          throw new Error('Invalid mnemonic data in vault');
        }
        words = parsed;
      } catch (err) {
        addToast({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to decrypt wallet',
          duration: 4000,
        });
        return false;
      }

      const keyPair = await mnemonicToPrivateKey(words);
      const contract = createContract(keyPair.publicKey, version as WalletVersion);
      const secretKey = Buffer.from(keyPair.secretKey);

      const result = await sendTransfer({
        recipient,
        amount,
        comment: comment || undefined,
        contract,
        secretKey,
      });

      setTransferResult(result);
      setResultState(result.status === 'confirmed' ? 'success' : result.status);

      if (result.status === 'confirmed') {
        try {
          const recipientRaw = Address.parse(recipient).toRawString();
          addressBook.addOrUpdateEntry({
            address: recipientRaw,
            displayAddress: recipient,
            source: 'sent',
          });
        } catch {
          // address book update is best-effort
        }

        try {
          const newBalance = await getBalance(rawAddress);
          updateBalance(newBalance);
        } catch {
          // best-effort
        }

        addToast({ type: 'success', message: 'Transaction sent successfully!', duration: 5000 });
      }
      return true;
    } catch (err) {
      setResultState('error');
      setTransferResult({
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error',
      });
      return true;
    } finally {
      setIsSending(false);
    }
  };

  const resetResult = () => {
    setResultState('pending');
    setTransferResult(null);
  };

  return { isSending, resultState, transferResult, sendTransaction, resetResult };
}

export { ESTIMATED_FEE };
