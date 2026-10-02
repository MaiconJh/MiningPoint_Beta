import React, { useState } from 'react';
import RefreshCwIcon from 'lucide-react/dist/esm/icons/refresh-cw';
import DatabaseIcon from 'lucide-react/dist/esm/icons/database';
import CheckCircleIcon from 'lucide-react/dist/esm/icons/check-circle';
import { backfillShortIds } from '../../lib/users';

export const AdminConfig: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    filledCount: number;
    alreadyHadCount: number;
    totalCount: number;
  } | null>(null);

  const handleRunBackfill = async () => {
    setRunning(true);
    setResult(null);
    setProgress({ done: 0, total: 0 });

    try {
      const res = await backfillShortIds((done, total) => {
        setProgress({ done, total });
      });
      setResult(res);
    } catch (err) {
      console.error('Erro ao executar backfill de shortIds:', err);
    } finally {
      setRunning(false);
    }
  };

  const percent = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] m-0">
          Configurações e Manutenção
        </h1>
        <p className="text-sm text-[var(--text-secondary)] m-0 mt-1">
          Ferramentas administrativas e rotinas de manutenção do banco de dados.
        </p>
      </div>

      {/* Seção Manutenção de Identidade */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
            <DatabaseIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">
              Identificação Pública (ShortIds)
            </h2>
            <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
              Gera identificadores curtos retroativos de 8 caracteres para contas antigas que ainda não possuem.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">
                Gerar shortId retroativo
              </h3>
              <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
                Varre a coleção de usuários e preenche o campo <code>shortId</code> para qualquer usuário que ainda não tenha.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunBackfill}
              disabled={running}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--bg-default)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
            >
              <RefreshCwIcon className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Processando...' : 'Gerar shortId retroativo'}</span>
            </button>
          </div>

          {/* Barra de Progresso */}
          {running && progress && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
                <span>Processando lotes...</span>
                <span>{progress.done} / {progress.total} ({percent}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--bg-surface-elevated)] overflow-hidden">
                <div
                  className="h-full bg-[var(--brand-primary)] transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Resultado */}
          {result && (
            <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-success)_10%,transparent)] border border-[color-mix(in_srgb,var(--feedback-success)_30%,transparent)] flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-[var(--feedback-success)] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--feedback-success)] m-0">
                  Processamento concluído com sucesso!
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[var(--text-secondary)] font-mono">
                  <li>Novos shortIds gerados: <strong>{result.filledCount}</strong></li>
                  <li>Contas que já possuíam shortId: <strong>{result.alreadyHadCount}</strong></li>
                  <li>Total de contas verificadas: <strong>{result.totalCount}</strong></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
