import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../types/profile';
import { Title } from '../../types/title';
import { Chip } from '../chip/Chip';
import { getAvatarColor, getInitials } from '../../lib/avatar';

export interface MemberCardProps {
  member: UserProfile;
  titles?: Title[];
}

export const MemberCard: React.FC<MemberCardProps> = ({
  member,
  titles = [],
}) => {
  const profileSlug = member.shortId ?? member.uid;
  const avatarBgColor = !member.photoURL
    ? getAvatarColor(member.displayName || member.uid)
    : undefined;

  const hasGroupChip = Boolean(member.primaryGroup);
  const hasTitleChips = Array.isArray(titles) && titles.length > 0;
  const hasChips = hasGroupChip || hasTitleChips;

  return (
    <div className="w-full h-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[14px] p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:shadow-lg">
      {/* Avatar circular de 64px */}
      <Link
        to={`/perfil/${profileSlug}`}
        className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-[var(--bg-surface-elevated)] flex items-center justify-center transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] outline-none"
        style={{ backgroundColor: avatarBgColor }}
        aria-label={`Ver perfil de ${member.displayName || 'membro'}`}
      >
        {member.photoURL ? (
          <img
            src={member.photoURL}
            alt={member.displayName || 'Avatar'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-lg font-bold text-[var(--text-primary)]">
            {getInitials(member.displayName)}
          </span>
        )}
      </Link>

      {/* Nome do membro */}
      <Link
        to={`/perfil/${profileSlug}`}
        className="text-[14.5px] font-semibold text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors mt-3 line-clamp-1 max-w-full break-words focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-xs outline-none"
        title={member.displayName}
      >
        {member.displayName}
      </Link>

      {/* Chips de grupo e títulos */}
      {hasChips && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
          {/* Chip do grupo primário */}
          {member.primaryGroup && (
            <Chip
              label={member.primaryGroup.name}
              color={member.primaryGroup.color}
              style={member.primaryGroup.chipStyle}
            />
          )}

          {/* Chips dos títulos */}
          {titles.map((title) => (
            <Chip
              key={title.id}
              label={title.name}
              color={title.color}
              style={title.chipStyle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
