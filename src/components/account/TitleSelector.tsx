import React, { useState, useEffect } from 'react';
import { Title } from '../../types/title';
import { useAuth } from '../../context/AuthContext';
import { listUserTitles, listTitlesByIds } from '../../lib/titles';
import { SkeletonLine } from '../skeleton/Skeleton';
import { Chip } from '../chip/Chip';

interface TitleSelectorProps {
  currentTitleId: string | null;
  onSelectTitle: (titleId: string | null) => void;
  onTitlesLoaded?: (titlesMap: Map<string, Title>) => void;
}

export const TitleSelector: React.FC<TitleSelectorProps> = ({
  currentTitleId,
  onSelectTitle,
  onTitlesLoaded,
}) => {
  const { user } = useAuth();
  const [userTitles, setUserTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    listUserTitles(user.uid)
      .then(async (userTitleDocs) => {
        if (!isMounted) return;
        const titleIds = userTitleDocs.map((ut) => ut.titleId);
        if (titleIds.length > 0) {
          const titles = await listTitlesByIds(titleIds);
          if (isMounted) {
            setUserTitles(titles);
            const map = new Map<string, Title>();
            titles.forEach((t) => map.set(t.id, t));
            if (onTitlesLoaded) onTitlesLoaded(map);
            setLoading(false);
          }
        } else {
          if (isMounted) {
            setUserTitles([]);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error('Error fetching user titles in TitleSelector:', err);
        if (isMounted) {
          setUserTitles([]);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user?.uid, onTitlesLoaded]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 py-3 border-b border-[var(--border-subtle)]" aria-hidden="true">
        <SkeletonLine width={80} height={11} radius="3px" />
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <SkeletonLine width={60} height={28} radius="6px" />
          <SkeletonLine width={90} height={28} radius="6px" />
        </div>
      </div>
    );
  }

  // When user has zero titles, the row does not appear
  if (userTitles.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 py-3 border-b border-[var(--border-subtle)]">
      <span className="text-xs text-[var(--text-secondary)] font-medium">
        Título exibido
      </span>

      <div className="flex flex-wrap items-center gap-2 mt-1">
        {/* Opção "Nenhum" */}
        <button
          type="button"
          onClick={() => onSelectTitle(null)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            currentTitleId === null
              ? 'ring-2 ring-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--text-primary)]'
              : 'border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)]'
          }`}
        >
          Nenhum
        </button>

        {/* Títulos que o usuário possui */}
        {userTitles.map((t) => {
          const isSelected = currentTitleId === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTitle(t.id)}
              className={`inline-flex items-center justify-center leading-none rounded-full transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--bg-surface)]'
                  : 'hover:opacity-80'
              }`}
            >
              <Chip
                label={t.name}
                color={t.color}
                style={t.chipStyle}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
