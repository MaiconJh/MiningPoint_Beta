import React, { useCallback, useEffect, useRef, useState, useLayoutEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Info,
  Calendar,
  Users,
  MessageSquare,
  ShoppingBag,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  Settings,
  Shield,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAvatarColor, getInitials } from '../lib/avatar';
import { NAVIGATION_ITEMS, NavigationItem } from '../data/navigation';

/**
 * NavBar — pill flutuante fixa com auto-hide ao rolar.
 *
 * Regras de auto-hide:
 * - Esconde ao rolar para baixo após 80px.
 * - Reaparece ao rolar para cima, em qualquer posição.
 * - NUNCA esconde enquanto o menu do usuário estiver aberto.
 * - NUNCA esconde enquanto a navegação estiver sendo controlada por teclado
 *   (`:focus-visible` em elemento dentro da nav) — a11y.
 * - NUNCA esconde com campo de formulário focado (teclado mobile).
 * - Foco por clique do mouse NÃO trava o auto-hide (era a causa do bug
 *   "a navbar só some ao clicar fora").
 */
export const NavBar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOutUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navRef = useRef<HTMLElement>(null);
  const navGroupRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const userMenuContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });
  const [isHidden, setIsHidden] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const lastScrollY = useRef(0);

  const userEmail = (user?.email || profile?.email || '').toLowerCase().trim();
  const isOwnerAdmin = userEmail === 'maiconhansen3@gmail.com';
  const canAccessPanel =
    !profile?.isBanned &&
    (isOwnerAdmin ||
      profile?.primaryGroupId === 'admin' ||
      profile?.isStaff === true ||
      !!profile?.effectivePermissions?.accessPanel);

  /* ---------- Indicador deslizante ---------- */

  const updateIndicator = useCallback(() => {
    if (!navGroupRef.current) return;
    const currentPath = location.pathname;
    let activeKey = currentPath;

    if (!linkRefs.current.has(activeKey)) {
      const item = NAVIGATION_ITEMS.find((nav) =>
        nav.path === '/' ? currentPath === '/' : currentPath.startsWith(nav.path),
      );
      if (item) activeKey = item.path;
    }

    const activeEl = linkRefs.current.get(activeKey);
    if (activeEl && navGroupRef.current) {
      const parentRect = navGroupRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: activeRect.left - parentRect.left,
        width: activeRect.width,
        opacity: 1,
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [location.pathname]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const handleResize = () => updateIndicator();
    window.addEventListener('resize', handleResize);
    if (document.fonts?.ready) {
      document.fonts.ready.then(updateIndicator);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [updateIndicator]);

  /* ---------- Menu do usuário ---------- */

  // Hover: só dispara para mouse. Toque/caneta usam o click.
  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMenuOpen(true);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    // 220ms cobre o gap de 10px entre o avatar e o dropdown.
    closeTimerRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      closeTimerRef.current = null;
    }, 220);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMenuOpen((prev) => !prev);
  };

  // Fecha ao sair do container (Tab, clique fora, etc.)
  const handleBlurCapture = (e: React.FocusEvent) => {
    if (!userMenuContainerRef.current?.contains(e.relatedTarget as Node)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        userMenuContainerRef.current &&
        !userMenuContainerRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isMenuOpen) return;
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        avatarButtonRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isMenuOpen]);

  /* ---------- Auto-hide ao rolar ---------- */

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY <= 80) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      // Menu aberto: nunca esconder.
      if (isMenuOpen) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      // Foco por teclado dentro da nav: nunca esconder (a11y).
      // Foco por clique do mouse NÃO conta — era o bug que travava o auto-hide
      // depois de clicar num link.
      const active = document.activeElement as HTMLElement | null;
      const navHasKeyboardFocus =
        !!active &&
        navRef.current?.contains(active) === true &&
        active.matches(':focus-visible');

      if (navHasKeyboardFocus) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      // Teclado mobile: não esconder com campo de formulário focado.
      const isFormField =
        !!active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName);
      if (isFormField) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      if (Math.abs(delta) < 8) return;

      setIsHidden(delta > 0);
      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuOpen]);

  /* ---------- Helpers ---------- */

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (!dropdownRef.current) return;
    const items = Array.from(
      dropdownRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Tab') {
      setIsMenuOpen(false);
    }
  };

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  const handleSignOut = async () => {
    setIsMenuOpen(false);
    await signOutUser();
    navigate('/');
  };

  const renderIcon = (name: NavigationItem['iconName']) => {
    switch (name) {
      case 'home':
        return <Home size={16} />;
      case 'about':
        return <Info size={16} />;
      case 'events':
        return <Calendar size={16} />;
      case 'members':
        return <Users size={16} />;
      case 'forum':
        return <MessageSquare size={16} />;
      case 'shop':
        return <ShoppingBag size={16} />;
    }
  };

  const displayName = profile?.displayName || user?.displayName || 'Minha Conta';
  const avatarUrl = profile?.photoURL || user?.photoURL || '';
  const avatarColor = getAvatarColor(userEmail || displayName);
  const initials = getInitials(displayName);

  /* ---------- Render ---------- */

  return (
    <nav
      ref={navRef}
      aria-label="Navegação principal"
      onFocusCapture={() => setIsHidden(false)}
      className={`nav-pill-fallback fixed top-[var(--nav-offset)] inset-x-0 mx-auto z-40 flex items-center gap-1 sm:gap-2 w-fit max-w-[calc(100vw-32px)] h-14 px-2 rounded-full border border-[color-mix(in_srgb,var(--border-default)_55%,transparent)] bg-[color-mix(in_srgb,var(--bg-surface-elevated)_72%,transparent)] backdrop-blur-xl shadow-xl transition-[transform,opacity] duration-300 ${
        isHidden
          ? '-translate-y-[calc(100%_+_var(--nav-offset))] opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Brand */}
      <Link
        to="/"
        aria-label="MiningPoint — início"
        className="flex items-center gap-2 pl-1 pr-2 shrink-0 rounded-full cursor-pointer transition-opacity duration-150 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--brand-primary)] text-[var(--text-on-primary)] text-[11px] font-bold tracking-wide">
          MP
        </span>
        <span className="hidden sm:inline text-[13.5px] font-semibold tracking-tight text-[var(--text-primary)]">
          MiningPoint
        </span>
      </Link>

      <span
        className="w-px h-6 bg-[color-mix(in_srgb,var(--border-default)_70%,transparent)] shrink-0"
        aria-hidden="true"
      />

      {/* Links + indicador deslizante */}
      <div ref={navGroupRef} className="relative flex items-center gap-1">
        <span
          className="pointer-events-none absolute top-1/2 -mt-4 h-8 rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_16%,transparent)] border border-[color-mix(in_srgb,var(--brand-primary)_28%,transparent)] transition-[left,width,opacity] duration-[250ms] ease-out"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
            opacity: indicatorStyle.opacity,
          }}
          aria-hidden="true"
        />
        {NAVIGATION_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            ref={(el) => {
              if (el) linkRefs.current.set(item.path, el);
              else linkRefs.current.delete(item.path);
            }}
            className={({ isActive }) =>
              `relative z-[1] inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12.5px] font-medium cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] ${
                isActive
                  ? 'text-[var(--brand-primary)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent)]'
              }`
            }
          >
            <span className="shrink-0">{renderIcon(item.iconName)}</span>
            <span className="hidden md:inline">{item.name}</span>
          </NavLink>
        ))}
      </div>

      <span
        className="w-px h-6 bg-[color-mix(in_srgb,var(--border-default)_70%,transparent)] shrink-0"
        aria-hidden="true"
      />

      {/* Ações */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          className="grid h-9 w-9 place-items-center rounded-full cursor-pointer text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] hover:text-[var(--brand-primary)] active:scale-95 transition-[color,background-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Entrar ou menu do usuário */}
      {!user ? (
        <Link
          to="/entrar"
          title="Entrar"
          aria-label="Entrar na conta"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12.5px] font-medium cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] transition-colors duration-150 shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
        >
          <LogIn size={16} />
          <span className="hidden md:inline">Entrar</span>
        </Link>
      ) : (
        <div
          ref={userMenuContainerRef}
          className="relative shrink-0"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onBlurCapture={handleBlurCapture}
        >
          <button
            ref={avatarButtonRef}
            type="button"
            onClick={handleAvatarClick}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="Abrir menu da conta"
            className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--border-default)_70%,transparent)] cursor-pointer text-[11px] font-bold text-[var(--text-on-primary)] transition-[border-color,transform] duration-150 hover:border-[var(--border-focus)] hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
            style={{ backgroundColor: avatarUrl && !avatarImgError ? undefined : avatarColor }}
          >
            {avatarUrl && !avatarImgError ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={() => setAvatarImgError(true)}
              />
            ) : (
              initials
            )}
          </button>

          {isMenuOpen && (
            <>
              {/* Ponte invisível para o mouse atravessar o gap de 10px */}
              <span
                aria-hidden="true"
                className="absolute right-0 top-full h-[10px] w-56"
              />
              <div
                ref={dropdownRef}
                role="menu"
                aria-label="Menu da conta"
                onKeyDown={handleDropdownKeyDown}
                className="dialog-transition absolute right-0 top-[calc(100%+10px)] w-56 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-1.5 shadow-[var(--sombra-1)]"
              >
                <div className="flex items-center gap-2 px-2 py-2">
                  <span
                    className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold text-[var(--text-on-primary)]"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initials}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-[var(--text-primary)]">
                      {displayName}
                    </div>
                    <div className="truncate text-[10.5px] text-[var(--text-muted)]">
                      {userEmail}
                    </div>
                  </div>
                </div>

                <div className="my-1 h-px bg-[var(--border-default)]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate('/perfil')}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs cursor-pointer text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
                >
                  <UserIcon size={14} />
                  Perfil
                </button>

                {canAccessPanel && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleNavigate('/admin')}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs cursor-pointer text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
                  >
                    <Shield size={14} />
                    Painel
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleNavigate('/conta')}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs cursor-pointer text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)]"
                >
                  <Settings size={14} />
                  Configurações
                </button>

                <div className="my-1 h-px bg-[var(--border-default)]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs cursor-pointer text-[var(--feedback-error)] hover:bg-[color-mix(in_srgb,var(--feedback-error)_14%,transparent)] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--feedback-error)]"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
};