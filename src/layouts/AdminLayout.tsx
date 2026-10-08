import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';

type AdminNavLink = { to: string; label: string };
type AdminNavGroup = { id: string; label: string; items: AdminNavLink[] };
type AdminNavEntry =
  | ({ type: 'link' } & AdminNavLink)
  | ({ type: 'group' } & AdminNavGroup);

const NAV_ENTRIES: AdminNavEntry[] = [
  { type: 'link', to: '/admin/visao-geral', label: 'Visão geral' },
  { type: 'link', to: '/admin/usuarios', label: 'Usuários' },
  { type: 'link', to: '/admin/grupos', label: 'Grupos' },
  {
    type: 'group',
    id: 'collectibles',
    label: 'Colecionáveis',
    items: [
      { to: '/admin/insignias', label: 'Insígnias' },
      { to: '/admin/titulos', label: 'Títulos' },
      { to: '/admin/icones', label: 'Ícones custom' },
    ],
  },
  {
    type: 'group',
    id: 'catalogs',
    label: 'Catálogo',
    items: [
      { to: '/admin/raridades', label: 'Raridades' },
      { to: '/admin/categorias', label: 'Categorias' },
      { to: '/admin/origens', label: 'Origens' },
      { to: '/admin/colecoes', label: 'Coleções' },
    ],
  },
  { type: 'link', to: '/admin/forum', label: 'Fórum' },
  { type: 'link', to: '/admin/conteudo', label: 'Conteúdo' },
  { type: 'link', to: '/admin/logs', label: 'Logs' },
  { type: 'link', to: '/admin/configuracao', label: 'Configuração' },
];

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    collectibles: true,
    catalogs: true,
  });

  useEffect(() => {
    NAV_ENTRIES.forEach((entry) => {
      if (entry.type === 'group') {
        const hasActiveChild = entry.items.some(
          (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
        );
        if (hasActiveChild) {
          setOpenGroups((prev) => (prev[entry.id] ? prev : { ...prev, [entry.id]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
          {NAV_ENTRIES.map((entry) => {
            if (entry.type === 'link') {
              return (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] text-[var(--brand-primary)] font-semibold border-l-2 border-[var(--brand-primary)] pl-2.5'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                    }`
                  }
                >
                  {entry.label}
                </NavLink>
              );
            }

            const isOpen = openGroups[entry.id] ?? false;
            const isChildActive = entry.items.some(
              (item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
            );

            return (
              <div key={entry.id} className="pt-2 first:pt-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer select-none"
                >
                  <span className={!isOpen && isChildActive ? 'text-[var(--brand-primary)] font-semibold' : ''}>
                    {entry.label}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="mt-1 space-y-1 pl-2">
                    {entry.items.map((subItem) => (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] text-[var(--brand-primary)] font-semibold border-l-2 border-[var(--brand-primary)] pl-2.5'
                              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]'
                          }`
                        }
                      >
                        {subItem.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
