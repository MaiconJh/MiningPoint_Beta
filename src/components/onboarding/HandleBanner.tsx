import React from 'react';
import { Link } from 'react-router-dom';
import AtSignIcon from 'lucide-react/dist/esm/icons/at-sign';
import { UserProfile } from '../../types/profile';

interface HandleBannerProps {
  profile: UserProfile;
}

export const HandleBanner: React.FC<HandleBannerProps> = ({ profile }) => {
  if (profile.handle !== null) {
    return null;
  }

  return (
    <div className="m-4 sm:m-6 p-4 sm:p-5 rounded-[12px] bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-lg bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)] shrink-0 mt-0.5 sm:mt-0">
          <AtSignIcon className="w-5 h-5" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-2xl">
          Escolha o seu @nick com calma. Ele aparece na URL do seu perfil e ajuda
          as pessoas a encontrarem você. Você poderá alterá-lo uma única vez;
          depois disso, terá que abrir um ticket de suporte no site.
        </p>
      </div>

      <Link
        to="/conta/perfil"
        className="shrink-0 px-4 py-2 rounded-lg bg-[var(--brand-primary)] hover:opacity-90 text-[var(--bg-default)] text-xs font-bold uppercase tracking-wider transition-opacity self-end sm:self-center"
      >
        Definir @nick
      </Link>
    </div>
  );
};
