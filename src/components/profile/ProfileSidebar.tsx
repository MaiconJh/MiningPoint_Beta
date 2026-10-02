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
      className="w-full lg:w-[258px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-[calc(var(--nav-offset)+var(--nav-h)+24px)] lg:self-start"
      aria-label="Resumo do perfil"
    >
      {/* Block 1: Estatísticas */}
      <section className="p-4 rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col gap-3">
        <h4 className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--brand-secondary)] font-bold m-0">
          Estatísticas
        </h4>
        <div className="flex flex-col gap-2">
          <div className="p-3 px-4 rounded-[8px] border border-[var(--border-default)] bg-[var(--bg-default)] flex flex-col gap-1">
            <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)]">
              Qualidades
            </span>
            <span className="font-mono text-[16px] font-bold text-[var(--text-primary)] tabular-nums">
              {attributesSum}
            </span>
          </div>

          <div className="p-3 px-4 rounded-[8px] border border-[var(--border-default)] bg-[var(--bg-default)] flex flex-col gap-1">
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
      <section className="p-4 rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] flex flex-col gap-3">
        <h4 className="font-mono text-[11px] tracking-[0.14em] uppercase text-[var(--brand-secondary)] font-bold m-0">
          Reputação
        </h4>
        <p className="text-sm text-[var(--text-secondary)] m-0">
          Nenhuma reputação ainda
        </p>
      </section>
    </aside>
  );
};
