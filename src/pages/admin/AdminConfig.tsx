import React, { useState } from 'react';
import RefreshCwIcon from 'lucide-react/dist/esm/icons/refresh-cw';
import DatabaseIcon from 'lucide-react/dist/esm/icons/database';
import CheckCircleIcon from 'lucide-react/dist/esm/icons/check-circle';
import UsersIcon from 'lucide-react/dist/esm/icons/users';
import ShieldAlertIcon from 'lucide-react/dist/esm/icons/shield-alert';
import { useAuth } from '../../context/AuthContext';
import { backfillShortIds, backfillPrimaryGroupId, type BackfillPrimaryGroupIdResult } from '../../lib/users';

export const AdminConfig: React.FC = () => {
  const { profile } = useAuth();
  const canManageUsers = !profile?.isBanned && !!profile?.effectivePermissions?.manageUsers;

  // ShortIds backfill state
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{
    filledCount: number;
    alreadyHadCount: number;
    totalCount: number;
  } | null>(null);

  // primaryGroupId backfill state
  const [runningGroups, setRunningGroups] = useState(false);
  const [progressGroups, setProgressGroups] = useState<{ done: number; total: number } | null>(null);
  const [resultGroups, setResultGroups] = useState<BackfillPrimaryGroupIdResult | null>(null);
  const [errorGroups, setErrorGroups] = useState<string | null>(null);

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

  const handleRunPrimaryGroupBackfill = async () => {
    if (!canManageUsers) {
      setErrorGroups('Ação não autorizada. Requer permissão para gerenciar usuários.');
      return;
    }
    setRunningGroups(true);
    setResultGroups(null);
    setErrorGroups(null);
    setProgressGroups({ done: 0, total: 0 });

    try {
      const res = await backfillPrimaryGroupId((done, total) => {
        setProgressGroups({ done, total });
      });
      setResultGroups(res);
    } catch (err) {
      console.error('Erro ao executar backfill de primaryGroupId:', err);
      setErrorGroups('Ocorreu um erro ao executar a migração de grupos.');
    } finally {
      setRunningGroups(false);
    }
  };

  const percent = progress && progress.total > 0
    ? Math.round((progress.done / progress.total) * 100)
    : 0;

  const percentGroups = progressGroups && progressGroups.total > 0
    ? Math.round((progressGroups.done / progressGroups.total) * 100)
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

      {/* Seção Migração de Grupo Primário */}
      <section className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[color-mix(in_srgb,var(--brand-primary)_12%,transparent)] text-[var(--brand-primary)]">
            <UsersIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">
              Migração de Grupos (primaryGroupId)
            </h2>
            <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
              Migra o campo legado <code>groupId</code> para <code>primaryGroupId</code> e remove o atributo obsoleto dos documentos de usuários.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] m-0">
                Migrar groupId retroativo
              </h3>
              <p className="text-xs text-[var(--text-secondary)] m-0 mt-0.5">
                Varre a coleção de usuários, transfere o grupo antigo para o grupo primário oficial e remove o campo legado <code>groupId</code>.
              </p>
              {!canManageUsers && (
                <p className="text-xs text-[var(--feedback-warning)] m-0 mt-1 flex items-center gap-1.5 font-medium">
                  <ShieldAlertIcon className="w-3.5 h-3.5" />
                  Requer permissão de Gerenciar usuários (manageUsers).
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunPrimaryGroupBackfill}
              disabled={runningGroups || !canManageUsers}
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brand-primary)] text-[var(--bg-default)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40"
            >
              <RefreshCwIcon className={`w-4 h-4 ${runningGroups ? 'animate-spin' : ''}`} />
              <span>{runningGroups ? 'Processando...' : 'Migrar groupId retroativo'}</span>
            </button>
          </div>

          {/* Barra de Progresso */}
          {runningGroups && progressGroups && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
                <span>Processando lotes...</span>
                <span>{progressGroups.done} / {progressGroups.total} ({percentGroups}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--bg-surface-elevated)] overflow-hidden">
                <div
                  className="h-full bg-[var(--brand-primary)] transition-all duration-300"
                  style={{ width: `${percentGroups}%` }}
                />
              </div>
            </div>
          )}

          {/* Erro */}
          {errorGroups && (
            <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_10%,transparent)] border border-[color-mix(in_srgb,var(--feedback-error)_30%,transparent)] text-xs text-[var(--feedback-error)]">
              {errorGroups}
            </div>
          )}

          {/* Resultado */}
          {resultGroups && (
            <div className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-success)_10%,transparent)] border border-[color-mix(in_srgb,var(--feedback-success)_30%,transparent)] flex items-start gap-3">
              <CheckCircleIcon className="w-5 h-5 text-[var(--feedback-success)] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--feedback-success)] m-0">
                  Migração concluída com sucesso!
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[var(--text-secondary)] font-mono">
                  <li>Documentos migrados / limpos: <strong>{resultGroups.migratedCount}</strong></li>
                  <li>Documentos que já estavam no formato novo: <strong>{resultGroups.alreadyCleanCount}</strong></li>
                  <li>Total de contas verificadas: <strong>{resultGroups.totalCount}</strong></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
