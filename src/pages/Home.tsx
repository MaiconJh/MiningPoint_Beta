import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface StatCounterProps {
  finalValue: number;
  suffix?: string;
  label: string;
}

const StatCounter: React.FC<StatCounterProps> = ({ finalValue, suffix = '', label }) => {
  const [displayValue, setDisplayValue] = useState<number>(finalValue);

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayValue(finalValue);
      return;
    }

    const duration = 1200;
    const startTime = performance.now();
    setDisplayValue(0);

    let animationFrameId: number;

    const frame = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic: 1 - (1 - progress)^3
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(finalValue * eased);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(frame);
      }
    };

    animationFrameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [finalValue]);

  return (
    <div className="flex flex-col gap-1 min-w-[132px]">
      <span className="font-bold text-3xl sm:text-4xl text-[var(--text-primary)] tabular-nums leading-tight">
        {displayValue.toLocaleString('pt-BR')}{suffix}
      </span>
      <span className="text-xs uppercase tracking-wide text-[var(--text-secondary)] font-medium">
        {label}
      </span>
    </div>
  );
};

export const Home: React.FC = () => {
  return (
    <div className="w-full">
      {/* 1. Hero Section */}
      <section className="relative py-16 sm:py-24 bg-[radial-gradient(120%_90%_at_50%_0%,color-mix(in_srgb,var(--brand-primary)_20%,transparent)_0%,transparent_64%)] border-b border-[var(--border-default)]">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="max-w-[760px]">
            <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
              Comunidade de exploração · Expedições subterrâneas
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] mb-6">
              MiningPoint
            </h1>
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed mb-8">
              Nas profundezas, cada descoberta abre novas possibilidades. Cada recurso guarda perguntas ainda sem resposta — e cada explorador decide até onde está disposto a ir.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/sobre"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold tracking-wide bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
              >
                Explorar a Lore
              </Link>
              <button
                type="button"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold tracking-wide border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors cursor-pointer"
              >
                Entrar na Comunidade
              </button>
            </div>

            {/* 2. Animated Stats Counter */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-8 pt-8 border-t border-[var(--border-subtle)]">
              <StatCounter finalValue={240} suffix="+" label="Membros ativos" />
              <StatCounter finalValue={86} label="Eventos realizados" />
              <StatCounter finalValue={512} label="Recursos catalogados" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Os Quatro Pilares */}
      <section className="py-16 sm:py-24" aria-labelledby="titulo-pilares">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="max-w-[720px] mb-12">
            <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
              A essência do projeto
            </span>
            <h2 id="titulo-pilares" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Os Quatro Pilares
            </h2>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed m-0">
              Tudo em MiningPoint parte de quatro ideias que se sustentam entre si: descobrir, compreender, evoluir e compartilhar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pilar 01 */}
            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg className="w-full h-full fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
                </svg>
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                Pilar 01
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">
                Exploração
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Descobrir o que existe além das regiões conhecidas e encontrar recursos que desafiam as expectativas.
              </p>
            </article>

            {/* Pilar 02 */}
            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg className="w-full h-full fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2z" />
                  <path d="M12 6.5v13" />
                </svg>
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                Pilar 02
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">
                Conhecimento
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Investigar materiais, compreender suas propriedades e transformar descobertas em novas possibilidades.
              </p>
            </article>

            {/* Pilar 03 */}
            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg className="w-full h-full fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 19h16" />
                  <path d="M4 15l5-5 3.5 3.5L20 6" />
                  <path d="M20 10V6h-4" />
                </svg>
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                Pilar 03
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">
                Evolução
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Desenvolver habilidades, aperfeiçoar técnicas e construir uma trajetória própria por meio da experiência.
              </p>
            </article>

            {/* Pilar 04 */}
            <article className="flex flex-col gap-3 p-6 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-sm hover:-translate-y-1 hover:border-[var(--brand-primary)] transition-all duration-200">
              <div className="w-9 h-9 text-[var(--brand-primary)]">
                <svg className="w-full h-full fill-none stroke-current stroke-[1.5] [stroke-linecap:round] [stroke-linejoin:round]" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="9" cy="9" r="3" />
                  <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                  <path d="M16 6.2a3 3 0 0 1 0 5.6" />
                  <path d="M17.2 14.3A5.5 5.5 0 0 1 20.5 19" />
                </svg>
              </div>
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                Pilar 04
              </span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] m-0">
                Comunidade
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed m-0">
                Compartilhar descobertas, criar relações e participar da evolução de um mundo construído coletivamente.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 4. Materiais que não se deixam explicar */}
      <section className="py-16 sm:py-24 bg-[color-mix(in_srgb,var(--bg-surface)_55%,transparent)] border-y border-[var(--border-default)]" aria-labelledby="titulo-misterio">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-8 md:gap-12 items-center">
            <div>
              <span className="block mb-2 font-mono text-xs uppercase tracking-widest text-[var(--brand-primary)]">
                O mistério que permanece
              </span>
              <h2 id="titulo-misterio" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-6">
                Materiais que não se deixam explicar
              </h2>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-4">
                Diferente dos minérios convencionais, os materiais voláteis não mantêm as mesmas propriedades: variam conforme o ambiente, reagem de forma inesperada quando combinados e não valem apenas pela quantidade extraída. Uma amostra pode parecer comum por fora e contradizer tudo o que já foi registrado.
              </p>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed mb-4">
                Encontrar um recurso é apenas o começo. Compreendê-lo é o que transforma uma descoberta em progresso — e é exatamente aí que a comunidade de MiningPoint passa a maior parte do tempo: comparando registros, repetindo testes e revisando conclusões antigas.
              </p>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed m-0">
                A origem dos materiais voláteis continua em aberto. Por que certas regiões concentram recursos incomuns? Existe relação entre os diferentes materiais? São perguntas que ninguém respondeu ainda.
              </p>
            </div>

            <blockquote className="m-0 p-6 sm:p-8 border-l-4 border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_6%,transparent)] rounded-r-xl italic text-lg sm:text-xl text-[var(--text-primary)] leading-relaxed">
              Nas profundezas, cada descoberta abre novas possibilidades. Cada recurso guarda perguntas ainda sem resposta. E cada explorador decide até onde está disposto a ir.
              <footer className="block mt-4 not-italic font-sans text-xs uppercase tracking-widest text-[var(--text-secondary)] font-medium">
                Tagline de MiningPoint
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* 5. Final CTA */}
      <section className="py-16 sm:py-24" aria-labelledby="titulo-cta">
        <div className="w-full max-w-[1180px] mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-[var(--bg-surface)] border border-[color-mix(in_srgb,var(--brand-primary)_32%,transparent)] shadow-sm">
            <h2 id="titulo-cta" className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3">
              Pronto para descer?
            </h2>
            <p className="text-base text-[var(--text-secondary)] max-w-xl mx-auto mb-8">
              Conheça quem já está nas profundezas e veja o que a comunidade tem marcado para os próximos ciclos.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/membros"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold tracking-wide bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
              >
                Conhecer os membros
              </Link>
              <Link
                to="/eventos"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-base font-semibold tracking-wide border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] transition-colors cursor-pointer"
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
