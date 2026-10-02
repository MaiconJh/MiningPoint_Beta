import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../../types/profile';
import { Group } from '../../types/group';
import { listGroups } from '../../lib/groups';
import {
  listUsers,
  bulkAssignGroup,
  recomputeUser,
  recomputeAllUsers,
} from '../../lib/users';
import { getAvatarColor, getInitials } from '../../lib/avatar';
import { BulkAssignPanel } from '../../components/admin/BulkAssignPanel';
import { Chip } from '../../components/chip/Chip';
import type { DocumentSnapshot } from 'firebase/firestore';

export const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');

  // Selection
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set());
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load groups on mount
  useEffect(() => {
    listGroups().then(setGroups);
  }, []);

  // Fetch first page
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers({
        limitCount: 25,
        searchQuery: searchQuery.trim() || null,
        groupId: selectedGroupFilter !== 'all' ? selectedGroupFilter : null,
      });
      setUsers(res.users);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
      setSelectedUids(new Set());
      setShowBulkPanel(false);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedGroupFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listUsers({
        limitCount: 25,
        lastDoc,
        searchQuery: searchQuery.trim() || null,
        groupId: selectedGroupFilter !== 'all' ? selectedGroupFilter : null,
      });
      setUsers((prev) => [...prev, ...res.users]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch (err) {
      console.error('Failed to load more users:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedUids.size === users.length) {
      setSelectedUids(new Set());
    } else {
      setSelectedUids(new Set(users.map((u) => u.uid)));
    }
  };

  const handleToggleSelectRow = (uid: string) => {
    const next = new Set(selectedUids);
    if (next.has(uid)) {
      next.delete(uid);
    } else {
      next.add(uid);
    }
    setSelectedUids(next);
  };

  const handleClearSelection = () => {
    setSelectedUids(new Set());
    setShowBulkPanel(false);
  };

  // Bulk assign group
  const handleBulkAssignConfirm = async (
    groupId: string,
    mode: 'primary' | 'secondary'
  ) => {
    const uidsArray = Array.from(selectedUids);
    setBulkProgress(`Atualizando 0 de ${uidsArray.length}...`);

    try {
      const result = await bulkAssignGroup(
        uidsArray,
        groupId,
        mode,
        (done, total) => {
          setBulkProgress(`Atualizando ${done} de ${total}...`);
        }
      );

      if (result.failedUids.length > 0) {
        console.error('Failed UIDs during bulk assign:', result.failedUids);
        showToast(
          `${result.successCount} atualizados, ${result.failedUids.length} falharam.`
        );
      } else {
        showToast(`${result.successCount} usuários atualizados.`);
      }

      setShowBulkPanel(false);
      setSelectedUids(new Set());
      await fetchUsers();
    } catch (err) {
      console.error('Bulk assign failed:', err);
      showToast('Erro ao realizar a atribuição em massa.');
    } finally {
      setBulkProgress(null);
    }
  };

  // Recompute selected
  const handleRecomputeSelected = async () => {
    const uidsArray = Array.from(selectedUids);
    if (uidsArray.length === 0) return;

    setBulkProgress(`Sincronizando 0 de ${uidsArray.length}...`);
    try {
      let count = 0;
      for (let i = 0; i < uidsArray.length; i++) {
        await recomputeUser(uidsArray[i]);
        count++;
        setBulkProgress(`Sincronizando ${count} de ${uidsArray.length}...`);
      }
      showToast(`${count} permissões sincronizadas.`);
      setSelectedUids(new Set());
      await fetchUsers();
    } catch (err) {
      console.error('Failed to recompute selected:', err);
      showToast('Erro ao sincronizar permissões selecionadas.');
    } finally {
      setBulkProgress(null);
    }
  };

  // Recompute all users
  const handleRecomputeAll = async () => {
    setBulkProgress('Iniciando sincronização geral...');
    try {
      const result = await recomputeAllUsers((done, total) => {
        setBulkProgress(`Sincronizando ${done} de ${total}...`);
      });
      showToast(
        `${result.syncedCount} usuários sincronizados, ${result.unchangedCount} já estavam corretos.`
      );
      await fetchUsers();
    } catch (err) {
      console.error('Failed to recompute all users:', err);
      showToast('Erro ao recomputar todas as permissões.');
    } finally {
      setBulkProgress(null);
    }
  };

  const isAllSelected = users.length > 0 && selectedUids.size === users.length;
  const isSomeSelected = selectedUids.size > 0;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] shadow-xl text-sm font-medium text-[var(--text-primary)] flex items-center gap-3 animate-fade-in">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] m-0">
            Usuários
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRecomputeAll}
            disabled={!!bulkProgress}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-50"
          >
            {bulkProgress || 'Recomputar todas as permissões'}
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              startTransition(() => {
                setSearchQuery(val);
              });
            }}
            placeholder="Buscar por nome ou email"
            className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedGroupFilter}
            onChange={(e) => setSelectedGroupFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="all">Todos os grupos</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {isSomeSelected && (
        <div className="p-3.5 rounded-xl border border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,transparent)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--brand-primary)]">
              {selectedUids.size}{' '}
              {selectedUids.size === 1 ? 'usuário selecionado' : 'usuários selecionados'}
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={!!bulkProgress}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline cursor-pointer"
            >
              Limpar seleção
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBulkPanel(!showBulkPanel)}
              disabled={!!bulkProgress}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              Atribuir grupo
            </button>

            <button
              type="button"
              onClick={handleRecomputeSelected}
              disabled={!!bulkProgress}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-50"
            >
              Recomputar permissões
            </button>
          </div>
        </div>
      )}

      {/* Bulk Assign Panel Modal/Inline */}
      {showBulkPanel && isSomeSelected && (
        <div className="flex justify-end">
          <BulkAssignPanel
            groups={groups}
            selectedCount={selectedUids.size}
            onConfirm={handleBulkAssignConfirm}
            onCancel={() => setShowBulkPanel(false)}
            disabled={!!bulkProgress}
          />
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">
            Carregando usuários...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-secondary)]">
            {searchQuery || selectedGroupFilter !== 'all'
              ? 'Nenhum usuário encontrado.'
              : 'Nenhum usuário cadastrado.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleToggleSelectAll}
                      className="cursor-pointer rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                  </th>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Grupo Primário</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-sm">
                {users.map((u) => {
                  const isSelected = selectedUids.has(u.uid);
                  const avatarColor = getAvatarColor(u.displayName || u.uid);
                  const initials = getInitials(u.displayName || u.email || '?');
                  const primaryColor = u.primaryGroup?.color || '#8BD0EF';
                  const primaryName = u.primaryGroup?.name || 'Visitante';
                  const secondaryNames = (u.secondaryGroups || []).map((g) => g.name).join(', ');
                  const secondaryCount = (u.secondaryGroups || []).length;

                  return (
                    <tr
                      key={u.uid}
                      onClick={() => navigate(`/admin/usuarios/${u.uid}`)}
                      className={`hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[color-mix(in_srgb,var(--brand-primary)_6%,transparent)]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(u.uid)}
                          className="cursor-pointer rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                        />
                      </td>

                      {/* User Avatar + Name + Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {u.photoURL ? (
                            <img
                              src={u.photoURL}
                              alt={u.displayName}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-[var(--text-on-primary)]"
                              style={{ backgroundColor: avatarColor }}
                            >
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-[var(--text-primary)] truncate">
                              {u.displayName || 'Sem nome'}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] truncate">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Group Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Chip
                            label={primaryName}
                            color={primaryColor}
                            style={u.primaryGroup?.chipStyle}
                          />

                          {secondaryCount > 0 && (
                            <span
                              title={secondaryNames}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-[var(--bg-default)] text-[var(--text-secondary)] border border-[var(--border-default)] cursor-help"
                            >
                              +{secondaryCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status / Ban */}
                      <td className="py-3.5 px-4 text-center">
                        {u.isBanned ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[color-mix(in_srgb,var(--feedback-error)_18%,transparent)] text-[var(--feedback-error)] border border-[var(--feedback-error)]">
                            Suspenso
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Load more */}
        {hasMore && !loading && (
          <div className="p-4 border-t border-[var(--border-subtle)] text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
