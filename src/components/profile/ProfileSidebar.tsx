import React from 'react';
import { UserProfile, UserBadge } from '../../types/profile';

interface ProfileSidebarProps {
  profile: UserProfile;
  userBadges: UserBadge[];
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  profile,
  userBadges,
}) => {
  const attributesSum = profile.attributes
    ? (profile.attributes.exploration || 0) +
      (profile.attributes.gathering || 0) +
      (profile.attributes.knowledge || 0) +
      (profile.attributes.community || 0) +
      (profile.attributes.endurance || 0) +
      (profile.attributes.economy || 0)
    : 0;

  const badgesCount = userBadges.length;

  return (
    <aside
      className="w-full lg:w-[258px] shrink-0 flex flex-col lg:sticky lg:top-[calc(var(--nav-offset)+var(--nav-h)+16px)] lg:self-start"
      aria-label="Resumo do perfil"
    >
      {/* Block 1: Estatísticas */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--brand-secondary)] font-bold m-0">
          Estatísticas
        </h2>
        <div className="flex flex-col">
          <div className="flex flex-col gap-1 pb-3">
            <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)]">
              Qualidades
            </span>
            <span className="font-mono text-[16px] font-bold text-[var(--text-primary)] tabular-nums">
              {attributesSum}
            </span>
          </div>

          <div className="flex flex-col gap-1 pt-3 border-t border-[var(--border-default)]">
            <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)]">
              Insígnias
            </span>
            <span className="font-mono text-[16px] font-bold text-[var(--text-primary)] tabular-nums">
              {badgesCount}
            </span>
          </div>
        </div>
      </section>

      {/* Block 2: Reputação */}
      <section className="pt-4 mt-4 border-t border-[var(--border-default)] flex flex-col gap-3">
        <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--brand-secondary)] font-bold m-0">
          Reputação
        </h2>
        <p className="text-sm text-[var(--text-secondary)] m-0">
          Nenhuma reputação ainda
        </p>
      </section>
    </aside>
  );
};
