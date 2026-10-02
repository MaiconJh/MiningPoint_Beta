import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/profile';
import { Title } from '../../types/title';
import { getTitle } from '../../lib/titles';
import { getAvatarColor, getInitials } from '../../lib/avatar';
import { Shield } from '../admin/Shield';
import { Chip } from '../chip/Chip';
import { ProfileDraftState } from '../../hooks/useProfileDraft';

interface ProfileLivePreviewProps {
  profile: UserProfile;
  draft: ProfileDraftState;
  titlesMap?: Map<string, Title>;
}

export const ProfileLivePreview: React.FC<ProfileLivePreviewProps> = ({
  profile,
  draft,
  titlesMap,
}) => {
  const [imgError, setImgError] = useState(false);
  const [resolvedTitle, setResolvedTitle] = useState<Title | null>(null);

  const currentTitleId = draft.featuredTitleId;

  useEffect(() => {
    if (!currentTitleId) {
      setResolvedTitle(null);
      return;
    }

    if (titlesMap && titlesMap.has(currentTitleId)) {
      setResolvedTitle(titlesMap.get(currentTitleId) || null);
      return;
    }

    let isMounted = true;
    getTitle(currentTitleId)
      .then((t) => {
        if (isMounted) setResolvedTitle(t);
      })
      .catch(() => {
        if (isMounted) setResolvedTitle(null);
      });

    return () => {
      isMounted = false;
    };
  }, [currentTitleId, titlesMap]);

  const displayName = profile.displayName || 'Explorador';
  const primaryGroup = profile.primaryGroup || profile.group || {
    id: 'visitante',
    name: 'Visitante',
    color: '#C2C6CC',
    priority: 10,
    isStaff: false,
    isDefault: true,
    chipStyle: undefined,
  };
  const hasBadge = primaryGroup && primaryGroup.color;

  const displayHandle = draft.handle ? `@${draft.handle}` : `@${profile.shortId}`;

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider m-0">
          Prévia do perfil
        </h3>
        <span className="text-[11px] text-[var(--text-muted)]">
          {draft.visibility === 'private' ? 'Perfil privado' : 'Perfil público'}
        </span>
      </div>

      {/* Simulated Header Card */}
      <div className="rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-xs overflow-hidden">
        {/* Banner with subtle grid overlay */}
        <div className="h-24 w-full bg-[var(--bg-surface-elevated)] border-b border-[var(--border-default)] relative overflow-hidden flex items-center justify-center">
          <svg
            className="absolute inset-0 w-full h-full opacity-15 pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
            width="100%"
            height="100%"
            fill="none"
          >
            <defs>
              <pattern
                id="preview-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 24 0 L 0 0 0 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-[var(--border-strong)]"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#preview-grid)" />
          </svg>
        </div>

        {/* Content Area */}
        <div className="px-5 pb-5 relative">
          <div className="flex items-start gap-3">
            {/* Avatar overlapping banner */}
            <div className="relative shrink-0 w-[54px] h-[54px] -mt-[27px] rounded-full overflow-hidden border-3 border-[var(--bg-surface)] shadow-xs bg-[var(--bg-surface-elevated)] flex items-center justify-center z-10">
              {profile.photoURL && !imgError ? (
                <img
                  src={profile.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  style={{ backgroundColor: getAvatarColor(displayName) }}
                  className="w-full h-full flex items-center justify-center text-base font-bold text-[#F7F7F8]"
                >
                  {getInitials(displayName)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1.5">
              {resolvedTitle && (
                <div className="mb-1">
                  <Chip
                    label={resolvedTitle.name}
                    color={resolvedTitle.color}
                    style={resolvedTitle.chipStyle}
                  />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="text-lg font-bold text-[var(--text-primary)] m-0 leading-snug truncate">
                  {displayName}
                </h4>

                {hasBadge && (
                  <div className="inline-flex items-center gap-1">
                    <Chip
                      label={primaryGroup.name}
                      color={primaryGroup.color}
                      style={primaryGroup.chipStyle}
                    />
                    {profile.isStaff && (
                      <Shield color={primaryGroup.color} />
                    )}
                  </div>
                )}
              </div>

              <div className="text-xs font-mono text-[var(--text-secondary)] mt-0.5">
                {displayHandle}
              </div>

              {draft.bio && (
                <p className="text-xs text-[var(--text-secondary)] mt-2 line-clamp-3 whitespace-pre-line m-0">
                  {draft.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
