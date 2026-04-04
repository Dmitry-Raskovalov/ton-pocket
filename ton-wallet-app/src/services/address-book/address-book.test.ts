/**
 * file: address-book.test.ts
 * description: Unit tests for AddressBook service
 * dependencies: address-book.ts
 * created: 2026-03-31
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AddressBook } from './address-book';

// Raw addresses in 0:hex format
const ADDR_A = '0:aabbcc112233445566778899aabbcc112233445566778899aabbcc1122334455';
const ADDR_B = '0:aabbcc112233445566778899aabbcc112233445566778899aabbcc1122334466'; // same prefix, diff suffix
const ADDR_C = '0:ff00001122334455667788990011223344556677889900112233445566334455'; // same suffix as A
const ADDR_D = '0:deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'; // unrelated

describe('AddressBook', () => {
  let book: AddressBook;

  beforeEach(() => {
    localStorage.clear();
    book = new AddressBook();
  });

  describe('addOrUpdateEntry + getEntries', () => {
    it('добавляет новую запись', () => {
      book.addOrUpdateEntry({ address: ADDR_A, displayAddress: 'EQaabb...', source: 'manual' });
      const entries = book.getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].address).toBe(ADDR_A);
      expect(entries[0].usageCount).toBe(1);
    });

    it('обновляет usageCount при повторном добавлении', () => {
      book.addOrUpdateEntry({ address: ADDR_A });
      book.addOrUpdateEntry({ address: ADDR_A });
      book.addOrUpdateEntry({ address: ADDR_A });
      const entry = book.getByAddress(ADDR_A);
      expect(entry?.usageCount).toBe(3);
    });

    it('сохраняет label при обновлении', () => {
      book.addOrUpdateEntry({ address: ADDR_A, label: 'Alice' });
      book.addOrUpdateEntry({ address: ADDR_A }); // без label
      expect(book.getByAddress(ADDR_A)?.label).toBe('Alice');
    });

    it('позволяет обновить label', () => {
      book.addOrUpdateEntry({ address: ADDR_A, label: 'Alice' });
      book.addOrUpdateEntry({ address: ADDR_A, label: 'Bob' });
      expect(book.getByAddress(ADDR_A)?.label).toBe('Bob');
    });
  });

  describe('getByAddress', () => {
    it('возвращает запись по адресу', () => {
      book.addOrUpdateEntry({ address: ADDR_A, label: 'Test' });
      const entry = book.getByAddress(ADDR_A);
      expect(entry).toBeDefined();
      expect(entry?.label).toBe('Test');
    });

    it('возвращает undefined для незнакомого адреса', () => {
      expect(book.getByAddress(ADDR_D)).toBeUndefined();
    });
  });

  describe('findSimilar', () => {
    beforeEach(() => {
      book.addOrUpdateEntry({ address: ADDR_A, label: 'Alice' });
      book.addOrUpdateEntry({ address: ADDR_B, label: 'Bob' });   // совпадает prefix с A
      book.addOrUpdateEntry({ address: ADDR_C, label: 'Carol' }); // совпадает suffix с A
      book.addOrUpdateEntry({ address: ADDR_D, label: 'Dave' });  // не совпадает с A
    });

    it('находит адрес с совпадающим prefix', () => {
      const similar = book.findSimilar(ADDR_A);
      const match = similar.find((m) => m.entry.address === ADDR_B);
      expect(match).toBeDefined();
      expect(match?.matchType).toBe('prefix');
    });

    it('находит адрес с совпадающим suffix', () => {
      const similar = book.findSimilar(ADDR_A);
      const match = similar.find((m) => m.entry.address === ADDR_C);
      expect(match).toBeDefined();
      expect(match?.matchType).toBe('suffix');
    });

    it('НЕ возвращает полностью совпадающий адрес', () => {
      const similar = book.findSimilar(ADDR_A);
      const selfMatch = similar.find((m) => m.entry.address === ADDR_A);
      expect(selfMatch).toBeUndefined();
    });

    it('не находит несвязанный адрес', () => {
      const similar = book.findSimilar(ADDR_A);
      const daveMatch = similar.find((m) => m.entry.address === ADDR_D);
      expect(daveMatch).toBeUndefined();
    });

    it('возвращает пустой массив если нет похожих', () => {
      localStorage.clear();
      book = new AddressBook();
      book.addOrUpdateEntry({ address: ADDR_D });
      const similar = book.findSimilar(ADDR_A);
      expect(similar).toHaveLength(0);
    });
  });

  describe('getLabelForAddress', () => {
    it('возвращает label для известного адреса', () => {
      book.addOrUpdateEntry({ address: ADDR_A, label: 'Alice' });
      expect(book.getLabelForAddress(ADDR_A)).toBe('Alice');
    });

    it('возвращает undefined для неизвестного адреса', () => {
      expect(book.getLabelForAddress(ADDR_D)).toBeUndefined();
    });
  });

  describe('persistence в localStorage', () => {
    it('данные сохраняются и восстанавливаются', () => {
      book.addOrUpdateEntry({ address: ADDR_A, label: 'Persistent', source: 'sent' });
      book.addOrUpdateEntry({ address: ADDR_D, label: 'Dave', source: 'received' });

      // Создаём новый экземпляр — должен загрузить из localStorage
      const book2 = new AddressBook();
      expect(book2.getEntries()).toHaveLength(2);
      expect(book2.getByAddress(ADDR_A)?.label).toBe('Persistent');
      expect(book2.getByAddress(ADDR_D)?.sources).toContain('received');
    });

    it('usageCount сохраняется между сессиями', () => {
      book.addOrUpdateEntry({ address: ADDR_A });
      book.addOrUpdateEntry({ address: ADDR_A });

      const book2 = new AddressBook();
      expect(book2.getByAddress(ADDR_A)?.usageCount).toBe(2);
    });
  });
});
