import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import UserIcon from 'lucide-react/dist/esm/icons/user';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import {
  Forum,
  ForumThreadFormData,
  ForumReport,
  ForumReportTargetStatus,
} from '../../types/forum';
import { useAuth } from '../../context/AuthContext';
import { useForumThreads } from '../../hooks/useForumThreads';
import { canCreateThread, canReviewReports } from '../../lib/forumPermissions';
import { createThread } from '../../lib/forumThreads';
import {
  listReports,
  reviewReport,
  reopenReport,
  hydrateReports,
  HydratedReport,
} from '../../lib/forumReports';
import { getUserProfile } from '../../lib/profile';
import { UserProfile } from '../../types/profile';
import { ThreadListItem } from './ThreadListItem';
import { NewThreadForm } from './NewThreadForm';

interface ForumViewProps {
  forum: Forum;
}

const reporterProfileCache = new Map<string, Promise<UserProfile | null>>();

function getCachedReporterProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return Promise.resolve(null);
  if (!reporterProfileCache.has(uid)) {
    reporterProfileCache.set(uid, getUserProfile(uid));
  }
  return reporterProfileCache.get(uid)!;
}

const TargetStatusBadge: React.FC<{ status: ForumReportTargetStatus | undefined }> = ({
  status,
}) => {
  const config: Record<ForumReportTargetStatus, { label: string; cls: string }> = {
    active: {
      label: 'Ativo',
      cls: 'bg-[color-mix(in_srgb,var(--feedback-success)_18%,transparent)] text-[var(--feedback-success)]',
    },
    edited: {
      label: 'Editado',
      cls: 'bg-[color-mix(in_srgb,var(--feedback-warning)_18%,transparent)] text-[var(--feedback-warning)]',
    },
    'deleted-by-author': {
      label: 'Excluído pelo autor',
      cls: 'bg-[color-mix(in_srgb,var(--feedback-error)_18%,transparent)] text-[var(--feedback-error)]',
    },
    'removed-by-moderator': {
      label: 'Removido pelo moderador',
      cls: 'bg-[color-mix(in_srgb,var(--feedback-error)_18%,transparent)] text-[var(--feedback-error)]',
    },
    missing: {
      label: 'Conteúdo não encontrado',
      cls: 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]',
    },
    unknown: {
      label: 'Estado indisponível',
      cls: 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]',
    },
  };
  const cfg = status ? config[status] : config.unknown;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 forum-meta font-semibold rounded ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
};

const ReporterBlock: React.FC<{
  profile: UserProfile | null | undefined;
  fallbackId: string;
}> = ({ profile, fallbackId }) => {
  const name =
    profile?.displayName || (fallbackId ? `membro-${fallbackId.slice(0, 5)}` : 'Membro');
  const handle = profile?.handle ? `@${profile.handle}` : null;
  const initial = name.charAt(0).toUpperCase();
  const color = profile?.primaryGroup?.color || 'var(--brand-primary)';
  return (
    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-full border overflow-hidden flex items-center justify-center bg-[var(--bg-default)] shrink-0"
        style={{ borderColor: color }}
      >
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt={name} className="w-full h-full object-cover" />
        ) : profile ? (
          <span className="forum-meta font-bold" style={{ color }}>
            {initial}
          </span>
        ) : (
          <UserIcon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="forum-meta font-bold text-[var(--text-primary)] truncate">
            {name}
          </span>
          <span className="forum-meta text-[var(--text-muted)] truncate">
            {handle || 'Membro'}
          </span>
        </div>
      </div>
    </div>
  );
};

const TargetBlock: React.FC<{ report: HydratedReport }> = ({ report }) => {
  const snapTitle = report.targetSnapshot?.title || '';
  const snapBody = report.targetSnapshot?.body || '';
  if (!snapTitle && !snapBody) return null;
  const currentBody = report.currentBody ?? snapBody;
  const wasEdited =
    report.targetStatus === 'edited' &&
    report.currentBody !== null &&
    report.currentBody !== snapBody;

  return (
    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="forum-meta font-bold text-[var(--text-primary)] truncate">
          {snapTitle || 'Conteúdo denunciado'}
        </span>
        <TargetStatusBadge status={report.targetStatus} />
      </div>
      <p className="forum-body text-[var(--text-secondary)] m-0 whitespace-pre-wrap line-clamp-4">
        {currentBody}
      </p>
      {wasEdited && (
        <details className="border border-[var(--border-subtle)] rounded-md overflow-hidden">
          <summary className="cursor-pointer px-2 py-1 forum-meta font-semibold text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)]">
            Ver alterações
          </summary>
          <div className="bg-[var(--bg-default)] p-2 space-y-1">
            <div className="forum-meta font-bold text-[var(--feedback-error)]">Antes</div>
            <pre className="m-0 forum-meta whitespace-pre-wrap font-mono text-[var(--text-secondary)]">
              {snapBody}
            </pre>
            <div className="forum-meta font-bold text-[var(--feedback-success)] pt-1">Depois</div>
            <pre className="m-0 forum-meta whitespace-pre-wrap font-mono text-[var(--text-secondary)]">
              {currentBody}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
};

export const ForumView: React.FC<ForumViewProps> = ({ forum }) => {
  const { user, profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [savingThread, setSavingThread] = useState(false);

  // Reports review modal state
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reporterProfiles, setReporterProfiles] = useState<
    Record<string, UserProfile | null>
  >({});
  const [busyReportId, setBusyReportId] = useState<string | null>(null);
  const [reportsToast, setReportsToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { threads, loading, error, reload } = useForumThreads(forum.id, selectedCategory);

  const allowCreate = canCreateThread(forum, user, profile);
  const allowReviewReports = canReviewReports(forum, user, profile);

  const handleCreateThread = async (data: ForumThreadFormData) => {
    if (!user) return;
    setSavingThread(true);
    try {
      await createThread(forum.id, data, user.uid);
      setIsCreatingThread(false);
      await reload();
    } finally {
      setSavingThread(false);
    }
  };

  const handleOpenReports = async () => {
    setShowReportsModal(true);
    setLoadingReports(true);
    setReportsError(null);
    try {
      const data = await listReports(forum.id);
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setReportsError(
        'Não foi possível carregar as denúncias. Verifique a conexão e tente novamente.'
      );
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (reports.length === 0) return;
    const ids = Array.from(new Set(reports.map((r) => r.reporterId).filter(Boolean)));
    let cancelled = false;
    Promise.all(
      ids.map((id) => getCachedReporterProfile(id).then((p) => [id, p] as const))
    )
      .then((entries) => {
        if (cancelled) return;
        const map: Record<string, UserProfile | null> = {};
        entries.forEach(([id, p]) => {
          map[id] = p;
        });
        setReporterProfiles((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [reports]);

  const showReportsToast = (text: string, type: 'success' | 'error') => {
    setReportsToast({ text, type });
    window.setTimeout(() => {
      setReportsToast((t) => (t && t.text === text ? null : t));
    }, 6000);
  };

  const handleRetryReports = async () => {
    setLoadingReports(true);
    setReportsError(null);
    try {
      const data = await listReports(forum.id);
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setReportsError(
        'Não foi possível carregar as denúncias. Verifique a conexão e tente novamente.'
      );
    } finally {
      setLoadingReports(false);
    }
  };

  const handleReviewReportAction = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    if (!user) return;
    const prev = reports.find((r) => r.id === reportId);
    if (!prev) return;
    const tgtTitle = prev.targetSnapshot?.title || 'conteúdo denunciado';

    setBusyReportId(reportId);
    setReports((list) =>
      list.map((r) => (r.id === reportId ? { ...r, status, reviewedBy: user.uid } : r))
    );

    try {
      await reviewReport(reportId, status, user.uid);
      showReportsToast(
        status === 'reviewed'
          ? `Denúncia sobre "${tgtTitle}" resolvida.`
          : `Denúncia sobre "${tgtTitle}" descartada.`,
        'success'
      );
    } catch (err) {
      console.error('Failed to review report:', err);
      setReports((list) => list.map((r) => (r.id === reportId ? prev : r)));
      showReportsToast('Não foi possível atualizar a denúncia. Tente novamente.', 'error');
    } finally {
      setBusyReportId(null);
    }
  };

  const handleReopenReport = async (reportId: string) => {
    if (!user) return;
    const prev = reports.find((r) => r.id === reportId);
    if (!prev) return;
    setReports((list) =>
      list.map((r) =>
        r.id === reportId ? { ...r, status: 'open', reviewedBy: null, reviewedAt: null } : r
      )
    );
    try {
      await reopenReport(reportId);
      showReportsToast('Denúncia reaberta.', 'success');
    } catch (err) {
      console.error('Failed to reopen report:', err);
      setReports((list) => list.map((r) => (r.id === reportId ? prev : r)));
      showReportsToast('Não foi possível reabrir a denúncia. Tente novamente.', 'error');
    }
  };

  return (
    <div className="space-y-6 forum-screen-fade">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/forum"
          className="inline-flex items-center gap-1.5 forum-meta font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          Todos os fóruns
        </Link>

        <div className="flex items-center gap-2">
          {allowReviewReports && forum.features?.reports && (
            <button
              type="button"
              onClick={handleOpenReports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 forum-meta font-semibold rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--feedback-warning)] hover:bg-[var(--border-default)] transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Denúncias do Fórum
            </button>
          )}

          {allowCreate && !isCreatingThread && (
            <button
              type="button"
              onClick={() => setIsCreatingThread(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 forum-body font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Novo tópico
            </button>
          )}
        </div>
      </div>

      {/* Forum Header Banner */}
      <div className="p-6 sm:p-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 forum-meta font-semibold rounded-full bg-[var(--bg-default)] border border-[var(--border-subtle)] text-[var(--brand-primary)]">
                Foco: {forum.focus}
              </span>
              <span className="forum-meta text-[var(--text-muted)]">
                <span className="forum-num">{threads.length}</span>{' '}
                {threads.length === 1 ? 'tópico' : 'tópicos'}
              </span>
            </div>
            <h1 className="forum-page text-[var(--text-primary)] m-0">
              {forum.title}
            </h1>
            {forum.description && (
              <p className="forum-body text-[var(--text-secondary)] mt-2 mb-0 max-w-2xl">
                {forum.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* New Thread Form (when active) */}
      {isCreatingThread && (
        <NewThreadForm
          forum={forum}
          onSave={handleCreateThread}
          onCancel={() => setIsCreatingThread(false)}
          saving={savingThread}
        />
      )}

      {/* Internal Categories Tabs */}
      {forum.categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 forum-meta font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === null
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)]'
                : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            Todos os tópicos
          </button>
          {forum.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 forum-meta font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)]'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-default)]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Threads List */}
      {error && (
        <div className="p-4 rounded-xl bg-[var(--feedback-error)] text-[var(--text-inverse)] forum-body font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] animate-pulse h-24"
            />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="p-10 rounded-xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
          <h3 className="forum-title text-[var(--text-primary)] m-0">
            Nenhum tópico encontrado
          </h3>
          <p className="forum-meta text-[var(--text-muted)] mt-1.5 mb-4 max-w-sm mx-auto">
            {selectedCategory
              ? 'Nenhum tópico cadastrado nesta subdivisão interna.'
              : 'Nenhum tópico criado neste fórum. Seja o primeiro a abrir uma discussão!'}
          </p>
          {allowCreate && !isCreatingThread && (
            <button
              type="button"
              onClick={() => setIsCreatingThread(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 forum-body font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro tópico
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => (
            <ThreadListItem key={thread.id} thread={thread} forum={forum} />
          ))}
        </div>
      )}

      {/* Reports Review Modal */}
      {showReportsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reports-modal-title"
            className="dialog-transition bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 id="reports-modal-title" className="forum-title text-[var(--text-primary)] m-0">
                  Denúncias do Fórum
                </h3>
                <p className="forum-meta text-[var(--text-muted)] mt-0.5 mb-0">
                  Análise e resolução de denúncias enviadas pelos membros.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportsModal(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
                aria-label="Fechar modal de denúncias"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingReports ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      aria-hidden="true"
                      className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] animate-pulse h-28"
                    />
                  ))}
                  <p className="sr-only" role="status">
                    Carregando denúncias…
                  </p>
                </div>
              ) : reportsError ? (
                <div
                  role="alert"
                  className="p-4 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_15%,transparent)] border border-[var(--feedback-error)] flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 text-[var(--feedback-error)] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block forum-body font-semibold text-[var(--text-primary)]">
                      Não foi possível carregar as denúncias.
                    </strong>
                    <p className="forum-meta text-[var(--text-secondary)] mt-1 mb-2">
                      {reportsError}
                    </p>
                    <button
                      type="button"
                      onClick={handleRetryReports}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 forum-meta font-semibold rounded bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
                    >
                      Tentar novamente
                    </button>
                  </div>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center gap-2">
                  <Inbox className="w-8 h-8 text-[var(--text-muted)]" />
                  <h4 className="forum-title text-[var(--text-primary)] m-0">
                    Nenhuma denúncia registrada
                  </h4>
                  <p className="forum-meta text-[var(--text-muted)] max-w-sm m-0">
                    Quando um membro denunciar um tópico ou comentário, a denúncia aparece
                    aqui com quem denunciou, o motivo e o conteúdo denunciado.
                  </p>
                </div>
              ) : (
                hydratedReports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 forum-meta font-semibold rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] uppercase">
                          {report.kind === 'thread' ? 'Tópico' : 'Comentário'}
                        </span>
                        <span
                          className={`px-2 py-0.5 forum-meta font-semibold rounded ${
                            report.status === 'open'
                              ? 'bg-[var(--feedback-warning)] text-[var(--text-inverse)]'
                              : report.status === 'reviewed'
                              ? 'bg-[var(--feedback-success)] text-[var(--text-inverse)]'
                              : 'bg-[var(--bg-surface-elevated)] text-[var(--text-muted)]'
                          }`}
                        >
                          {report.status === 'open'
                            ? 'Pendente'
                            : report.status === 'reviewed'
                            ? 'Resolvida'
                            : 'Ignorada'}
                        </span>
                      </div>
                      <span className="forum-meta text-[var(--text-muted)] forum-num">
                        {report.createdAt?.toDate
                          ? report.createdAt.toDate().toLocaleDateString('pt-BR')
                          : ''}
                      </span>
                    </div>

                    <ReporterBlock
                      profile={reporterProfiles[report.reporterId]}
                      fallbackId={report.reporterId}
                    />

                    <TargetBlock report={report} />

                    <p className="forum-body text-[var(--text-primary)] m-0 font-medium">
                      Motivo: &quot;{report.reason}&quot;
                    </p>

                    {report.status === 'open' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                        <button
                          type="button"
                          onClick={() => handleReviewReportAction(report.id, 'dismissed')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 forum-meta font-semibold rounded bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Descartar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewReportAction(report.id, 'reviewed')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 forum-meta font-semibold rounded bg-[var(--feedback-success)] text-[var(--text-inverse)] cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Marcar como resolvida
                        </button>
                      </div>
                    )}
                    {report.status !== 'open' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                        <button
                          type="button"
                          onClick={() => handleReopenReport(report.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 forum-meta font-semibold rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reabrir
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {reportsToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-[60] max-w-sm toast-transition flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            reportsToast.type === 'success'
              ? 'bg-[var(--bg-surface-elevated)] border-[var(--feedback-success)]'
              : 'bg-[var(--bg-surface-elevated)] border-[var(--feedback-error)]'
          }`}
        >
          {reportsToast.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-[var(--feedback-success)] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-[var(--feedback-error)] shrink-0 mt-0.5" />
          )}
          <p className="forum-body text-[var(--text-primary)] m-0 flex-1">
            {reportsToast.text}
          </p>
          <button
            type="button"
            onClick={() => setReportsToast(null)}
            className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded cursor-pointer"
            aria-label="Fechar notificação"
          >
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
