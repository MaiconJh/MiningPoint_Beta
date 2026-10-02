import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Title } from '../../types/title';
import {
  getTitle,
  listUsersWithTitle,
  grantTitle,
  revokeTitle,
  UserWithTitleItem,
} from '../../lib/titles';
import { SearchUserResult } from '../../lib/badges';
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

export const AdminTitleDetail: React.FC = () => {
  const { titleId } = useParams<{ titleId: string }>();
  const { user: currentUser } = useAuth();

  const [title, setTitle] = useState<Title | null>(null);
  const [recipients, setRecipients] = useState<UserWithTitleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!titleId) return;
    setLoading(true);
    try {
      const [titleData, usersList] = await Promise.all([
        getTitle(titleId),
        listUsersWithTitle(titleId),
      ]);
      setTitle(titleData);
      setRecipients(usersList);
    } catch (err) {
      console.error('Error loading title detail:', err);
      setError('Erro ao carregar os dados do título.');
    } finally {
      setLoading(false);
    }
  }, [titleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrant = async (targetUser: SearchUserResult) => {
    if (!titleId || !currentUser) return;
    setActionLoading(true);
    setError(null);
    try {
      await grantTitle(targetUser.uid, titleId, currentUser.uid);
      await loadData();
    } catch (err) {
      console.error('Error granting title:', err);
      setError('Erro ao conceder o título.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (userTitleId: string) => {
    setActionLoading(true);
    setError(null);
    try {
      await revokeTitle(userTitleId);
      await loadData();
    } catch (err) {
      console.error('Error revoking title:', err);
      setError('Erro ao remover o título do usuário.');
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

  if (!title) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/titulos"
          className="inline-flex items-center gap-2 text-sm text-[var(--brand-primary)] hover:underline"
        >
          &larr; Voltar para títulos
        </Link>
        <p className="text-[var(--text-secondary)]">Título não encontrado.</p>
      </div>
    );
  }

  const existingUserIds = new Set(recipients.map((r) => r.user.uid));

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back link */}
      <div>
        <Link
          to="/admin/titulos"
          className="inline-flex items-center gap-2 text-sm text-[var(--brand-primary)] hover:underline font-medium"
        >
          &larr; Voltar para títulos
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {error}
        </div>
      )}

      {/* Header: Title Info with Large Colored Preview */}
      <div className="flex items-start gap-5 p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-[var(--border-default)] shadow-xs"
          style={{ backgroundColor: title.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1
              className="text-2xl font-bold m-0 leading-tight"
              style={{ color: title.color }}
            >
              {title.name}
            </h1>
            <span className="font-mono text-xs text-[var(--text-muted)]">
              {title.color}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 m-0 leading-relaxed">
            {title.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section 1: Quem tem este título */}
        <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <h2 className="text-base font-bold text-[var(--text-primary)] m-0">
              Quem tem este título
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
              {recipients.length}
            </span>
          </div>

          {recipients.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-4 m-0 text-center">
              Ninguém recebeu este título ainda.
            </p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)] max-h-96 overflow-y-auto">
              {recipients.map((item) => (
                <div
                  key={item.userTitle.id}
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
                        Concedido em {formatDate(item.userTitle.awardedAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleRevoke(item.userTitle.id)}
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
