import React, { useState, useEffect, useRef } from 'react';
import { sanitizeSvg } from '../../lib/svgSanitizer';

interface SvgSourceInputProps {
  value: string;
  disabled?: boolean;
  onChange: (svg: string, sanitizedViewBox?: string, isValid?: boolean) => void;
  error?: string | null;
}

export const SvgSourceInput: React.FC<SvgSourceInputProps> = ({
  value,
  disabled = false,
  onChange,
  error: externalError,
}) => {
  const [localSvg, setLocalSvg] = useState(value);
  const [sanitizerError, setSanitizerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSvg(value);
  }, [value]);

  useEffect(() => {
    if (!localSvg.trim()) {
      setSanitizerError(null);
      onChange('', undefined, false);
      return;
    }

    const timer = setTimeout(() => {
      const res = sanitizeSvg(localSvg);
      if (res.ok) {
        setSanitizerError(null);
        onChange(res.svg, res.viewBox, true);
      } else {
        setSanitizerError(res.error);
        onChange(localSvg, undefined, false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSvg]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setSanitizerError('Selecione um arquivo .svg válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setLocalSvg(content);
      }
    };
    reader.onerror = () => {
      setSanitizerError('Erro ao ler o arquivo .svg selecionado.');
    };
    reader.readAsText(file);

    // Reset file input so the same file can be re-uploaded if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const currentError = sanitizerError || externalError;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label htmlFor="svg-source" className="block text-sm font-semibold text-[var(--text-primary)]">
          Código SVG <span className="text-[var(--feedback-error)]">*</span>
        </label>

        {!disabled && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileUpload}
              className="hidden"
              id="svg-file-upload"
            />
            <label
              htmlFor="svg-file-upload"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Carregar arquivo .svg</span>
            </label>
          </div>
        )}
      </div>

      <textarea
        id="svg-source"
        required
        disabled={disabled}
        rows={6}
        value={localSvg}
        onChange={(e) => setLocalSvg(e.target.value)}
        placeholder={'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">\n  <path d="..." />\n</svg>'}
        className={`w-full px-3.5 py-2.5 rounded-lg border font-mono text-xs bg-[var(--bg-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] resize-y ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        } ${
          currentError ? 'border-[var(--feedback-error)]' : 'border-[var(--border-default)]'
        }`}
      />

      {disabled && (
        <p className="text-xs text-[var(--text-muted)] m-0">
          O código SVG não pode ser editado após a criação para manter a integridade dos badges existentes.
        </p>
      )}

      {currentError && (
        <div className="p-2.5 rounded-md bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] border border-[var(--feedback-error)] text-[var(--feedback-error)] text-xs">
          {currentError}
        </div>
      )}

      {!disabled && !currentError && localSvg.trim() && (
        <p className="text-xs text-[var(--feedback-success)] font-medium m-0 flex items-center gap-1">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          SVG válido e seguro
        </p>
      )}
    </div>
  );
};
