import React, { useState, useEffect } from 'react';
import { searchUsers, SearchUserResult } from '../../lib/badges';
import { getAvatarColor, getInitials } from '../../lib/avatar';

interface UserSearchProps {
  existingUserIds: Set<string>;
  onSelectUser: (user: SearchUserResult) => Promise<void>;
  granting?: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  existingUserIds,
  onSelectUser,
  granting = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!term) {
      setResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchUsers(term);
        setResults(found);
      } catch (err) {
        console.error('Error during user search:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--brand-primary)] text-sm"
        />
        {searching && (
          <span className="absolute right-3 top-2.5 text-xs text-[var(--text-muted)]">
            Buscando...
          </span>
        )}
      </div>

      {results.length > 0 && (
        <div className="divide-y divide-[var(--border-subtle)] border border-[var(--border-default)] rounded-lg bg-[var(--bg-surface-elevated)] max-h-60 overflow-y-auto">
          {results.map((u) => {
            const alreadyHas = existingUserIds.has(u.uid);

            return (
              <div
                key={u.uid}
                className="flex items-center justify-between p-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    style={{ backgroundColor: getAvatarColor(u.displayName) }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[var(--text-on-primary)] shrink-0 overflow-hidden"
                  >
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(u.displayName)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate m-0">
                      {u.displayName}
                    </p>
                    {u.email && (
                      <p className="text-xs text-[var(--text-secondary)] truncate m-0">
                        {u.email}
                      </p>
                    )}
                  </div>
                </div>

                {alreadyHas ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[var(--bg-default)] text-[var(--text-muted)] shrink-0">
                    Já tem
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={granting}
                    onClick={() => onSelectUser(u)}
                    className="px-3 py-1 rounded-md text-xs font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    Conceder
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
