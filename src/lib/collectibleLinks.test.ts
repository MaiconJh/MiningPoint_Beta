import { describe, it, expect } from 'vitest';
import {
  grantCollectible,
  revokeCollectible,
  countUsersWithCollectible,
  listUsersWithCollectible,
  listUserCollectibles,
} from './collectibleLinks';

describe('collectibleLinks', () => {
  describe('validações de parâmetros', () => {
    it('lança erro ao chamar grantCollectible com parâmetros vazios', async () => {
      await expect(grantCollectible('', 'badge', 'item-1', 'admin-1')).rejects.toThrow(
        'Parâmetros inválidos'
      );
      await expect(grantCollectible('user-1', 'title', '', 'admin-1')).rejects.toThrow(
        'Parâmetros inválidos'
      );
    });

    it('lança erro ao chamar revokeCollectible com ID vazio', async () => {
      await expect(revokeCollectible('')).rejects.toThrow('Parâmetros inválidos');
    });

    it('retorna 0 em countUsersWithCollectible quando itemId for vazio', async () => {
      const count = await countUsersWithCollectible('badge', '');
      expect(count).toBe(0);
    });

    it('retorna array vazio em listUsersWithCollectible quando itemId for vazio', async () => {
      const items = await listUsersWithCollectible('title', '');
      expect(items).toEqual([]);
    });

    it('retorna array vazio em listUserCollectibles quando uid for vazio', async () => {
      const items = await listUserCollectibles('');
      expect(items).toEqual([]);
    });
  });
});
