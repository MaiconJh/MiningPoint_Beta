import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, UserAttributes, UserBadge, FeaturedBadgeItem } from '../../types/profile';
import { Timestamp } from 'firebase/firestore';
import { Group } from '../../types/group';
import { listGroups } from '../../lib/groups';
import {
  getUser,
  setPrimaryGroup,
  setSecondaryGroups,
  setAttributes,
  banUser,
  unbanUser,
  deleteUser,
  adminSetHandle,
} from '../../lib/users';
import { listUserBadges } from '../../lib/profile';
import { listUserTitles, listTitlesByIds } from '../../lib/titles';
import { getAvatarColor, getInitials } from '../../lib/avatar';
import { UserAttributesEditor } from '../../components/admin/UserAttributesEditor';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useBadges } from '../../hooks/useBadges';
import { useAdminUserDraft } from '../../hooks/useAdminUserDraft';
import { useCustomIcons } from '../../hooks/useCustomIcons';
import { resolveIcon } from '../../data/icons/iconRegistry';
import { Chip } from '../../components/chip/Chip';
import { SortableBadgeStrip } from '../../components/profile/SortableBadgeStrip';
import { Title } from '../../types/title';

const formatDate = (dateVal?: unknown): string => {
  if (!dateVal) return '';
  let d: Date | null = null;
  if (typeof (dateVal as { toDate?: () => Date }).toDate === 'function') {
    d = (dateVal as { toDate: () => Date }).toDate();
  } else if (dateVal instanceof Date) {
    d = dateVal;
  } else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    d = new Date(dateVal);
  }
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const PERMISSION_LABELS: Record<string, string> = {
  accessPanel: 'Acessar painel',
  manageUsers: 'Gerenciar usuários',
  manageGroups: 'Gerenciar grupos',
  manageBadges: 'Gerenciar insígnias',
  manageForum: 'Gerenciar fórum',
  manageContent: 'Gerenciar conteúdo',
  manageCatalogs: 'Gerenciar catálogos',
};

export const AdminUserDetail: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();
  const { showToast } = useToast();
  const { badges } = useBadges();
  const { customIcons } = useCustomIcons();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [ownedTitles, setOwnedTitles] = useState<Title[]>([]);
  const [bannerAdminName, setBannerAdminName] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { draft, setField, isDirty, isSaving, reset, save } = useAdminUserDraft(
    uid || '',
    profile
  );

  // Deletion modal/inline confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Admin Handle management
  const [adminHandleInput, setAdminHandleInput] = useState('');
  const [isUpdatingHandle, setIsUpdatingHandle] = useState(false);
  const [handleSuccessMsg, setHandleSuccessMsg] = useState<string | null>(null);
  const [handleErrorMsg, setHandleErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const [allGroups, userProfile, userBadgesList] = await Promise.all([
        listGroups(),
        getUser(uid),
        listUserBadges(uid),
      ]);
      setGroups(allGroups);
      setProfile(userProfile);
      setUserBadges(userBadgesList);

      if (userProfile?.bannedBy) {
        getUser(userProfile.bannedBy)
          .then((adminUser) => {
            setBannerAdminName(adminUser?.displayName || userProfile.bannedBy || 'Admin');
          })
          .catch(() => {
            setBannerAdminName(userProfile.bannedBy || 'Admin');
          });
      }
    } catch (err) {
      console.error('Failed to load user details:', err);
      setError('Erro ao carregar detalhes do usuário.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!uid) {
      setOwnedTitles([]);
      return;
    }

    let isMounted = true;

    listUserTitles(uid)
      .then(async (userTitleDocs) => {
        if (!isMounted) return;
        const titleIds = userTitleDocs.map((ut) => ut.titleId);
        if (titleIds.length > 0) {
          const loadedTitles = await listTitlesByIds(titleIds);
          if (isMounted) {
            loadedTitles.sort(
              (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)
            );
            setOwnedTitles(loadedTitles);
          }
        } else {
          if (isMounted) {
            setOwnedTitles([]);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching user titles in AdminUserDetail:', err);
        if (isMounted) {
          setOwnedTitles([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [uid]);

  const handleAdminSaveHandle = async () => {
    if (!uid) return;
    setIsUpdatingHandle(true);
    setHandleErrorMsg(null);
    setHandleSuccessMsg(null);
    try {
      await adminSetHandle(uid, adminHandleInput.trim() || null);
      setHandleSuccessMsg('@nick atualizado com sucesso pelo administrador!');
      setAdminHandleInput('');
      await loadData();
    } catch (err) {
      console.error('Failed to set handle as admin:', err);
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar @nick.';
      setHandleErrorMsg(msg);
    } finally {
      setIsUpdatingHandle(false);
    }
  };

  const handleResetRedefinedFlag = async () => {
    if (!uid || !db) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        hasRedefinedHandle: false,
      });
      await loadData();
    } catch (err) {
      console.error('Failed to reset hasRedefinedHandle:', err);
      setError('Erro ao resetar a flag de redefinição de @nick.');
    }
  };

  const handleSaveProfile = async () => {
    const success = await save();
    if (success) {
      await loadData();
    }
  };

  const handleToggleBadge = (badgeId: string) => {
    const isSelected = draft.featuredBadges.includes(badgeId);
    let updated: string[];
    if (isSelected) {
      updated = draft.featuredBadges.filter((id) => id !== badgeId);
    } else {
      if (draft.featuredBadges.length >= 4) return;
      updated = [...draft.featuredBadges, badgeId];
    }
    setField('featuredBadges', updated);
  };

  const handlePrimaryGroupChange = async (newGroupId: string) => {
    if (!uid || !profile) return;
    try {
      await setPrimaryGroup(uid, newGroupId);
      showToast('Alterações salvas.', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to change primary group:', err);
      showToast('Erro ao salvar.', 'error');
    }
  };

  const handleToggleSecondaryGroup = async (groupId: string) => {
    if (!uid || !profile) return;
    try {
      const current = profile.secondaryGroupIds || [];
      const updated = current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId];
      await setSecondaryGroups(uid, updated);
      showToast('Alterações salvas.', 'success');
      await loadData();
    } catch (err) {
      console.error('Failed to toggle secondary group:', err);
      showToast('Erro ao salvar.', 'error');
    }
  };

  const handleSaveAttributes = async (newAttrs: UserAttributes) => {
    if (!uid) return;
    try {
      await setAttributes(uid, newAttrs);
      setProfile((prev) => (prev ? { ...prev, attributes: newAttrs } : null));
      showToast('Alterações salvas.', 'success');
    } catch (err) {
      console.error('Failed to save attributes:', err);
      showToast('Erro ao salvar.', 'error');
    }
  };

  const handleBanToggle = async () => {
    if (!uid || !profile) return;
    try {
      if (profile.isBanned) {
        await unbanUser(uid);
      } else {
        await banUser(uid, currentAdmin?.uid || 'admin');
      }
      await loadData();
    } catch (err) {
      console.error('Failed to toggle ban:', err);
      setError('Erro ao alterar status de suspensão.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!uid || !profile || isDeleting) return;
    if (deleteInputName.trim() !== profile.displayName.trim()) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUser(uid);
      navigate('/admin/usuarios');
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Erro ao excluir conta do usuário.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[var(--text-muted)]">
        Carregando...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/usuarios"
          className="inline-flex items-center gap-2 text-sm text-[var(--brand-primary)] hover:underline"
        >
          &larr; Voltar para usuários
        </Link>
        <p className="text-[var(--text-secondary)]">Usuário não encontrado.</p>
      </div>
    );
  }

  const isOwnAccount = currentAdmin?.uid === profile.uid;
  const avatarColor = getAvatarColor(profile.displayName || profile.uid);
  const initials = getInitials(profile.displayName || profile.email || '?');
  const primaryColor = profile.primaryGroup?.color || '#8BD0EF';
  const primaryName = profile.primaryGroup?.name || 'Visitante';
  const bannedDateFormatted = formatDate(profile.bannedAt);

  const ownedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));
  const ownedBadges = badges.filter((b) => ownedBadgeIds.has(b.id));

  const featuredBadgeItems: FeaturedBadgeItem[] = draft.featuredBadges
    .map((id) => {
      const badge = badges.find((b) => b.id === id);
      const userBadge = userBadges.find((ub) => ub.badgeId === id);
      if (!badge) return null;
      return {
        badge,
        userBadge: userBadge || {
          id: `${uid}_${badge.id}`,
          userId: uid || '',
          badgeId: badge.id,
          awardedAt: Timestamp.now(),
          awardedBy: 'admin',
        },
      };
    })
    .filter((item): item is FeaturedBadgeItem => item !== null);

  const handleReorderFeaturedBadges = (newOrderIds: string[]) => {
    setField('featuredBadges', newOrderIds);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back link */}
      <div>
        <Link
          to="/admin/usuarios"
          className="inline-flex items-center gap-2 text-sm text-[var(--brand-primary)] hover:underline font-medium"
        >
          &larr; Voltar para usuários
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col sm:flex-row items-start sm:items-center gap-5 justify-between">
        <div className="flex items-center gap-4 min-w-0">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl shrink-0 text-[var(--text-on-primary)]"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] m-0 truncate">
              {profile.displayName || 'Sem nome'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] m-0 mt-0.5 truncate">
              {profile.email}
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Chip
                label={primaryName}
                color={primaryColor}
                style={profile.primaryGroup?.chipStyle}
              />

              {profile.isBanned && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-[color-mix(in_srgb,var(--feedback-error)_18%,transparent)] text-[var(--feedback-error)] border border-[var(--feedback-error)]">
                  Suspenso
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section: Perfil (Editável via Draft) */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Perfil</h2>
            <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
              Edite as informações públicas de exibição do usuário.
            </p>
          </div>
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[color-mix(in_srgb,var(--feedback-warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--feedback-warning)_30%,transparent)] text-[11px] font-semibold text-[var(--feedback-warning)]">
              <span className="w-2 h-2 rounded-full bg-[var(--feedback-warning)] animate-pulse shrink-0" />
              <span>Alterações pendentes</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* displayName */}
          <div>
            <label
              htmlFor="admin-edit-displayname"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              Nome de exibição
            </label>
            <input
              id="admin-edit-displayname"
              type="text"
              value={draft.displayName}
              onChange={(e) => setField('displayName', e.target.value)}
              placeholder="Nome do usuário"
              className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* photoURL */}
          <div>
            <label
              htmlFor="admin-edit-photourl"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
            >
              URL da foto de perfil
            </label>
            <input
              id="admin-edit-photourl"
              type="text"
              value={draft.photoURL}
              onChange={(e) => setField('photoURL', e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>
        </div>

        {/* bio */}
        <div>
          <label
            htmlFor="admin-edit-bio"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Bio
          </label>
          <textarea
            id="admin-edit-bio"
            rows={4}
            maxLength={400}
            value={draft.bio}
            onChange={(e) => setField('bio', e.target.value)}
            placeholder="Biografia do usuário..."
            className="w-full px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] resize-y"
          />
          <div className="text-right text-[11px] text-[var(--text-muted)] mt-1">
            {draft.bio.length}/400
          </div>
        </div>

        {/* featuredTitleId */}
        <div>
          <label
            htmlFor="admin-edit-title"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Título exibido
          </label>
          <select
            id="admin-edit-title"
            value={draft.featuredTitleId || ''}
            onChange={(e) => setField('featuredTitleId', e.target.value || null)}
            className="w-full sm:w-80 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
          >
            <option value="">Nenhum título</option>
            {draft.featuredTitleId && !ownedTitles.some((t) => t.id === draft.featuredTitleId) && (
              <option value={draft.featuredTitleId}>
                {profile.featuredTitle?.name || 'Título atual'}
              </option>
            )}
            {ownedTitles.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* featuredBadges */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Insígnias destacadas ({draft.featuredBadges.length}/4)
          </label>
          <p className="text-xs text-[var(--text-muted)] m-0 mb-3">
            Escolha até 4 insígnias que o usuário possui para exibição no perfil público.
          </p>

          {ownedBadges.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic m-0">
              O usuário não possui insígnias concedidas.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {featuredBadgeItems.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      Ordem de exibição ({featuredBadgeItems.length}/4)
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Arraste ou use os botões para reordenar
                    </span>
                  </div>
                  <SortableBadgeStrip
                    items={featuredBadgeItems}
                    onReorder={handleReorderFeaturedBadges}
                    onRemove={(badgeId) => handleToggleBadge(badgeId)}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
              {ownedBadges.map((badge) => {
                const IconComponent = resolveIcon(badge.icon, customIcons);
                const isSelected = draft.featuredBadges.includes(badge.id);
                const isDisabled = !isSelected && draft.featuredBadges.length >= 4;

                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => handleToggleBadge(badge.id)}
                    disabled={isDisabled}
                    aria-label={badge.name}
                    title={badge.name}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-2 border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)] shadow-xs'
                        : isDisabled
                        ? 'border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
                        : 'border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)] cursor-pointer'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5 shrink-0" />}

                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--brand-primary)] text-[var(--text-on-primary)] flex items-center justify-center shadow-xs">
                        <svg
                          viewBox="0 0 24 24"
                          width="10"
                          height="10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
              </div>
            </div>
          )}
        </div>

        {/* visibility */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
            Visibilidade do perfil
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="admin-user-visibility"
                value="public"
                checked={draft.visibility === 'public'}
                onChange={() => setField('visibility', 'public')}
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Público</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="admin-user-visibility"
                value="private"
                checked={draft.visibility === 'private'}
                onChange={() => setField('visibility', 'private')}
                className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">Privado</span>
            </label>
          </div>
        </div>

        {/* Action bar for Profile form */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={reset}
            disabled={!isDirty || isSaving}
            className="px-4 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Descartar
          </button>
          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={!isDirty || isSaving}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              isDirty && !isSaving
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:opacity-90 shadow-xs cursor-pointer'
                : 'border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </section>

      {/* Section: Identificação Pública (@nick) */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Identificação Pública (@nick)</h2>
          <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
            Gerenciamento de identificador único e ID curto do usuário.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)]">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              @nick atual
            </span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
              {profile.handle ? `@${profile.handle}` : 'Sem @nick'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)]">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Redefinição usada?
            </span>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {profile.hasRedefinedHandle ? 'Sim' : 'Não'}
              </span>
              {profile.hasRedefinedHandle && (
                <button
                  type="button"
                  onClick={handleResetRedefinedFlag}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
                >
                  Resetar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form para alterar/remover @nick como Admin */}
        <div className="p-4 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] space-y-3">
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            Alterar / Definir @nick (Deixe em branco para remover)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={adminHandleInput}
              onChange={(e) => setAdminHandleInput(e.target.value)}
              placeholder={profile.handle || 'novonick'}
              className="flex-1 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
            <button
              type="button"
              onClick={handleAdminSaveHandle}
              disabled={isUpdatingHandle}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-[var(--brand-primary)] text-[var(--bg-default)] uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
            >
              {isUpdatingHandle ? 'Salvando...' : 'Salvar @nick'}
            </button>
          </div>

          {handleErrorMsg && (
            <p className="text-xs text-[var(--feedback-error)] m-0">{handleErrorMsg}</p>
          )}
          {handleSuccessMsg && (
            <p className="text-xs text-[var(--feedback-success)] m-0">{handleSuccessMsg}</p>
          )}
        </div>
      </section>

      {/* Section: Grupos */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6">
        <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Grupos</h2>

        {/* Primary group */}
        <div>
          <label htmlFor="user-primary-group-select" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Grupo Primário
          </label>
          <select
            id="user-primary-group-select"
            value={profile.primaryGroupId}
            onChange={(e) => handlePrimaryGroupChange(e.target.value)}
            className="w-full sm:w-80 px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--brand-primary)]"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Secondary groups */}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
            Grupos Secundários
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {groups
              .filter((g) => g.id !== profile.primaryGroupId)
              .map((g) => {
                const isSelected = profile.secondaryGroupIds?.includes(g.id);
                return (
                  <label
                    key={g.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_6%,transparent)]'
                        : 'border-[var(--border-default)] bg-[var(--bg-default)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSecondaryGroup(g.id)}
                      className="rounded text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {g.name}
                      </div>
                      <div
                        className="text-[10px] font-mono uppercase"
                        style={{ color: g.color }}
                      >
                        Prioridade {g.priority}
                      </div>
                    </div>
                  </label>
                );
              })}
          </div>
        </div>
      </section>

      {/* Section: Qualidades */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Qualidades</h2>
          <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
            Ajuste os atributos de habilidades do usuário.
          </p>
        </div>

        <UserAttributesEditor
          attributes={profile.attributes}
          onSave={handleSaveAttributes}
        />
      </section>

      {/* Section: Auditoria (Somente Leitura) */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Auditoria</h2>
          <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
            Dados de rastreamento, permissões vigentes e registros do sistema.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)]">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              ShortId
            </span>
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)] select-all">
              {profile.shortId || '---'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)]">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Membro da Equipe
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {profile.isStaff ? 'Sim' : 'Não'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)]">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Data de Cadastro
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {formatDate(profile.createdAt) || '---'}
            </span>
          </div>

          <div className="p-4 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)]">
            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider block mb-1">
              Status da Conta
            </span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {profile.isBanned ? 'Suspenso' : 'Ativo'}
            </span>
          </div>
        </div>

        {/* Banned details if applicable */}
        {profile.isBanned && (
          <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_8%,transparent)] border border-[var(--feedback-error)] space-y-1">
            <p className="text-xs font-semibold text-[var(--feedback-error)] m-0">
              Registro de Suspensão
            </p>
            <p className="text-xs text-[var(--text-secondary)] m-0">
              Suspenso em: <strong className="text-[var(--text-primary)]">{bannedDateFormatted || 'Data desconhecida'}</strong> por{' '}
              <strong className="text-[var(--text-primary)]">{bannerAdminName || profile.bannedBy || 'Administrador'}</strong>
            </p>
          </div>
        )}

        {/* Effective permissions */}
        <div>
          <span className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
            Permissões Efetivas
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {Object.entries(profile.effectivePermissions || {}).map(([key, active]) => {
              const label = PERMISSION_LABELS[key] || key;
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-2 ${
                    active
                      ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_6%,transparent)]'
                      : 'border-[var(--border-default)] bg-[var(--bg-default)] opacity-60'
                  }`}
                >
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">
                    {label}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      active
                        ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)]'
                        : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
                    }`}
                  >
                    {active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section: Suspensão */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Suspensão</h2>
          <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
            Usuários suspensos perdem permissão de gravação em toda a plataforma.
          </p>
        </div>

        {profile.isBanned ? (
          <div className="p-4 rounded-lg border border-[var(--feedback-error)] bg-[color-mix(in_srgb,var(--feedback-error)_8%,transparent)] space-y-3">
            <p className="text-xs text-[var(--feedback-error)] font-medium m-0">
              Suspenso em {bannedDateFormatted || 'data desconhecida'} por {bannerAdminName || 'Administrador'}
            </p>
            <button
              type="button"
              onClick={handleBanToggle}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
            >
              Reativar usuário
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={handleBanToggle}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[color-mix(in_srgb,var(--feedback-error)_14%,transparent)] text-[var(--feedback-error)] border border-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_22%,transparent)] transition-colors cursor-pointer"
            >
              Suspender usuário
            </button>
          </div>
        )}
      </section>

      {/* Section: Ações perigosas (Absent for own account) */}
      {!isOwnAccount && (
        <section className="p-6 rounded-xl border border-[var(--feedback-error)] bg-[var(--bg-surface)] space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--feedback-error)] m-0">
              Ações perigosas
            </h2>
            <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
              Esta ação excluirá o perfil do usuário e todas as suas insígnias vinculadas.
            </p>
          </div>

          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--feedback-error)] text-[var(--text-on-primary)] hover:opacity-90 transition-opacity cursor-pointer"
            >
              Excluir conta
            </button>
          ) : (
            <div className="p-4 rounded-lg border border-[var(--feedback-error)] bg-[color-mix(in_srgb,var(--feedback-error)_6%,transparent)] space-y-3 max-w-md">
              <p className="text-xs text-[var(--text-primary)] font-medium m-0">
                Digite <strong className="text-[var(--feedback-error)]">{profile.displayName}</strong> para confirmar a exclusão definitiva:
              </p>
              <input
                type="text"
                value={deleteInputName}
                onChange={(e) => setDeleteInputName(e.target.value)}
                placeholder={profile.displayName}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--feedback-error)]"
              />
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInputName('');
                  }}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    deleteInputName.trim() !== profile.displayName.trim() || isDeleting
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--feedback-error)] text-[var(--text-on-primary)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
                >
                  {isDeleting ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

