import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { listUserBadges } from '../../../lib/profile';
import { SkeletonLine } from '../../skeleton/Skeleton';
import { AccountSectionSkeleton } from '../../skeleton/AccountSectionSkeleton';
import { Chip } from '../../chip/Chip';

const formatDate = (createdAt?: unknown): string => {
  if (!createdAt) return '—';
  let date: Date | null = null;
  if (typeof (createdAt as { toDate?: () => Date }).toDate === 'function') {
    date = (createdAt as { toDate: () => Date }).toDate();
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
    date = new Date(createdAt);
  }
  if (!date || isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const OverviewSection: React.FC = () => {
  const { profile, user, loading } = useAuth();
  const [badgeCount, setBadgeCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    let isMounted = true;

    listUserBadges(user.uid)
      .then((badges) => {
        if (isMounted) {
          setBadgeCount(badges.length);
        }
      })
      .catch((err) => {
        console.error('Failed to load user badges count:', err);
        if (isMounted) {
          setBadgeCount(0);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  if (loading && !profile) {
    return <AccountSectionSkeleton rows={4} />;
  }

  const primaryGroup = profile?.primaryGroup || profile?.group;
  const groupName = primaryGroup?.name || 'Visitante';

  const roleTitle = profile?.featuredTitle?.name || '—';
  const memberSince = formatDate(profile?.createdAt);

  return (
    <section className="rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 flex flex-col">
      <h2 className="font-mono text-[11px] tracking-[0.08em] uppercase text-[var(--text-muted)] font-bold m-0 mb-2">
        Visão geral
      </h2>

      <div className="flex flex-col">
        {/* Grupo */}
        <div className="flex flex-col gap-[3px] py-3 border-b border-[var(--border-subtle)]">
          <span className="text-[11px] text-[var(--text-muted)] font-normal">Grupo</span>
          <div className="pt-0.5">
            {primaryGroup ? (
              <Chip
                label={groupName}
                color={primaryGroup.color}
                style={primaryGroup.chipStyle}
              />
            ) : (
              <span className="text-[14px] font-medium text-[var(--text-primary)]">
                {groupName}
              </span>
            )}
          </div>
        </div>

        {/* Cargo */}
        <div className="flex flex-col gap-[3px] py-3 border-b border-[var(--border-subtle)]">
          <span className="text-[11px] text-[var(--text-muted)] font-normal">Cargo</span>
          <span className={`text-[14px] ${roleTitle === '—' ? 'text-[var(--text-muted)]' : 'font-medium text-[var(--text-primary)]'}`}>
            {roleTitle}
          </span>
        </div>

        {/* Membro desde */}
        <div className="flex flex-col gap-[3px] py-3 border-b border-[var(--border-subtle)]">
          <span className="text-[11px] text-[var(--text-muted)] font-normal">Membro desde</span>
          <span className="text-[14px] font-medium text-[var(--text-primary)]">
            {memberSince}
          </span>
        </div>

        {/* Insígnias */}
        <div className="flex flex-col gap-[3px] py-3">
          <span className="text-[11px] text-[var(--text-muted)] font-normal">Insígnias</span>
          <div className="pt-0.5">
            {badgeCount === null ? (
              <SkeletonLine width={40} height={16} radius="4px" />
            ) : (
              <span className="text-[14px] font-medium text-[var(--text-primary)]">
                {String(badgeCount)}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
