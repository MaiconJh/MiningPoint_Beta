import React from 'react';
import { createCustomIconComponent } from '../../data/icons/iconRegistry';

interface SvgPreviewProps {
  svg: string;
  viewBox?: string;
  name?: string;
}

export const SvgPreview: React.FC<SvgPreviewProps> = ({
  svg,
  viewBox = '0 0 24 24',
  name = 'Visualização do ícone',
}) => {
  if (!svg.trim()) {
    return null;
  }

  const IconComp = createCustomIconComponent(svg, viewBox);

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--text-muted)] font-bold m-0">
        Visualização
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Dark / Neutral background preview */}
        <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] flex flex-col items-center justify-center gap-4">
          <span className="text-xs text-[var(--text-muted)] font-mono">Fundo padrão</span>
          <div className="flex items-center gap-6 justify-center">
            {/* 24px */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
                <IconComp className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">24px</span>
            </div>

            {/* 48px */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
                <IconComp className="w-12 h-12" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">48px</span>
            </div>

            {/* 96px */}
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
                <IconComp className="w-24 h-24" />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">96px</span>
            </div>
          </div>
        </div>

        {/* Light background preview */}
        {/* Teste deliberado de renderização de ícone sobre fundo claro fixo */}
        {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
        <div className="p-4 rounded-xl border border-[#DEE0E2] bg-[#F7F7F8] text-[#272C35] flex flex-col items-center justify-center gap-4">
          {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
          <span className="text-xs text-[#768193] font-mono">Fundo claro</span>
          <div className="flex items-center gap-6 justify-center">
            {/* 24px */}
            <div className="flex flex-col items-center gap-1.5">
              {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[rgba(23,124,232,0.12)] text-[#177CE8]">
                <IconComp className="w-6 h-6" />
              </div>
              {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
              <span className="text-[10px] text-[#768193] font-mono">24px</span>
            </div>

            {/* 48px */}
            <div className="flex flex-col items-center gap-1.5">
              {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[rgba(23,124,232,0.12)] text-[#177CE8]">
                <IconComp className="w-12 h-12" />
              </div>
              {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
              <span className="text-[10px] text-[#768193] font-mono">48px</span>
            </div>

            {/* 96px */}
            <div className="flex flex-col items-center gap-1.5">
              {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center bg-[rgba(23,124,232,0.12)] text-[#177CE8]">
                <IconComp className="w-24 h-24" />
              </div>
              {/* eslint-disable-next-line design-tokens/no-raw-color-literals */}
              <span className="text-[10px] text-[#768193] font-mono">96px</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
