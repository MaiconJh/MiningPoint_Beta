import React from 'react';
import { Link } from 'react-router-dom';
import { useForums } from '../hooks/useForums';
import { useMembers } from '../hooks/useMembers';

const ArrowIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-4 h-4"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

const UsersIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
    aria-hidden="true"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const ForumIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-5 h-5"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 9.2 9.2 0 0 1-4-.9L3 21l1.9-4.6A8.4 8.4 0 0 1 3 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5Z" />
  </svg>
);

const HomeStat: React.FC<{ icon: React.ReactNode; value: string; label: string }> = ({
  icon,
  value,
  label,
}) => (
  <div className="flex items-center gap-3 min-w-0">
    <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
      {icon}
    </span>
    <div className="min-w-0">
      <strong className="block text-xl font-bold text-[var(--text-primary)] tabular-nums">
        {value}
      </strong>
      <span className="block text-xs uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </span>
    </div>
  </div>
);

export const Home: React.FC = () => {
  const { members, isLoading: membersLoading, error: membersError, hasMore } = useMembers();
  const { forums, loading: forumsLoading, error: forumsError } = useForums();
  const activeForums = forums.filter((forum) => forum.isActive);
  const memberValue = membersLoading ? '—' : `${members.length}${hasMore ? '+' : ''}`;

  return (
    <div className="w-full">
      <section className="relative border-b border-[var(--border-default)] bg-[radial-gradient(120%_90%_at_50%_0%,color-mix(in_srgb,var(--brand-primary)_18%,transparent)_0%,transparent_64%)]">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] gap-10 lg:gap-16 items-end">
            <div>
              <span className="block mb-3 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                Central da comunidade
              </span>
              <h1 className="max-w-[760px] text-4xl sm:text-5xl lg:text-[4.25rem] font-extrabold tracking-tight leading-[1.04] text-[var(--text-primary)] mb-6">
                Explore. Compartilhe. Evolua.
              </h1>
              <p className="max-w-[650px] text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed mb-8">
                Acompanhe o que está acontecendo em MiningPoint, encontre outros membros e participe das conversas da comunidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/forum"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors"
                >
                  Ir para o fórum
                  <ArrowIcon />
                </Link>
                <Link
                  to="/membros"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-semibold border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
                >
                  Ver membros
                  <ArrowIcon />
                </Link>
              </div>
            </div>

            <aside className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-6 sm:p-7 shadow-sm">
              <span className="block mb-5 font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Agora na comunidade
              </span>
              <div className="grid grid-cols-2 gap-5">
                <HomeStat icon={<UsersIcon />} value={memberValue} label="Membros públicos" />
                <HomeStat
                  icon={<ForumIcon />}
                  value={forumsLoading ? '—' : String(activeForums.length)}
                  label="Fóruns ativos"
                />
              </div>
              {(membersError || forumsError) && (
                <p className="mt-5 pt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--feedback-warning)]">
                  Alguns dados da comunidade não puderam ser atualizados agora.
                </p>
              )}
            </aside>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20" aria-labelledby="titulo-acessos">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                Acompanhe de perto
              </span>
              <h2 id="titulo-acessos" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                O que você quer fazer?
              </h2>
            </div>
            <Link
              to="/sobre"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
            >
              Conhecer o MiningPoint
              <ArrowIcon />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/forum"
              className="group flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200"
            >
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--brand-primary)]">01</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Participar das conversas</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">Leia discussões, compartilhe descobertas e acompanhe os fóruns ativos.</p>
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">Abrir fórum <ArrowIcon /></span>
            </Link>
            <Link
              to="/membros"
              className="group flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200"
            >
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--brand-primary)]">02</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Encontrar exploradores</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">Conheça os membros públicos e descubra quem está construindo a comunidade.</p>
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">Ver membros <ArrowIcon /></span>
            </Link>
            <Link
              to="/entrar"
              className="group flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200"
            >
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--brand-primary)]">03</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Fazer parte</h3>
              <p className="text-sm leading-relaxed text-[var(--text-secondary)] m-0">Entre com sua conta Google para participar das áreas que exigem autenticação.</p>
              <span className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">Entrar na conta <ArrowIcon /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20 border-y border-[var(--border-default)] bg-[color-mix(in_srgb,var(--bg-surface)_55%,transparent)]" aria-labelledby="titulo-foruns">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">Espaços de discussão</span>
              <h2 id="titulo-foruns" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Fóruns ativos</h2>
            </div>
            <Link to="/forum" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors">Ver todos <ArrowIcon /></Link>
          </div>

          {forumsLoading ? (
            <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)]">Carregando fóruns ativos...</div>
          ) : activeForums.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeForums.slice(0, 3).map((forum) => (
                <Link key={forum.id} to={forum.route} className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--brand-primary)] transition-colors">
                  <span className="text-xs font-mono uppercase tracking-widest text-[var(--brand-primary)]">{forum.focus}</span>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)]">{forum.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0 line-clamp-3">{forum.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-primary)]">Acessar fórum <ArrowIcon /></span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm text-[var(--text-secondary)]">Nenhum fórum ativo está disponível no momento.</div>
          )}
        </div>
      </section>
    </div>
  );
};
