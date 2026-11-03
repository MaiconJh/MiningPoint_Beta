import React, { useState, useMemo, useCallback } from 'react';
import MessageSquareIcon from 'lucide-react/dist/esm/icons/message-square';
import CheckIcon from 'lucide-react/dist/esm/icons/check';
import XIcon from 'lucide-react/dist/esm/icons/x';
import PlusCircleIcon from 'lucide-react/dist/esm/icons/plus-circle';
import { CustomIcon, CustomIconFormData } from '../../types/icon';
import { createCustomIcon } from '../../lib/icons';
import { sanitizeSvg } from '../../lib/svgSanitizer';
import { createCustomIconComponent } from '../../data/icons/iconRegistry';
import { SvgSourceInput } from './SvgSourceInput';
import { SvgPreview } from './SvgPreview';

interface GlobalForumIconPickerProps {
  customIcons: CustomIcon[];
  selectedIconId: string | null;
  onSelect: (iconId: string | null) => Promise<void> | void;
  onCreated: () => Promise<void> | void;
  createdBy: string;
  disabled?: boolean;
}

type ActiveTab = 'existing' | 'create';

export const GlobalForumIconPicker: React.FC<GlobalForumIconPickerProps> = ({
  customIcons,
  selectedIconId,
  onSelect,
  onCreated,
  createdBy,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('existing');
  const [name, setName] = useState('');
  const [svgSource, setSvgSource] = useState('');
  const [viewBox, setViewBox] = useState('0 0 24 24');
  const [isSvgValid, setIsSvgValid] = useState(false);
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedIcon = useMemo(() => {
    if (!selectedIconId) return null;
    return customIcons.find((item) => item.id === selectedIconId) || null;
  }, [customIcons, selectedIconId]);

  const SelectedCustomComp = useMemo(() => {
    if (!selectedIcon) return null;
    return createCustomIconComponent(selectedIcon.svg, selectedIcon.viewBox);
  }, [selectedIcon]);

  const handleSvgChange = useCallback(
    (sanitizedSvg: string, sanitizedViewBox?: string, isValid = false) => {
      setSvgSource(sanitizedSvg);
      if (sanitizedViewBox) {
        setViewBox(sanitizedViewBox);
      }
      setIsSvgValid(isValid);
    },
    []
  );

  const handleCreateAndSelect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || creating) return;

    setLocalError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError('O nome do ícone é obrigatório.');
      return;
    }

    const sanitized = sanitizeSvg(svgSource);
    if (!sanitized.ok) {
      setLocalError(sanitized.error);
      return;
    }

    const payload: CustomIconFormData = {
      name: trimmedName.slice(0, 40),
      category: 'community',
      tags: ['forum', 'global', 'icone'],
      svg: sanitized.svg,
      viewBox: sanitized.viewBox,
    };

    setCreating(true);
    try {
      const { id } = await createCustomIcon(payload, createdBy);
      await onCreated();
      await onSelect(id);
      setName('');
      setSvgSource('');
      setViewBox('0 0 24 24');
      setIsSvgValid(false);
      setActiveTab('existing');
    } catch (err) {
      console.error('Error creating and selecting global forum icon:', err);
      setLocalError('Erro ao criar e selecionar o ícone. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Zona 1: Preview do selecionado */}
      <div className="p-4 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-[10px] bg-[var(--bg-default)] border border-[var(--border-default)] flex items-center justify-center shrink-0 text-[var(--brand-primary)]">
            {SelectedCustomComp ? (
              <SelectedCustomComp className="w-[22px] h-[22px]" />
            ) : (
              <MessageSquareIcon className="w-[22px] h-[22px]" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate m-0">
              {selectedIcon ? selectedIcon.name : 'Padrão do sistema'}
            </p>
            <p className="text-xs font-mono text-[var(--text-muted)] truncate m-0 mt-0.5">
              {selectedIconId ? `icons/${selectedIconId}` : 'Padrão do sistema'}
            </p>
          </div>
        </div>

        {selectedIconId !== null && (
          <button
            type="button"
            disabled={disabled || creating}
            onClick={() => onSelect(null)}
            title="Restaurar padrão"
            aria-label="Restaurar padrão"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer disabled:opacity-40"
          >
            <XIcon className="w-3.5 h-3.5" />
            <span>Restaurar padrão</span>
          </button>
        )}
      </div>

      {/* Zona 2: Abas */}
      <div className="flex items-center gap-6 border-b border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setActiveTab('existing')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'existing'
              ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Escolher existente
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${
            activeTab === 'create'
              ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Criar novo SVG
        </button>
      </div>

      {/* Zona 3: Aba Escolher existente */}
      {activeTab === 'existing' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Opção fixa: Padrão */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(null)}
            className={`relative p-3.5 rounded-xl border text-left flex flex-col items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-40 ${
              selectedIconId === null
                ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-focus)]'
            }`}
          >
            {selectedIconId === null && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--brand-primary)] text-[var(--text-on-primary)] flex items-center justify-center">
                <CheckIcon className="w-3 h-3" />
              </span>
            )}
            <div className="w-10 h-10 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] flex items-center justify-center text-[var(--brand-primary)]">
              <MessageSquareIcon className="w-5 h-5" />
            </div>
            <div className="text-center min-w-0 w-full">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate m-0">
                Padrão
              </p>
              <span className="block text-[10px] font-mono text-[var(--text-muted)] truncate">
                Sistema
              </span>
            </div>
          </button>

          {/* Ícones customizados existentes */}
          {customIcons.map((iconItem) => {
            const IconComp = createCustomIconComponent(iconItem.svg, iconItem.viewBox);
            const isSelected = selectedIconId === iconItem.id;

            return (
              <button
                key={iconItem.id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(iconItem.id)}
                title={iconItem.name}
                className={`relative p-3.5 rounded-xl border text-left flex flex-col items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-40 ${
                  isSelected
                    ? 'border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-focus)]'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--brand-primary)] text-[var(--text-on-primary)] flex items-center justify-center">
                    <CheckIcon className="w-3 h-3" />
                  </span>
                )}
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] flex items-center justify-center text-[var(--brand-primary)]">
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="text-center min-w-0 w-full">
                  <p className="text-xs font-semibold text-[var(--text-primary)] truncate m-0">
                    {iconItem.name}
                  </p>
                  <span className="block text-[10px] font-mono text-[var(--text-muted)] truncate">
                    {iconItem.id}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Zona 4: Aba Criar novo SVG */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateAndSelect} className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="global-forum-icon-name"
              className="block text-sm font-semibold text-[var(--text-primary)]"
            >
              Nome do ícone <span className="text-[var(--feedback-error)]">*</span>
            </label>
            <input
              id="global-forum-icon-name"
              type="text"
              required
              maxLength={40}
              disabled={disabled || creating}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Emblema dos Fóruns, Picareta Global"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] text-sm disabled:opacity-50"
            />
            <span className="block text-xs text-[var(--text-muted)]">
              {name.length}/40 caracteres
            </span>
          </div>

          <SvgSourceInput
            value={svgSource}
            disabled={disabled || creating}
            onChange={handleSvgChange}
          />

          {svgSource.trim() && isSvgValid && (
            <SvgPreview svg={svgSource} viewBox={viewBox} name={name || 'Ícone global'} />
          )}

          {localError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] border border-[color-mix(in_srgb,var(--feedback-error)_30%,transparent)] text-xs text-[var(--feedback-error)]"
            >
              {localError}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={disabled || creating || !name.trim() || !isSvgValid}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--bg-default)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
            >
              <PlusCircleIcon className="w-4 h-4" />
              <span>{creating ? 'Criando e selecionando...' : 'Criar e selecionar'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
