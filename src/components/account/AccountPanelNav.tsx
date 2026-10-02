import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  name: string;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Visão geral', path: '/conta/visao-geral' },
  { name: 'Perfil', path: '/conta/perfil' },
  { name: 'Preferências', path: '/conta/preferencias' },
];

export const AccountPanelNav: React.FC = () => {
  return (
    <>
      {/* Mobile/Tablet: Horizontal scrollable tab strip (<1024px) */}
      <div className="lg:hidden w-full overflow-x-auto border-b border-[var(--border-default)] mb-6 scrollbar-none">
        <nav className="flex items-center gap-1 min-w-max" aria-label="Navegação do painel da conta">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `py-3 px-4 text-sm font-semibold transition-colors whitespace-nowrap border-b-2 -mb-px ${
                  isActive
                    ? 'text-[var(--brand-primary)] border-[var(--brand-primary)]'
                    : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Desktop: 240px vertical side nav (>=1024px) */}
      <aside className="hidden lg:block w-[240px] shrink-0" aria-label="Navegação lateral da conta">
        <nav className="flex flex-col gap-1 rounded-[12px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 rounded-[8px] text-sm transition-colors border-l-2 ${
                  isActive
                    ? 'border-[var(--brand-primary)] text-[var(--text-primary)] font-semibold bg-[var(--bg-surface-elevated)]'
                    : 'border-transparent text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};
