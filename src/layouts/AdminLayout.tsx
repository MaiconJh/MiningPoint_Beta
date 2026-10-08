import React, { useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';

interface AdminNavItem {
  to: string;
  label: string;
}

const NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin/visao-geral', label: 'Visão geral' },
  { to: '/admin/usuarios', label: 'Usuários' },
  { to: '/admin/grupos', label: 'Grupos' },
  { to: '/admin/insignias', label: 'Insígnias' },
  { to: '/admin/icones', label: 'Ícones custom' },
  { to: '/admin/titulos', label: 'Títulos' },
  { to: '/admin/raridades', label: 'Raridades' },
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/origens', label: 'Origens' },
  { to: '/admin/colecoes', label: 'Coleções' },
  { to: '/admin/forum', label: 'Fórum' },
  { to: '/admin/conteudo', label: 'Conteúdo' },
  { to: '/admin/logs', label: 'Logs' },
  { to: '/admin/configuracao', label: 'Configuração' },
];

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-default)] text-[var(--text-primary)] flex flex-col lg:flex-row">
      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-[var(--bg-surface)] border-b border-[var(--border-default)] sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Link to="/" className="font-bold text-lg text-[var(--text-primary)] tracking-wide">
            MiningPoint
          </Link>
          <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[var(--text-muted)] border border-[var(--border-default)]">
            Admin
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
        >
          {mobileOpen ? (
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          )}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[var(--bg-overlay)] z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: Fixed 240px on lg+, drawer on mobile */}
      <aside
        className={`fixed inset-y-0 left-0 w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-default)] flex flex-col z-40 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--border-default)] shrink-0">
          <Link
            to="/"
            className="font-bold text-lg tracking-[0.02em] text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors"
          >
            MiningPoint
          </Link>
          <span className="text-[11px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] text-[var(--brand-primary)] border border-[var(--border-default)]">
            Admin
          </span>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto" aria-label="Navegação administrativa">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] text-[var(--brand-primary)] font-semibold border-l-2 border-[var(--brand-primary)] pl-2.5'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer: Voltar ao site */}
        <div className="p-4 border-t border-[var(--border-default)] shrink-0">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors"
          >
            <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Voltar ao site</span>
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 lg:pl-[240px] flex flex-col min-h-screen">
        <main className="flex-1 p-6 sm:p-8 max-w-[1200px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
