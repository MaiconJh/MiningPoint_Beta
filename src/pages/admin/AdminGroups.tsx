import React, { useState, useEffect, useCallback } from 'react';
import { Group, GroupFormData } from '../../types/group';
import {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  countUsersInGroup,
  seedDefaultGroups,
  recomputeUserDerivedFields,
} from '../../lib/groups';
import { GroupForm } from '../../components/admin/GroupForm';
import { useAuth } from '../../context/AuthContext';
import { Chip } from '../../components/chip/Chip';

export const AdminGroups: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Form view mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let groupList = await listGroups();
      if (groupList.length === 0) {
        await seedDefaultGroups();
        groupList = await listGroups();
      }
      setGroups(groupList);

      // Load counts in parallel
      const counts: Record<string, number> = {};
      await Promise.all(
        groupList.map(async (g) => {
          counts[g.id] = await countUsersInGroup(g.id);
        })
      );
      setMemberCounts(counts);
    } catch (err) {
      console.error('Failed to load groups data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setSelectedGroup(null);
    setFormError(null);
    setViewMode('create');
  };

  const handleOpenEdit = (group: Group) => {
    setSelectedGroup(group);
    setFormError(null);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setViewMode('list');
    setSelectedGroup(null);
    setFormError(null);
  };

  const handleSave = async (formData: GroupFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      let targetGroupId = '';
      if (viewMode === 'create') {
        const created = await createGroup(formData, user?.uid || 'admin');
        targetGroupId = created.id;
      } else if (viewMode === 'edit' && selectedGroup) {
        await updateGroup(selectedGroup.id, formData);
        targetGroupId = selectedGroup.id;
      }
      if (targetGroupId) {
        await recomputeUserDerivedFields(targetGroupId);
      }
      await loadData();
      await refreshProfile();
      setViewMode('list');
      setSelectedGroup(null);
    } catch (err: unknown) {
      console.error('Failed to save group:', err);
      setFormError('Erro ao salvar as informações do grupo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    setFormError(null);
    const result = await deleteGroup(groupId);
    if (!result.success) {
      setFormError(result.error || 'Não foi possível excluir o grupo.');
      return;
    }
    await loadData();
    setViewMode('list');
    setSelectedGroup(null);
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="space-y-6">
        <GroupForm
          initialGroup={selectedGroup}
          onSave={handleSave}
          onCancel={handleCancelForm}
          onDelete={viewMode === 'edit' ? handleDelete : undefined}
          saving={saving}
          inlineError={formError}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-default)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] m-0">
            Grupos
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 m-0">
            Gerencie os níveis de acesso, cores e permissões dos membros da comuna.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          Novo grupo
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {formError}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--border-default)] border-t-[var(--brand-primary)] animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="py-12 text-center text-[var(--text-secondary)]">
          Nenhum grupo cadastrado.
        </div>
      ) : (
        <div className="border border-[var(--border-default)] rounded-xl bg-[var(--bg-surface)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] font-mono text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Cor</th>
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 w-28 text-center">Prioridade</th>
                  <th className="py-3 px-4 w-28 text-center">Membros</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-24 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {groups.map((group) => {
                  const count = memberCounts[group.id] ?? 0;

                  return (
                    <tr
                      key={group.id}
                      className="hover:bg-[var(--bg-surface-elevated)] transition-colors"
                    >
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-block w-4 h-4 rounded-full border border-[color-mix(in_srgb,var(--text-primary)_20%,transparent)] shadow-sm align-middle"
                          style={{ backgroundColor: group.color }}
                          title={group.color}
                        />
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
                        <div className="flex items-center gap-2">
                          <span>{group.name}</span>
                          {group.isDefault && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-default)] text-[var(--brand-primary)] border border-[var(--brand-primary)]">
                              Padrão
                            </span>
                          )}
                          {group.isStaff && (
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-default)] text-[var(--brand-community)] border border-[var(--brand-community)]">
                              Staff
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[var(--text-secondary)] max-w-xs truncate">
                        {group.description || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-medium text-[var(--text-primary)]">
                        {group.priority}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-medium text-[var(--text-primary)]">
                        {count}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Chip
                          label={group.name}
                          color={group.color}
                          style={group.chipStyle}
                        />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(group)}
                          className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
