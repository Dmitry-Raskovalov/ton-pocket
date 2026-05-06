/**
 * file: validate-send.ts
 * description: Validation orchestrator — single entry point for pre-send checks
 * dependencies: address-format.ts, self-send.ts, account-state.ts, balance-check.ts,
 *               address-similarity.ts, types.ts
 * created: 2026-04-01
 */

import { isValidAddress, normalizeAddress } from './address-format';
import { checkSelfSend } from './self-send';
import { checkAccountState } from './account-state';
import { checkBalance } from './balance-check';
import { checkAddressSimilarity } from './address-similarity';
import { checkNewRecipient } from './check-new-recipient';
import type { Warning } from './types';

/** Parameters for send validation */
export interface ValidateSendParams {
  /** Recipient address in any format (friendly or raw) */
  recipientAddress: string;
  /** Transfer amount in nanotons */
  amount: bigint;
  /** Current sender balance in nanotons */
  senderBalance: bigint;
  /** Sender public key (Buffer or hex string) */
  senderPublicKey: Buffer;
}

/** Send validation result */
export interface SendValidationResult {
  /** true — no error-level warnings (can continue) */
  isValid: boolean;
  /** All warnings from all checks */
  warnings: Warning[];
}

/**
 * Validation orchestrator before transaction send.
 *
 * Step 1 — address format validation (early return if invalid).
 * Step 2 — parallel check execution: self-send, similarity, account state, balance.
 * Collects all warnings into single array.
 *
 * @param params - send parameters
 */
export async function validateSend(params: ValidateSendParams): Promise<SendValidationResult> {
  const { recipientAddress, amount, senderBalance, senderPublicKey } = params;
  const warnings: Warning[] = [];

  // Step 1: address format validation — early return
  if (!isValidAddress(recipientAddress)) {
    warnings.push({
      type: 'invalid_address_format',
      message: 'Invalid TON address format.',
      severity: 'error',
      blocking: true,
    });
    return { isValid: false, warnings };
  }

  const recipientRaw = normalizeAddress(recipientAddress);

  // Step 2: parallel execution of independent checks
  const [selfSendWarning, similarityWarning, newRecipientWarning, accountStateWarnings, balanceWarnings] =
    await Promise.all([
      Promise.resolve(checkSelfSend(recipientRaw, senderPublicKey)),
      Promise.resolve(checkAddressSimilarity(recipientRaw)),
      Promise.resolve(checkNewRecipient(recipientRaw)),
      checkAccountState(recipientAddress).catch(() => [] as Warning[]),
      Promise.resolve(checkBalance(amount, senderBalance)),
    ]);

  // Collect results
  if (selfSendWarning) warnings.push(selfSendWarning);
  if (similarityWarning) warnings.push(similarityWarning);
  if (newRecipientWarning) warnings.push(newRecipientWarning);
  warnings.push(...accountStateWarnings);
  warnings.push(...balanceWarnings);

  const isValid = !warnings.some((w) => w.severity === 'error');

  return { isValid, warnings };
}
