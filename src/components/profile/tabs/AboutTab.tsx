import React from 'react';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';

interface AboutTabProps {
  bio?: string;
  showEditButton?: boolean;
  onEdit?: () => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({
  bio,
  showEditButton = false,
  onEdit,
}) => {
  const hasBio = !!bio && bio.trim() !== '';

  // Sem bio e sem botão: nada a mostrar (perfil público de outro usuário)
  if (!hasBio && !showEditButton) {
    return null;
  }

  return (
    <div className="py-2">
      {hasBio ? (
        <div className="flex gap-3 items-start max-w-2xl">
          <span
            aria-hidden="true"
            className="shrink-0 font-serif text-3xl leading-none text-[var(--brand-primary)] select-none"
          >
            &ldquo;
          </span>
          <p className="text-base italic text-[var(--text-secondary)] leading-relaxed m-0 whitespace-pre-line">
            {bio}
          </p>
        </div>
      ) : (
        <p className="text-base text-[var(--text-muted)] m-0">
          Nenhuma bio definida.
        </p>
      )}

      {showEditButton && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold border border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
        >
          <PencilIcon className="w-3.5 h-3.5" />
          <span>Editar bio</span>
        </button>
      )}
    </div>
  );
};

