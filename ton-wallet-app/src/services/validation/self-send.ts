/**
 * file: self-send.ts
 * description: Проверка отправки средств на собственный адрес (self-send)
 * dependencies: contract-factory.ts, address-format.ts, types.ts
 * created: 2026-03-31
 */

import { createContract } from '../wallet/contract-factory';
import type { WalletVersion } from '../wallet/contract-factory';
import type { Warning } from './types';

const ALL_VERSIONS: WalletVersion[] = ['v3R2', 'v4R2', 'v5R1'];

/**
 * Проверяет, не отправляет ли пользователь средства самому себе.
 * Сравнивает recipientRaw с адресами кошелька для всех версий контрактов.
 *
 * @param recipientRaw - адрес получателя в raw-формате (0:hex)
 * @param walletPublicKey - публичный ключ кошелька отправителя
 * @returns Warning если совпадение найдено, иначе null
 */
export function checkSelfSend(recipientRaw: string, walletPublicKey: Buffer): Warning | null {
  for (const version of ALL_VERSIONS) {
    const contract = createContract(walletPublicKey, version);
    const ownRaw = contract.address.toRawString();

    if (ownRaw === recipientRaw) {
      return {
        type: 'self_send',
        message: 'Вы отправляете средства на свой собственный адрес.',
        severity: 'warning',
        blocking: false,
      };
    }
  }

  return null;
}
