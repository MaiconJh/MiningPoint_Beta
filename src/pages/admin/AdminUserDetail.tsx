import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { UserProfile, UserAttributes } from '../../types/profile';
import { Group } from '../../types/group';
import { listGroups } from '../../lib/groups';
import {
  getUser,
  setPrimaryGroup,
  setSecondaryGroups,
  setAttributes,
  setVisibility,
  banUser,
  unbanUser,
  deleteUser,
  adminSetHandle,
} from '../../lib/users';
import { getAvatarColor, getInitials } from '../../lib/avatar';
import { UserAttributesEditor } from '../../components/admin/UserAttributesEditor';
import { useAuth } from '../../context/AuthContext';
import { Chip } from '../../components/chip/Chip';

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

export const AdminUserDetail: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bannerAdminName, setBannerAdminName] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion modal/inline confirm
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Admin Handle management
  const [adminHandleInput, setAdminHandleInput] = useState('');
  const [isUpdatingHandle, setIsUpdatingHandle] = useState(false);
  const [handleSuccessMsg, setHandleSuccessMsg] = useState<string | null>(null);
  const [handleErrorMsg, setHandleErrorMsg] = useState<string | null>(null);

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

  const loadData = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    setError(null);
    try {
      const [allGroups, userProfile] = await Promise.all([
        listGroups(),
        getUser(uid),
      ]);
      setGroups(allGroups);
      setProfile(userProfile);

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

  const handlePrimaryGroupChange = async (newGroupId: string) => {
    if (!uid || !profile) return;
    try {
      await setPrimaryGroup(uid, newGroupId);
      await loadData();
    } catch (err) {
      console.error('Failed to change primary group:', err);
      setError('Erro ao alterar o grupo primário.');
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
      await loadData();
    } catch (err) {
      console.error('Failed to toggle secondary group:', err);
      setError('Erro ao atualizar grupos secundários.');
    }
  };

  const handleSaveAttributes = async (newAttrs: UserAttributes) => {
    if (!uid) return;
    try {
      await setAttributes(uid, newAttrs);
      setProfile((prev) => (prev ? { ...prev, attributes: newAttrs } : null));
    } catch (err) {
      console.error('Failed to save attributes:', err);
      setError('Erro ao salvar as qualidades.');
    }
  };

  const handleVisibilityChange = async (visibility: 'public' | 'private') => {
    if (!uid) return;
    try {
      await setVisibility(uid, visibility);
      setProfile((prev) => (prev ? { ...prev, visibility } : null));
    } catch (err) {
      console.error('Failed to change visibility:', err);
      setError('Erro ao alterar visibilidade.');
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

      {/* Section: Identificação Pública (@nick) */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Identificação Pública (@nick)</h2>
          <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
            Gerenciamento de identificador único e ID curto do usuário.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              ShortId
            </span>
            <span className="font-mono text-sm font-semibold text-[var(--text-secondary)] select-all">
              {profile.shortId || '---'}
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

      {/* Section: Visibilidade */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Visibilidade</h2>
          <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
            Define se o perfil pode ser visto por visitantes não autenticados.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={profile.visibility === 'public'}
              onChange={() => handleVisibilityChange('public')}
              className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
            />
            <span className="text-sm text-[var(--text-primary)]">Público</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={profile.visibility === 'private'}
              onChange={() => handleVisibilityChange('private')}
              className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
            />
            <span className="text-sm text-[var(--text-primary)]">Privado</span>
          </label>
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
