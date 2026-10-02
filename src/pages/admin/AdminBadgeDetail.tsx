import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Badge } from '../../types/profile';
import {
  getBadge,
  listUsersWithBadge,
  grantBadge,
  revokeBadge,
  UserWithBadgeItem,
  SearchUserResult,
} from '../../lib/badges';
import { resolveIcon } from '../../data/icons/iconRegistry';
import { useCustomIcons } from '../../hooks/useCustomIcons';
import { UserSearch } from '../../components/admin/UserSearch';
import { useAuth } from '../../context/AuthContext';
import { getAvatarColor, getInitials } from '../../lib/avatar';

const formatDate = (awardedAt?: unknown): string => {
  if (!awardedAt) return '—';
  let date: Date | null = null;
  if (typeof (awardedAt as { toDate?: () => Date }).toDate === 'function') {
    date = (awardedAt as { toDate: () => Date }).toDate();
  } else if (awardedAt instanceof Date) {
    date = awardedAt;
  } else if (typeof awardedAt === 'string' || typeof awardedAt === 'number') {
    date = new Date(awardedAt);
  }
  if (!date || isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const AdminBadgeDetail: React.FC = () => {
  const { badgeId } = useParams<{ badgeId: string }>();
  const { user: currentUser } = useAuth();
  const { customIcons } = useCustomIcons();

  const [badge, setBadge] = useState<Badge | null>(null);
  const [recipients, setRecipients] = useState<UserWithBadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!badgeId) return;
    setLoading(true);
    try {
      const [badgeData, usersList] = await Promise.all([
        getBadge(badgeId),
        listUsersWithBadge(badgeId),
      ]);
      setBadge(badgeData);
      setRecipients(usersList);
    } catch (err) {
      console.error('Error loading badge detail:', err);
      setError('Erro ao carregar os dados da insígnia.');
    } finally {
      setLoading(false);
    }
  }, [badgeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrant = async (targetUser: SearchUserResult) => {
    if (!badgeId || !currentUser) return;
    setActionLoading(true);
    setError(null);
    try {
      await grantBadge(targetUser.uid, badgeId, currentUser.uid);
      await loadData();
    } catch (err) {
      console.error('Error granting badge:', err);
      setError('Erro ao conceder a insígnia.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (userBadgeId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await revokeBadge(userBadgeId);
      await loadData();
    } catch (err) {
      console.error('Error revoking badge:', err);
      setError('Erro ao remover a insígnia do usuário.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-[var(--text-muted)] text-sm">
        Carregando...
      </div>
    );
  }

  if (!badge) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/insignias"
          className="inline-flex items-center gap-2 text-sm text-[var(--brand-primary)] hover:underline"
        >
          &larr; Voltar para insígnias
        </Link>
        <p className="text-[var(--text-secondary)]">Insígnia não encontrada.</p>
      </div>
    );
  }

  const IconComponent = resolveIcon(badge.icon, customIcons);
  const existingUserIds = new Set(recipients.map((r) => r.user.uid));

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back link */}
      <div>
        <Link
          to="/admin/insignias"
          className="inline-flex items-center gap-2 text-sm text-[var(--brand-primary)] hover:underline font-medium"
        >
          &larr; Voltar para insígnias
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {error}
        </div>
      )}

      {/* Header: Badge Info */}
      <div className="flex items-start gap-4 p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)] shrink-0 border border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)]">
          {IconComponent && <IconComponent className="w-8 h-8" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] m-0 leading-tight">
            {badge.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 m-0 leading-relaxed">
            {badge.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Quem tem esta insígnia */}
        <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-primary)] m-0">
              Quem tem esta insígnia
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
              {recipients.length}
            </span>
          </div>

          {recipients.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-4 m-0 text-center">
              Ninguém recebeu esta insígnia ainda.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)] max-h-96 overflow-y-auto">
              {recipients.map((item) => (
                <div
                  key={item.userBadge.id}
                  className="flex items-center justify-between py-3 gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      style={{ backgroundColor: getAvatarColor(item.user.displayName) }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden"
                    >
                      {item.user.photoURL ? (
                        <img
                          src={item.user.photoURL}
                          alt={item.user.displayName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(item.user.displayName)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate m-0">
                        {item.user.displayName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] m-0">
                        Concedida em {formatDate(item.userBadge.awardedAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRevoke(item.userBadge.id)}
                    className="px-2.5 py-1 text-xs font-semibold rounded border border-[var(--border-default)] text-[var(--feedback-error)] hover:border-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Conceder a um usuário */}
        <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col space-y-4">
          <div className="pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-primary)] m-0">
              Conceder a um usuário
            </h2>
          </div>

          <UserSearch
            existingUserIds={existingUserIds}
            onSelectUser={handleGrant}
            granting={actionLoading}
          />
        </section>
      </div>
    </div>
  );
};
