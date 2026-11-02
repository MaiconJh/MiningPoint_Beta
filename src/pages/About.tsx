import React from 'react';
import { Link } from 'react-router-dom';

export const About: React.FC = () => {
  return (
    <div className="w-full">
      {/* 1. Hero */}
      <section className="relative py-16 sm:py-24 border-b border-[var(--border-default)] bg-[radial-gradient(120%_90%_at_50%_0%,color-mix(in_srgb,var(--brand-primary)_20%,transparent)_0%,transparent_64%)]">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.95fr] gap-9 lg:gap-14 items-start">
            <div>
              <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                Sobre o MiningPoint
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.625rem] font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.14] mb-6">
                Toda descoberta começa com uma pergunta
              </h1>
              <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed mb-7">
                MiningPoint é a plataforma da comunidade de exploração subterrânea que estuda os
                materiais voláteis — recursos que mudam de comportamento conforme o ambiente e que
                ainda resistem a uma explicação definitiva.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/entrar"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors"
                >
                  Entrar com Google
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <Link
                  to="/membros"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
                >
                  Conhecer os membros
                </Link>
              </div>
            </div>

            <aside className="rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm p-6">
              <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--text-muted)] m-0">
                Em resumo
              </h2>
              <ul className="list-none m-0 mt-4 p-0 flex flex-col gap-3.5">
                <li className="flex gap-3 items-start">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0 mt-[3px] text-[var(--brand-primary)]" aria-hidden="true">
                    <path d="M12 3.5l6.5 5.5-6.5 11L5.5 9 12 3.5z" />
                    <path d="M5.5 9h13" />
                  </svg>
                  <div>
                    <strong className="block text-[14.5px] font-semibold text-[var(--text-primary)]">
                      Objeto de estudo
                    </strong>
                    <span className="block text-[13.5px] text-[var(--text-secondary)] leading-snug">
                      Materiais voláteis: propriedades que variam com o ambiente e com as combinações.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0 mt-[3px] text-[var(--brand-primary)]" aria-hidden="true">
                    <circle cx="9" cy="9" r="3" />
                    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                    <path d="M16 6.2a3 3 0 0 1 0 5.6" />
                    <path d="M17.2 14.3A5.5 5.5 0 0 1 20.5 19" />
                  </svg>
                  <div>
                    <strong className="block text-[14.5px] font-semibold text-[var(--text-primary)]">
                      Quem participa
                    </strong>
                    <span className="block text-[13.5px] text-[var(--text-secondary)] leading-snug">
                      Exploradores, pesquisadores e curiosos organizados por grupos e permissões explícitas.
                    </span>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] flex-shrink-0 mt-[3px] text-[var(--brand-primary)]" aria-hidden="true">
                    <path d="M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2z" />
                    <path d="M12 6.5v13" />
                  </svg>
                  <div>
                    <strong className="block text-[14.5px] font-semibold text-[var(--text-primary)]">
                      O que fica registrado
                    </strong>
                    <span className="block text-[13.5px] text-[var(--text-secondary)] leading-snug">
                      Cada amostra, expedição e revisão fica no catálogo com histórico e autoria.
                    </span>
                  </div>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </section>

      {/* 2. O que fazemos */}
      <section className="py-16 sm:py-24" aria-labelledby="titulo-fazemos">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="max-w-[720px] mb-11">
            <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
              O que fazemos
            </span>
            <h2 id="titulo-fazemos" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Três frentes, um mesmo registro
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed m-0">
              Tudo o que a comunidade produz passa pelo catálogo: encontrar, compreender e compartilhar são etapas do mesmo processo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
                </svg>
              </div>
              <span className="font-mono text-[11.5px] uppercase tracking-widest text-[var(--brand-primary)]">
                Frente 01
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">Expedir</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Grupos organizam saídas para regiões conhecidas e para áreas recém-abertas, registrando condições, duração e tudo o que foi observado no caminho.
              </p>
            </article>

            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
                  <path d="M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2z" />
                  <path d="M12 6.5v13" />
                </svg>
              </div>
              <span className="font-mono text-[11.5px] uppercase tracking-widest text-[var(--brand-primary)]">
                Frente 02
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">Catalogar</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Cada amostra é registrada com origem, condições de coleta e comportamento observado. O catálogo é a memória coletiva da comunidade.
              </p>
            </article>

            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
                  <circle cx="9" cy="9" r="3" />
                  <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                  <path d="M16 6.2a3 3 0 0 1 0 5.6" />
                  <path d="M17.2 14.3A5.5 5.5 0 0 1 20.5 19" />
                </svg>
              </div>
              <span className="font-mono text-[11.5px] uppercase tracking-widest text-[var(--brand-primary)]">
                Frente 03
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">Compartilhar</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Descobertas, hipóteses e correções circulam no fórum e nos eventos. Nenhuma conclusão é tratada como definitiva antes da revisão de outros exploradores.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 3. Por que o projeto existe */}
      <section className="py-16 sm:py-24 bg-[color-mix(in_srgb,var(--bg-surface)_55%,transparent)] border-y border-[var(--border-default)]" aria-labelledby="titulo-origem">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-center">
            <div>
              <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                Por que o projeto existe
              </span>
              <h2 id="titulo-origem" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-6">
                O que não se deixa explicar
              </h2>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-4">
                Diferente dos minérios convencionais, os materiais voláteis não mantêm as mesmas propriedades: variam conforme o ambiente, reagem de forma inesperada quando combinados e não valem apenas pela quantidade extraída.
              </p>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-4">
                Uma amostra pode parecer comum por fora e contradizer tudo o que já foi registrado. Por isso o projeto trata cada conclusão como provisória e cada registro como ponto de partida.
              </p>
            </div>
            <blockquote className="m-0 p-6 sm:p-7 border-l-4 border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_6%,transparent)] rounded-r-xl italic text-lg sm:text-xl text-[var(--text-primary)] leading-relaxed">
              Encontrar um recurso é apenas o começo. Compreendê-lo é o que transforma uma descoberta em progresso.
              <footer className="block mt-4 not-italic font-mono text-[11.5px] uppercase tracking-widest text-[var(--text-secondary)]">
                Princípio do catálogo
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* 4. Princípios */}
      <section className="py-16 sm:py-24" aria-labelledby="titulo-principios">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="max-w-[720px] mb-11">
            <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
              Como trabalhamos
            </span>
            <h2 id="titulo-principios" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Quatro princípios
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed m-0">
              São regras de convivência e de método — valem para expedições, registros e discussões no fórum.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
                  <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">Rigor</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Uma hipótese só entra no catálogo com registro de origem, condições de teste e resultado observado. Sem isso, permanece como conversa.
              </p>
            </article>

            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
                  <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">Transparência</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Histórico de edição e autoria ficam visíveis em cada registro. Quem revisou, quando revisou e por quê faz parte do documento.
              </p>
            </article>

            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
                  <circle cx="9" cy="9" r="3" />
                  <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                  <path d="M16 6.2a3 3 0 0 1 0 5.6" />
                  <path d="M17.2 14.3A5.5 5.5 0 0 1 20.5 19" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">Colaboração</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Nenhum explorador trabalha isolado: revisão por pares é parte do processo, e correções são tratadas como contribuição, não como conflito.
              </p>
            </article>

            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full" aria-hidden="true">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4.5 4.5" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">Curiosidade</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Perguntas sem resposta são parte do mapa, não uma falha. O projeto mantém aberto o que ainda não foi compreendido.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 5. Grupos */}
      <section className="py-16 sm:py-24 bg-[color-mix(in_srgb,var(--bg-surface)_55%,transparent)] border-y border-[var(--border-default)]" aria-labelledby="titulo-grupos">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="max-w-[720px] mb-6">
            <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
              Quem constrói
            </span>
            <h2 id="titulo-grupos" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Grupos e permissões explícitas
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed m-0">
              O acesso é organizado por grupos. Cada membro tem um grupo primário, que define cor e insígnia, e pode acumular permissões por grupos secundários.
            </p>
          </div>

          <ul className="flex flex-wrap gap-2.5 m-0 mt-5 p-0 list-none" aria-label="Grupos da comunidade">
            <li className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-secondary)]" aria-hidden="true" />
              Visitante
            </li>
            <li className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-secondary)]" aria-hidden="true" />
              Membro
            </li>
            <li className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-secondary)]" aria-hidden="true" />
              VIP
            </li>
            <li className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold bg-[var(--bg-surface-elevated)] border border-[color-mix(in_srgb,var(--brand-primary)_45%,transparent)] text-[var(--text-primary)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)]" aria-hidden="true" />
              Admin
            </li>
          </ul>

          <p className="mt-5 p-4 rounded-lg text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-surface)] border border-dashed border-[var(--border-default)]">
            <strong className="text-[var(--text-primary)]">Permissões independentes.</strong>{' '}
            Acesso ao painel, gestão de usuários, grupos, insígnias, fórum e conteúdo são verificadas separadamente — na interface e nas regras do banco.
          </p>
        </div>
      </section>

      {/* 6. CTA */}
      <section className="py-16 sm:py-24" aria-labelledby="titulo-cta">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-[var(--bg-surface)] border border-[color-mix(in_srgb,var(--brand-primary)_32%,transparent)] shadow-sm">
            <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
              Comece por aqui
            </span>
            <h2 id="titulo-cta" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Pronto para descer?
            </h2>
            <p className="text-base text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
              Crie seu perfil, escolha um @nick e comece a registrar suas descobertas com a comunidade.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link
                to="/entrar"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-base font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors"
              >
                Entrar com Google
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                to="/eventos"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors"
              >
                Ver os próximos eventos
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
