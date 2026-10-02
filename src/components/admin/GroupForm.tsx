import React, { useState } from 'react';
import { Group, GroupFormData } from '../../types/group';
import { ChipStyle } from '../../types/chip';
import { ChipStyleEditor } from './ChipStyleEditor';

interface GroupFormProps {
  initialGroup?: Group | null;
  onSave: (data: GroupFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (groupId: string) => Promise<void>;
  saving: boolean;
  inlineError?: string | null;
}

export const GroupForm: React.FC<GroupFormProps> = ({
  initialGroup,
  onSave,
  onCancel,
  onDelete,
  saving,
  inlineError,
}) => {
  const [name, setName] = useState(initialGroup?.name || '');
  const [description, setDescription] = useState(initialGroup?.description || '');
  const [color, setColor] = useState(initialGroup?.color || '#8BD0EF');
  const [priority, setPriority] = useState<number>(initialGroup?.priority ?? 10);
  const [isStaff, setIsStaff] = useState(initialGroup?.isStaff ?? false);
  const [isDefault, setIsDefault] = useState(initialGroup?.isDefault ?? false);
  const [chipStyle, setChipStyle] = useState<ChipStyle | undefined>(
    initialGroup?.chipStyle
  );

  const [accessPanel, setAccessPanel] = useState(
    initialGroup?.permissions?.admin?.accessPanel ?? false
  );
  const [manageUsers, setManageUsers] = useState(
    initialGroup?.permissions?.admin?.manageUsers ?? false
  );
  const [manageGroups, setManageGroups] = useState(
    initialGroup?.permissions?.admin?.manageGroups ?? false
  );
  const [manageBadges, setManageBadges] = useState(
    initialGroup?.permissions?.admin?.manageBadges ?? false
  );
  const [manageForum, setManageForum] = useState(
    initialGroup?.permissions?.admin?.manageForum ?? false
  );
  const [manageContent, setManageContent] = useState(
    initialGroup?.permissions?.admin?.manageContent ?? false
  );

  const [localError, setLocalError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('O nome do grupo é obrigatório.');
      return;
    }

    if (priority < 0 || priority > 100) {
      setLocalError('A prioridade deve ser um número entre 0 e 100.');
      return;
    }

    const payload: GroupFormData = {
      name: name.trim(),
      description: description.trim(),
      color: color.trim() || '#8BD0EF',
      priority: Number(priority),
      isStaff,
      isDefault,
      chipStyle: chipStyle ? chipStyle : undefined,
      permissions: {
        admin: {
          accessPanel: isStaff || accessPanel,
          manageUsers,
          manageGroups,
          manageBadges,
          manageForum,
          manageContent,
        },
        forum: initialGroup?.permissions?.forum || {},
      },
    };

    try {
      await onSave(payload);
    } catch (err: unknown) {
      console.error('Error saving group:', err);
      setLocalError('Erro ao salvar grupo. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    if (!initialGroup || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialGroup.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 sm:p-8 max-w-3xl">
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border-subtle)]">
        <h2 className="text-xl font-bold text-[var(--text-primary)] m-0">
          {initialGroup ? `Editar grupo: ${initialGroup.name}` : 'Novo grupo'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving || deleting}
          className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>

      {(localError || inlineError) && (
        <div className="mb-6 p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-sm">
          {localError || inlineError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <label htmlFor="group-name" className="block text-sm font-semibold text-[var(--text-primary)]">
            Nome <span className="text-[var(--feedback-error)]">*</span>
          </label>
          <input
            id="group-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <label htmlFor="group-desc" className="block text-sm font-semibold text-[var(--text-primary)]">
            Descrição
          </label>
          <input
            id="group-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
          />
        </div>

        {/* Cor e Prioridade */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="group-color" className="block text-sm font-semibold text-[var(--text-primary)]">
              Cor <span className="text-[var(--feedback-error)]">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="group-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 p-0.5 rounded cursor-pointer border border-[var(--border-default)] bg-transparent"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 font-mono uppercase px-3.5 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="group-priority" className="block text-sm font-semibold text-[var(--text-primary)]">
              Prioridade (0–100) <span className="text-[var(--feedback-error)]">*</span>
            </label>
            <input
              id="group-priority"
              type="number"
              min={0}
              max={100}
              required
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full font-mono px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
            />
          </div>
        </div>

        {/* Flags: Staff & Default */}
        <div className="pt-2 space-y-3 border-t border-[var(--border-subtle)]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isStaff}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsStaff(checked);
                if (checked) setAccessPanel(true);
              }}
              className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)] cursor-pointer"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              É grupo de staff
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)] cursor-pointer"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              É grupo padrão (atribuído a novos usuários)
            </span>
          </label>
        </div>

        {/* Aparência do chip */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <ChipStyleEditor
            value={chipStyle}
            fallbackColor={color}
            onChange={setChipStyle}
            labelName={name || 'Grupo'}
          />
        </div>

        {/* Permissões administrativas */}
        <div className="pt-4 border-t border-[var(--border-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">
            Permissões administrativas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accessPanel}
                onChange={(e) => setAccessPanel(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)]">Acessar o painel</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={manageUsers}
                onChange={(e) => setManageUsers(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)]">Gerenciar usuários</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={manageGroups}
                onChange={(e) => setManageGroups(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)]">Gerenciar grupos</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={manageBadges}
                onChange={(e) => setManageBadges(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)]">Gerenciar insígnias</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={manageForum}
                onChange={(e) => setManageForum(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)]">Gerenciar fórum</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={manageContent}
                onChange={(e) => setManageContent(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--brand-primary)] cursor-pointer"
              />
              <span className="text-sm text-[var(--text-secondary)]">Gerenciar conteúdo</span>
            </label>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-6 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || deleting}
              className="px-5 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar grupo'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {initialGroup && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="px-4 py-2.5 rounded-lg border border-[var(--feedback-error)] text-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? 'Excluindo...' : 'Excluir grupo'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
