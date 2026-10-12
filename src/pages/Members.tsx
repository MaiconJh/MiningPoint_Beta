import React from 'react';
import { useMembers } from '../hooks/useMembers';
import { MemberFilters } from '../components/members/MemberFilters';
import { MemberList } from '../components/members/MemberList';

export const Members: React.FC = () => {
  const {
    members,
    groups,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    searchQuery,
    setSearchQuery,
    selectedGroupId,
    setSelectedGroupId,
    sortMode,
    setSortMode,
    loadMore,
    userTitlesMap,
    clearFilters,
  } = useMembers();

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedGroupId);

  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-8">
        Membros
      </h1>

      {error ? (
        <div
          role="alert"
          className="p-4 rounded-xl border border-[var(--feedback-error)] bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] text-[var(--feedback-error)] text-sm font-medium mb-6"
        >
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 items-start">
        <MemberFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedGroupId={selectedGroupId}
          onGroupChange={setSelectedGroupId}
          sortMode={sortMode}
          onSortChange={setSortMode}
          groups={groups}
          memberCount={members.length}
        />
        <MemberList
          members={members}
          userTitlesMap={userTitlesMap}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>
    </div>
  );
};
