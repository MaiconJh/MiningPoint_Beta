import React from 'react';
import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { Footer } from './Footer';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-default)] text-[var(--text-primary)]">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--bg-surface-elevated)] focus:border focus:border-[var(--brand-primary)] focus:rounded-lg focus:text-[var(--text-primary)] focus:text-sm focus:font-semibold focus:shadow-md"
      >
        Pular para o conteúdo principal
      </a>

      <NavBar />

      <main id="conteudo" className="flex-1 flex flex-col pt-24 overflow-x-hidden">
        {children || <Outlet />}
      </main>

      <Footer />
    </div>
  );
};
