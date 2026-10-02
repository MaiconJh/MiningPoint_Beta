import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getAvatarColor, getInitials } from '../lib/avatar';
import { NAVIGATION_ITEMS, NavigationItem } from '../data/navigation';

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
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({ left: 0, width: 0, opacity: 0 });

  const [isHidden, setIsHidden] = useState(false);
  const [isFocusInside, setIsFocusInside] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  const canAccessPanel = !!profile?.effectivePermissions?.accessPanel;

  // Position the sliding indicator
  const updateIndicator = () => {
    if (!navGroupRef.current) return;
    const currentPath = location.pathname;

    let activeKey = currentPath;
    if (!linkRefs.current.has(activeKey)) {
      const item = NAVIGATION_ITEMS.find((nav) =>
        nav.path === '/' ? currentPath === '/' : currentPath.startsWith(nav.path)
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
  };

  useLayoutEffect(() => {
    updateIndicator();
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      updateIndicator();
    };

    window.addEventListener('resize', handleResize);
    if (document.fonts?.ready) {
      document.fonts.ready.then(updateIndicator);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname]);

  // Dropdown hover & timer handlers
  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      closeTimerRef.current = null;
    }, 120);
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    // For touch devices or manual click toggle
    e.stopPropagation();
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMenuOpen((prev) => !prev);
  };

  const handleFocusCapture = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsMenuOpen(true);
  };

  const handleBlurCapture = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!userMenuContainerRef.current?.contains(e.relatedTarget as Node)) {
      setIsMenuOpen(false);
    }
  };

  // Keyboard navigation & outside click
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
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isMenuOpen]);

  // Auto-hide on scroll past 80px
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (currentY <= 80) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      if (isFocusInside || isMenuOpen || navRef.current?.contains(document.activeElement)) {
        setIsHidden(false);
        lastScrollY.current = currentY;
        return;
      }

      if (Math.abs(delta) < 8) return;

      if (delta > 0 && currentY > 80) {
        setIsHidden(true);
      } else if (delta < 0) {
        setIsHidden(false);
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFocusInside, isMenuOpen]);

  const handleDropdownKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!dropdownRef.current) return;
    const items = Array.from(
      dropdownRef.current.querySelectorAll<HTMLElement>('[role="menuitem"]')
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      items[prevIndex]?.focus();
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
        return (
          <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'about':
        return (
          <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 7v14" />
            <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
          </svg>
        );
      case 'events':
        return (
          <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
          </svg>
        );
      case 'members':
        return (
          <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'forum':
        return (
          <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'shop':
        return (
          <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        );
    }
  };

  const displayName = profile?.displayName || user?.displayName || 'Minha Conta';

  return (
    <nav
      ref={navRef}
      aria-label="Navegação principal"
      onFocusCapture={() => {
        setIsFocusInside(true);
        setIsHidden(false);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsFocusInside(false);
        }
      }}
      className={`nav-pill-fallback fixed top-4 inset-x-0 mx-auto z-40 flex items-center gap-1 sm:gap-2 w-fit max-w-[calc(100vw-32px)] h-14 px-2 rounded-full border border-[color-mix(in_srgb,var(--border-default)_55%,transparent)] bg-[color-mix(in_srgb,var(--bg-surface-elevated)_72%,transparent)] backdrop-blur-xl shadow-lg transition-[transform,opacity] duration-300 ${
        isHidden ? '-translate-y-[calc(100%+32px)] opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      {/* Brand left */}
      <Link
        to="/"
        className="inline-flex items-center h-10 px-2 sm:px-3 rounded-full text-[var(--text-primary)] hover:text-[var(--brand-primary-hover)] font-bold text-base tracking-wide transition-colors shrink-0"
        aria-label="MiningPoint — página inicial"
      >
        <span className="hidden sm:inline">MiningPoint</span>
        <span className="sm:hidden font-mono text-sm tracking-wider font-bold text-[var(--brand-primary)]">MP</span>
      </Link>

      {/* Nav items + sliding indicator */}
      <div ref={navGroupRef} className="relative flex items-center min-w-0">
        <span
          className="absolute inset-y-0 my-auto h-10 rounded-full bg-[var(--brand-primary)] pointer-events-none transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-0"
          style={{
            transform: `translateX(${indicatorStyle.left}px)`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
          }}
          aria-hidden="true"
        />

        <ul className="flex items-center gap-0.5 sm:gap-1 m-0 p-0 list-none min-w-0">
          {NAVIGATION_ITEMS.map((item) => (
            <li key={item.path} className="shrink-0">
              <NavLink
                to={item.path}
                ref={(el) => {
                  if (el) linkRefs.current.set(item.path, el);
                  else linkRefs.current.delete(item.path);
                }}
                className={({ isActive }) =>
                  `relative z-10 inline-flex items-center gap-2 h-10 rounded-full text-sm font-medium transition-colors whitespace-nowrap px-2.5 max-lg:px-0 max-lg:w-9 max-lg:justify-center ${
                    isActive
                      ? 'text-[var(--text-on-primary)] font-semibold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)]'
                  }`
                }
                title={item.name}
              >
                <span className="inline-flex items-center justify-center shrink-0 w-[18px] h-[18px]">
                  {renderIcon(item.iconName)}
                </span>
                <span className="max-lg:sr-only">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <span className="shrink-0 w-px h-5 mx-0.5 sm:mx-1 bg-[var(--border-default)]" aria-hidden="true" />

      {/* Theme toggle right */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
        aria-pressed={theme === 'light'}
        className="inline-flex items-center justify-center shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] transition-colors cursor-pointer"
      >
        {theme === 'dark' ? (
          <svg className="w-[18px] h-[18px] fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ) : (
          <svg className="w-[18px] h-[18px] fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        )}
      </button>

      {/* Admin Gear Icon (When user has accessPanel === true) */}
      {user && canAccessPanel && (
        <Link
          to="/admin"
          aria-label="Painel administrativo"
          title="Painel administrativo"
          className="inline-flex items-center justify-center shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] transition-colors cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px]"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      )}

      {/* Auth state: Entrar link or user avatar dropdown */}
      {!user ? (
        <Link
          to="/entrar"
          className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 max-lg:px-0 max-lg:w-9 max-lg:justify-center rounded-full text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_8%,transparent)] transition-colors shrink-0"
          title="Entrar"
        >
          <span className="inline-flex items-center justify-center shrink-0 w-[18px] h-[18px]">
            <svg className="w-[18px] h-[18px] fill-none stroke-current stroke-[1.75] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </span>
          <span className="max-lg:sr-only">Entrar</span>
        </Link>
      ) : (
        <div
          ref={userMenuContainerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocusCapture={handleFocusCapture}
          onBlurCapture={handleBlurCapture}
          className="relative shrink-0"
        >
          <button
            ref={avatarButtonRef}
            type="button"
            onClick={handleAvatarClick}
            aria-haspopup="menu"
            aria-expanded={isMenuOpen}
            aria-label="Menu do usuário"
            className="relative inline-flex items-center justify-center shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border border-[var(--border-default)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
          >
            {user.photoURL && !avatarImgError ? (
              <img
                src={user.photoURL}
                alt={displayName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                style={{ backgroundColor: getAvatarColor(user.displayName) }}
                /* Texto fixo de alto contraste sobre o avatar colorido gerado dinamicamente */
                /* eslint-disable-next-line design-tokens/no-raw-color-literals */
                className="w-full h-full flex items-center justify-center text-xs font-bold text-[#F7F7F8]"
              >
                {getInitials(user.displayName)}
              </div>
            )}
          </button>

          {/* User dropdown menu: Animated entrance (160ms), Instant exit */}
          <div
            ref={dropdownRef}
            role="menu"
            aria-label="Menu da conta"
            onKeyDown={handleDropdownKeyDown}
            className={`absolute right-0 top-full mt-2 w-56 min-w-[200px] rounded-[8px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5 shadow-lg z-50 origin-top-right motion-reduce:transition-none ${
              isMenuOpen
                ? 'opacity-100 translate-y-0 scale-100 visible pointer-events-auto transition-[opacity,transform] duration-160 ease-[cubic-bezier(0.16,1,0.3,1)]'
                : 'opacity-0 -translate-y-1 scale-97 invisible pointer-events-none transition-none'
            }`}
          >
            {/* Header: displayName */}
            <div className="px-3 py-2 mb-1">
              <p className="text-sm font-bold text-[var(--text-primary)] truncate m-0">
                {displayName}
              </p>
            </div>

            {/* Divider 1 */}
            <div className="my-1.5 border-t border-[var(--border-subtle)]" />

            {/* Perfil */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('/perfil')}
              className="w-full text-left px-3 py-2 rounded-[6px] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer font-medium"
            >
              Perfil
            </button>

            {/* Conta */}
            <button
              type="button"
              role="menuitem"
              onClick={() => handleNavigate('/conta')}
              className="w-full text-left px-3 py-2 rounded-[6px] text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer font-medium"
            >
              Conta
            </button>

            {/* Divider 2 before Sair */}
            <div className="my-1.5 border-t border-[var(--border-subtle)]" />

            {/* Sair */}
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 rounded-[6px] text-sm text-[var(--feedback-error)] hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer font-medium"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
