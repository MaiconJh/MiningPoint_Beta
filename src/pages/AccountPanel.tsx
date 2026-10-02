import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { AccountPanelNav } from '../components/account/AccountPanelNav';
import { OverviewSection } from '../components/account/sections/OverviewSection';
import { ProfileSection } from '../components/account/sections/ProfileSection';
import { PreferencesSection } from '../components/account/sections/PreferencesSection';

export const AccountPanel: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/$/, '');

  if (pathname === '/conta') {
    return <Navigate to="/conta/visao-geral" replace />;
  }

  const renderSection = () => {
    switch (pathname) {
      case '/conta/perfil':
        return <ProfileSection />;
      case '/conta/preferencias':
        return <PreferencesSection />;
      case '/conta/visao-geral':
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
      {/* Header with back arrow to /perfil */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/perfil"
          className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors"
          aria-label="Voltar para o perfil"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px]"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] m-0 leading-tight">
          Conta
        </h1>
      </div>

      {/* Two-column layout: Nav on left, Section content on right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <AccountPanelNav />

        <main className="flex-1 max-w-[860px] w-full min-w-0" id="account-panel-content">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};
