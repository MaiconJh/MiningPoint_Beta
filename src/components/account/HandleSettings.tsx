import React, { useState } from 'react';
import CopyIcon from 'lucide-react/dist/esm/icons/copy';
import CheckIcon from 'lucide-react/dist/esm/icons/check';
import AlertTriangleIcon from 'lucide-react/dist/esm/icons/alert-triangle';
import AtSignIcon from 'lucide-react/dist/esm/icons/at-sign';
import { UserProfile } from '../../types/profile';
import { validateHandle, profileUrl } from '../../lib/handle';
import { ConfirmHandleModal } from './ConfirmHandleModal';
import { useToast } from '../../context/ToastContext';

interface HandleSettingsProps {
  profile: UserProfile;
  currentDraftHandle: string | null;
  onUpdateDraftHandle: (newHandle: string) => void;
  className?: string;
}

export const HandleSettings: React.FC<HandleSettingsProps> = ({
  profile,
  currentDraftHandle,
  onUpdateDraftHandle,
  className = 'p-6 flex flex-col gap-6',
}) => {
  const { showToast } = useToast();
  const [inputVal, setInputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingHandle, setPendingHandle] = useState('');

  const currentHandle = profile.handle;
  const hasRedefined = profile.hasRedefinedHandle === true;
  const shortId = profile.shortId;

  const fullProfileUrl = `${window.location.origin}${profileUrl({
    handle: currentDraftHandle,
    shortId,
  })}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullProfileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Realtime validation
  let liveValidationReason: string | null = null;
  if (inputVal.trim().length > 0) {
    const res = validateHandle(inputVal);
    if (!res.valid) {
      liveValidationReason = res.reason;
    }
  }

  const handleApplyClick = (e: React.FormEvent) => {
    e.preventDefault();

    const valResult = validateHandle(inputVal);
    if (!valResult.valid) {
      return;
    }

    const newHandleNormalized = inputVal.trim().toLowerCase();

    if (currentHandle === null) {
      // First definition: Apply directly to draft without modal
      onUpdateDraftHandle(newHandleNormalized);
      setInputVal('');
      showToast('@nick aplicado. Clique em Salvar alterações para confirmar.');
    } else if (!hasRedefined) {
      // Redefinition: Open confirmation modal first
      setPendingHandle(newHandleNormalized);
      setIsModalOpen(true);
    }
  };

  const handleConfirmModal = () => {
    onUpdateDraftHandle(pendingHandle);
    setIsModalOpen(false);
    setInputVal('');
    setPendingHandle('');
    showToast(
      'Redefinição aplicada. Clique em Salvar alterações para confirmar.'
    );
  };

  return (
    <section className={className}>
      <div>
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider m-0 mb-1">
          Identificação pública (@nick)
        </h3>
        <p className="text-xs text-[var(--text-secondary)] m-0">
          Gerencie o seu identificador único na plataforma e o link direto do seu perfil.
        </p>
      </div>

      {/* Info Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current @nick in draft */}
        <div className="p-4 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
            @nick atual
          </span>
          <div className="flex items-center gap-2">
            <AtSignIcon className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
            <span className="font-mono text-sm font-semibold text-[var(--text-primary)] truncate">
              {currentDraftHandle ? `@${currentDraftHandle}` : 'Nenhum @nick definido'}
            </span>
          </div>
        </div>

        {/* ShortId (Read only) */}
        <div className="p-4 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
            ID Curto (Sistema)
          </span>
          <span className="font-mono text-sm font-semibold text-[var(--text-secondary)] select-all">
            {shortId || '---'}
          </span>
        </div>
      </div>

      {/* Profile URL with 1-click copy */}
      <div className="p-4 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
            URL do seu Perfil
          </span>
          <span className="font-mono text-xs text-[var(--text-secondary)] truncate select-all">
            {fullProfileUrl}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyUrl}
          className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--brand-primary)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer self-start sm:self-auto"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-[var(--feedback-success)]" />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <CopyIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span>Copiar URL</span>
            </>
          )}
        </button>
      </div>

      {/* Form / State logic */}
      {hasRedefined ? (
        <div className="p-4 rounded-lg border border-[color-mix(in_srgb,var(--feedback-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--feedback-warning)_10%,transparent)] flex items-start gap-3">
          <AlertTriangleIcon className="w-5 h-5 text-[var(--feedback-warning)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--feedback-warning)] leading-relaxed m-0">
            Você já utilizou sua única redefinição de @nick. Para alterar novamente, solicite ajuda do suporte.
          </p>
        </div>
      ) : (
        <form onSubmit={handleApplyClick} className="flex flex-col gap-4">
          {currentHandle !== null && !hasRedefined && (
            <div className="p-3.5 rounded-lg border border-[color-mix(in_srgb,var(--feedback-warning)_30%,transparent)] bg-[color-mix(in_srgb,var(--feedback-warning)_10%,transparent)] flex items-start gap-3">
              <AlertTriangleIcon className="w-4 h-4 text-[var(--feedback-warning)] shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--feedback-warning)] leading-relaxed m-0">
                Esta é a sua <strong>ÚNICA</strong> redefinição de @nick. Escolha com atenção.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[var(--text-secondary)]">
              {currentHandle === null ? 'Escolha seu @nick' : 'Novo @nick'}
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono text-sm text-[var(--text-muted)] pointer-events-none">
                @
              </span>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value.toLowerCase().trim())}
                placeholder="seunick"
                maxLength={20}
                className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] transition-colors"
              />
            </div>

            {/* Live validation feedback */}
            {liveValidationReason && (
              <span className="text-xs text-[var(--feedback-error)] mt-1">
                {liveValidationReason}
              </span>
            )}
            {!liveValidationReason && inputVal.trim().length >= 3 && (
              <span className="text-xs text-[var(--feedback-success)] mt-1">
                Formato de @nick válido!
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!!liveValidationReason || inputVal.trim().length < 3}
              className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] hover:opacity-90 disabled:opacity-40 text-[var(--text-on-primary)] text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {currentHandle === null ? 'Aplicar @nick' : 'Redefinir @nick'}
            </button>
          </div>
        </form>
      )}

      {/* Confirmation Modal */}
      <ConfirmHandleModal
        isOpen={isModalOpen}
        currentHandle={currentHandle}
        newHandle={pendingHandle}
        onConfirm={handleConfirmModal}
        onCancel={() => setIsModalOpen(false)}
      />
    </section>
  );
};
