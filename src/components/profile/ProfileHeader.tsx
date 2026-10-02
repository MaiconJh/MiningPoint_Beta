import React, { useState, useEffect } from 'react';
import { UserProfile } from '../../types/profile';
import { Title } from '../../types/title';
import { getTitle } from '../../lib/titles';
import { getAvatarColor, getInitials } from '../../lib/avatar';
import { Shield } from '../admin/Shield';
import { Chip } from '../chip/Chip';
import { profileUrl } from '../../lib/handle';
import Share2Icon from 'lucide-react/dist/esm/icons/share-2';
import CheckIcon from 'lucide-react/dist/esm/icons/check';

interface ProfileHeaderProps {
  profile: UserProfile;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile }) => {
  const [imgError, setImgError] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resolvedTitle, setResolvedTitle] = useState<Title | null>(
    profile.featuredTitle || null
  );

  const handleShareProfile = () => {
    const url = `${window.location.origin}${profileUrl(profile)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    if (profile.featuredTitle) {
      setResolvedTitle(profile.featuredTitle);
    } else if (profile.featuredTitleId) {
      let isMounted = true;
      getTitle(profile.featuredTitleId)
        .then((t) => {
          if (isMounted) setResolvedTitle(t);
        })
        .catch(() => {
          if (isMounted) setResolvedTitle(null);
        });
      return () => {
        isMounted = false;
      };
    } else {
      setResolvedTitle(null);
    }
  }, [profile.featuredTitle, profile.featuredTitleId]);

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

  return (
    <div className="relative z-20 px-6 pt-0 pb-0">
      <div className="flex items-start gap-4">
        {/* Avatar: 60px diameter, -30px top margin overlapping banner */}
        <div className="relative shrink-0 w-[60px] h-[60px] -mt-[30px] rounded-full overflow-hidden border-4 border-[var(--bg-default)] shadow-[0_0_0_1px_var(--border-default)] bg-[var(--bg-surface-elevated)] flex items-center justify-center z-30">
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
              className="w-full h-full flex items-center justify-center text-lg font-bold text-[#F7F7F8]"
            >
              {getInitials(displayName)}
            </div>
          )}
        </div>

        {/* Identity: Featured Title above Name, Name, Group Badge + Shield */}
        <div className="flex-1 min-w-0 pt-2">
          {resolvedTitle && (
            <div className="mb-1">
              <Chip
                label={resolvedTitle.name}
                color={resolvedTitle.color}
                style={resolvedTitle.chipStyle}
                className="text-base"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] m-0 leading-tight truncate">
              {displayName}
            </h1>
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

          <div className="flex flex-wrap items-center gap-3 mt-1">
            {profile.handle && (
              <div className="text-xs font-mono text-[var(--text-secondary)]">
                @{profile.handle}
              </div>
            )}

            <button
              type="button"
              onClick={handleShareProfile}
              title="Copiar link do perfil"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckIcon className="w-3 h-3 text-emerald-400" />
                  <span>Link copiado!</span>
                </>
              ) : (
                <>
                  <Share2Icon className="w-3 h-3" />
                  <span>Compartilhar perfil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
