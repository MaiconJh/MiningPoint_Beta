import React from 'react';

export type ProfileTabId = 'feed' | 'sobre' | 'qualidades' | 'historico';

interface TabItem {
  id: ProfileTabId;
  label: string;
}

interface ProfileTabsProps {
  activeTab: ProfileTabId;
  onChangeTab: (tab: ProfileTabId) => void;
  ownMode: boolean;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onChangeTab,
}) => {
  const tabs: TabItem[] = [
    { id: 'feed', label: 'Feed' },
    { id: 'sobre', label: 'Sobre' },
    { id: 'qualidades', label: 'Qualidades' },
    { id: 'historico', label: 'Histórico' },
  ];

  return (
    <div className="mt-6 px-6 border-b border-[var(--border-default)]">
      <div className="flex flex-wrap items-center gap-1" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`py-3 px-4 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
                isActive
                  ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
