import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import ShieldAlert from 'lucide-react/dist/esm/icons/shield-alert';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import { Forum, ForumThreadFormData, ForumReport } from '../../types/forum';
import { useAuth } from '../../context/AuthContext';
import { useForumThreads } from '../../hooks/useForumThreads';
import { canCreateThread, canReviewReports } from '../../lib/forumPermissions';
import { createThread } from '../../lib/forumThreads';
import { listReports, reviewReport } from '../../lib/forumReports';
import { ThreadListItem } from './ThreadListItem';
import { NewThreadForm } from './NewThreadForm';

interface ForumViewProps {
  forum: Forum;
}

export const ForumView: React.FC<ForumViewProps> = ({ forum }) => {
  const { user, profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [savingThread, setSavingThread] = useState(false);

  // Reports review modal state
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

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
    try {
      const data = await listReports(forum.id);
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleReviewReportAction = async (reportId: string, status: 'reviewed' | 'dismissed') => {
    if (!user) return;
    try {
      await reviewReport(reportId, status, user.uid);
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status, reviewedBy: user.uid } : r))
      );
    } catch (err) {
      console.error('Failed to review report:', err);
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
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="forum-title text-[var(--text-primary)] m-0">
                  Denúncias do Fórum
                </h3>
                <p className="forum-meta text-[var(--text-muted)] mt-0.5 mb-0">
                  Análise e resolução de denúncias enviadas pelos membros.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReportsModal(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer forum-title"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingReports ? (
                <div className="p-6 text-center forum-meta text-[var(--text-muted)]">
                  Carregando denúncias...
                </div>
              ) : reports.length === 0 ? (
                <div className="p-8 text-center forum-meta text-[var(--text-muted)]">
                  Nenhuma denúncia registrada para este fórum.
                </div>
              ) : (
                reports.map((report) => (
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
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
