import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import UserIcon from 'lucide-react/dist/esm/icons/user';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import {
  Forum,
  ForumThread,
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

type SortOption = 'recent' | 'active' | 'voted';
type FilterOption = 'solved' | 'pinned' | 'unanswered';

function sumReactions(thread: ForumThread): number {
  return Object.values(thread.reactionCounts || {}).reduce(
    (acc, cur) => acc + (typeof cur === 'number' ? cur : 0),
    0
  );
}

const reporterProfileCache = new Map<string, Promise<UserProfile | null>>();

function getCachedReporterProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return Promise.resolve(null);
  if (!reporterProfileCache.has(uid)) {
    reporterProfileCache.set(uid, getUserProfile(uid));
  }
  return reporterProfileCache.get(uid)!;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const TargetStatusBadge: React.FC<{ status: ForumReportTargetStatus | undefined }> = ({
  status,
}) => {
  const config: Record<ForumReportTargetStatus, { label: string; cls: string }> = {
    active: {
      label: 'Ativo',
      cls: 'bg-[color-mix(in_srgb,var(--feedback-success)_14%,transparent)] text-[var(--feedback-success)]',
    },
    edited: {
      label: 'Editado',
      cls: 'bg-[color-mix(in_srgb,var(--feedback-warning)_14%,transparent)] text-[var(--feedback-warning)]',
    },
    'deleted-by-author': {
      label: 'Excluído pelo autor',
      cls: 'bg-[color-mix(in_srgb,var(--feedback-error)_14%,transparent)] text-[var(--feedback-error)]',
    },
    'removed-by-moderator': {
      label: 'Removido pelo moderador',
      cls: 'bg-[color-mix(in_srgb,var(--feedback-error)_14%,transparent)] text-[var(--feedback-error)]',
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
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[0.6875rem] leading-4 font-bold rounded-full uppercase tracking-wider ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
};

const ReporterBlock: React.FC<{
  profile: UserProfile | null | undefined;
  fallbackId: string;
}> = ({ profile, fallbackId }) => {
  const isAnonymous = !fallbackId && !profile;

  if (isAnonymous) {
    return (
      <div className="px-2.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-2.5">
        <div
          aria-hidden="true"
          className="w-[30px] h-[30px] rounded-full border border-dashed border-[var(--border-default)] text-[var(--text-muted)] flex items-center justify-center bg-transparent shrink-0"
        >
          <UserIcon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col">
          <div className="flex items-baseline gap-1.5 flex-wrap forum-body">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Denunciante
            </span>
            <span className="font-bold text-[var(--text-primary)]">Anônimo</span>
          </div>
          <div className="forum-meta text-[var(--text-muted)]">
            Identidade não divulgada aos moderadores
          </div>
        </div>
      </div>
    );
  }

  const name =
    profile?.displayName || (fallbackId ? `membro-${fallbackId.slice(0, 5)}` : 'Membro');
  const handle = profile?.handle ? `@${profile.handle}` : null;
  const role = profile?.primaryGroup?.name || 'Membro';
  const initials = getInitials(name) || '?';
  const customColor = profile?.primaryGroup?.color;

  return (
    <div className="px-2.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-2.5">
      <div
        aria-hidden="true"
        className="w-[30px] h-[30px] rounded-full border overflow-hidden flex items-center justify-center shrink-0 text-[11px] font-bold tracking-wide bg-[color-mix(in_srgb,var(--brand-primary)_16%,transparent)] text-[var(--brand-primary)] border-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)]"
        style={
          customColor
            ? {
                borderColor: customColor,
                color: customColor,
                backgroundColor: `color-mix(in srgb, ${customColor} 16%, transparent)`,
              }
            : undefined
        }
      >
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-baseline gap-1.5 flex-wrap forum-body">
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Denunciante
          </span>
          <span className="font-bold text-[var(--text-primary)] truncate">{name}</span>
        </div>
        <div className="flex items-center gap-1.5 forum-meta text-[var(--text-muted)] flex-wrap">
          {handle && (
            <>
              <span className="truncate">{handle}</span>
              <span className="opacity-70">·</span>
            </>
          )}
          <span className="truncate">{role}</span>
        </div>
      </div>
    </div>
  );
};

const TargetBlock: React.FC<{
  report: HydratedReport;
  onViewMessage: () => void;
}> = ({ report, onViewMessage }) => {
  const [expanded, setExpanded] = useState(false);
  const rawTitle = report.targetSnapshot?.title || '';
  const snapBody = report.targetSnapshot?.body || '';
  if (!rawTitle && !snapBody) return null;

  const formattedTitle = !rawTitle
    ? 'Conteúdo denunciado'
    : /^(Tópico:|Comentário)/i.test(rawTitle)
    ? rawTitle
    : report.kind === 'thread'
    ? `Tópico: “${rawTitle}”`
    : `Comentário em “${rawTitle}”`;

  const currentBody = report.currentBody ?? snapBody;
  const isLong = currentBody.length > 180;
  const wasEdited =
    report.targetStatus === 'edited' &&
    report.currentBody !== null &&
    report.currentBody !== snapBody;

  return (
    <div className="px-3 py-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[0.8125rem] leading-5 font-bold text-[var(--text-primary)] truncate">
          {formattedTitle}
        </span>
        <TargetStatusBadge status={report.targetStatus} />
      </div>
      {currentBody && (
        <p
          className={`text-[0.8125rem] leading-5 text-[var(--text-secondary)] m-0 whitespace-pre-wrap ${
            isLong && !expanded ? 'line-clamp-4' : ''
          }`}
        >
          {currentBody}
        </p>
      )}
      {isLong && (
        <div className="flex items-center gap-2.5 flex-wrap forum-meta text-[var(--text-muted)]">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="border-0 bg-transparent text-[var(--brand-primary)] font-bold forum-meta cursor-pointer p-0 underline underline-offset-2"
          >
            {expanded ? 'Recolher' : 'Expandir'}
          </button>
        </div>
      )}
      {wasEdited && (
        <details className="group mt-1 border border-[var(--border-subtle)] rounded-md overflow-hidden">
          <summary className="list-none [&::-webkit-details-marker]:hidden cursor-pointer px-2.5 py-1.5 forum-meta font-bold text-[var(--text-secondary)] bg-[var(--bg-surface-elevated)] flex items-center gap-1.5 select-none">
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-150 group-open:rotate-90"
            >
              ▸
            </span>
            Ver alterações
          </summary>
          <pre className="m-0 px-2.5 py-2 font-mono forum-meta leading-[1.35rem] overflow-x-auto whitespace-pre-wrap text-[var(--text-secondary)] bg-[var(--bg-default)]">
            {'Antes:\n'}
            {snapBody}
            {'\n\nDepois:\n'}
            {currentBody}
          </pre>
        </details>
      )}
      <div className="flex items-center justify-end mt-1">
        <button
          type="button"
          onClick={onViewMessage}
          className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] hover:underline transition-colors cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver mensagem
        </button>
      </div>
    </div>
  );
};

export const ForumView: React.FC<ForumViewProps> = ({ forum }) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([]);
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
  const [busyReport, setBusyReport] = useState<{
    id: string;
    action: 'dismissed' | 'reviewed' | 'reopen';
  } | null>(null);
  const [reportsToast, setReportsToast] = useState<{
    type: 'success' | 'error';
    text: string;
    undoSnapshot?: ForumReport;
  } | null>(null);

  const { threads, loading, error, reload } = useForumThreads(forum.id, selectedCategory);
  const hydratedReports = useMemo(() => hydrateReports(reports, threads), [reports, threads]);
  const pendingReportsCount = useMemo(
    () => reports.filter((r) => r.status === 'open').length,
    [reports]
  );

  const solvedCount = useMemo(
    () =>
      threads.filter((t) => Boolean(forum.features?.solution && t.solutionCommentId)).length,
    [threads, forum.features?.solution]
  );
  const pinnedCount = useMemo(
    () => threads.filter((t) => Boolean(t.isPinned)).length,
    [threads]
  );
  const unansweredCount = useMemo(
    () => threads.filter((t) => (t.commentCount || 0) === 0).length,
    [threads]
  );

  const displayedThreads = useMemo(() => {
    let list = [...threads];

    if (activeFilters.includes('solved')) {
      list = list.filter((t) => Boolean(forum.features?.solution && t.solutionCommentId));
    }
    if (activeFilters.includes('pinned')) {
      list = list.filter((t) => Boolean(t.isPinned));
    }
    if (activeFilters.includes('unanswered')) {
      list = list.filter((t) => (t.commentCount || 0) === 0);
    }

    if (sortBy === 'recent') {
      list.sort((a, b) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
    } else if (sortBy === 'active') {
      list.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
    } else if (sortBy === 'voted') {
      list.sort((a, b) => sumReactions(b) - sumReactions(a));
    }

    if (!activeFilters.includes('pinned')) {
      list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    }

    return list;
  }, [threads, activeFilters, sortBy, forum.features?.solution]);

  const toggleFilter = (filter: FilterOption) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

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
        'Falha de conexão com o servidor. Verifique sua rede e tente novamente.'
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

  useEffect(() => {
    if (!showReportsModal || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyReport) {
        e.preventDefault();
        setReportsToast(null);
        setShowReportsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showReportsModal, busyReport]);

  useEffect(() => {
    if (!reportsToast) return;
    const timer = window.setTimeout(() => {
      setReportsToast(null);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [reportsToast]);

  const showReportsToast = (
    text: string,
    type: 'success' | 'error',
    undoSnapshot?: ForumReport
  ) => {
    setReportsToast({ text, type, undoSnapshot });
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
        'Falha de conexão com o servidor. Verifique sua rede e tente novamente.'
      );
    } finally {
      setLoadingReports(false);
    }
  };

  const handleReviewReportAction = async (
    reportId: string,
    status: 'reviewed' | 'dismissed'
  ) => {
    if (!user || busyReport?.id === reportId) return;
    const prev = reports.find((r) => r.id === reportId);
    if (!prev) return;
    const rawTitle = prev.targetSnapshot?.title || 'conteúdo denunciado';
    const tgtTitle = rawTitle
      .replace(/^Tópico:\s*/i, '')
      .replace(/^Comentário em\s*/i, '');
    const repProfile = reporterProfiles[prev.reporterId];
    const who = !prev.reporterId
      ? 'denunciante anônimo'
      : repProfile?.displayName || `membro-${prev.reporterId.slice(0, 5)}`;

    setBusyReport({ id: reportId, action: status });

    try {
      await reviewReport(reportId, status, user.uid);
      setReports((list) =>
        list.map((r) => (r.id === reportId ? { ...r, status, reviewedBy: user.uid } : r))
      );
      showReportsToast(
        status === 'reviewed'
          ? `Denúncia sobre "${tgtTitle}" resolvida (${who}).`
          : `Denúncia sobre "${tgtTitle}" descartada (${who}).`,
        'success',
        prev
      );
    } catch (err) {
      console.error('Failed to review report:', err);
      setReports((list) => list.map((r) => (r.id === reportId ? prev : r)));
      showReportsToast('Não foi possível atualizar a denúncia. Tente novamente.', 'error');
    } finally {
      setBusyReport(null);
    }
  };

  const handleReopenReport = async (reportId: string) => {
    if (!user || busyReport?.id === reportId) return;
    const prev = reports.find((r) => r.id === reportId);
    if (!prev) return;
    setBusyReport({ id: reportId, action: 'reopen' });
    setReports((list) =>
      list.map((r) =>
        r.id === reportId ? { ...r, status: 'open', reviewedBy: null, reviewedAt: null } : r
      )
    );
    try {
      await reopenReport(reportId);
      showReportsToast('Denúncia reaberta.', 'success', prev);
    } catch (err) {
      console.error('Failed to reopen report:', err);
      setReports((list) => list.map((r) => (r.id === reportId ? prev : r)));
      showReportsToast('Não foi possível reabrir a denúncia. Tente novamente.', 'error');
    } finally {
      setBusyReport(null);
    }
  };

  const handleUndoToast = async () => {
    if (!user || !reportsToast?.undoSnapshot) return;
    const snapshot = reportsToast.undoSnapshot;
    setReportsToast(null);
    setReports((list) => list.map((r) => (r.id === snapshot.id ? snapshot : r)));
    try {
      if (snapshot.status === 'open') {
        await reopenReport(snapshot.id);
      } else {
        await reviewReport(snapshot.id, snapshot.status, user.uid);
      }
    } catch (err) {
      console.error('Failed to undo report review:', err);
      showReportsToast('Não foi possível desfazer a ação.', 'error');
    }
  };

  return (
    <div className="forum-screen-fade">
      {/* Page Actions: Breadcrumb & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
        <Link
          to="/forum"
          className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors whitespace-nowrap self-start"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Todos os fóruns
        </Link>

        <div className="flex items-center justify-end gap-2">
          {allowReviewReports && forum.features?.reports && (
            <button
              type="button"
              onClick={handleOpenReports}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[12px] font-semibold border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[var(--feedback-warning)]" />
              Denúncias
            </button>
          )}

          {allowCreate && !isCreatingThread && (
            <button
              type="button"
              onClick={() => setIsCreatingThread(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[12px] font-semibold border border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] hover:border-[var(--brand-primary-hover)] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo tópico
            </button>
          )}
        </div>
      </div>

      {/* Left-Aligned Forum Header */}
      <div className="flex flex-col items-start gap-4 p-6 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[12px] mb-6">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[1.75rem] leading-[1.2] font-bold text-[var(--text-primary)] m-0">
            {forum.title}
          </h1>
          {forum.description && (
            <p className="text-[0.875rem] text-[var(--text-secondary)] leading-[1.5] max-w-[600px] m-0">
              {forum.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap forum-meta text-[var(--text-muted)]">
          {forum.focus && (
            <>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <span>Fórum: {forum.focus}</span>
              </div>
              <span className="text-[var(--border-default)]">·</span>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <span>
              <span className="forum-num">{threads.length}</span>{' '}
              {threads.length === 1 ? 'tópico' : 'tópicos'}
            </span>
          </div>
        </div>
      </div>

      {/* New Thread Form (when active) */}
      {isCreatingThread && (
        <div className="mb-6">
          <NewThreadForm
            forum={forum}
            onSave={handleCreateThread}
            onCancel={() => setIsCreatingThread(false)}
            saving={savingThread}
          />
        </div>
      )}

      {/* Internal Categories Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
            selectedCategory === null
              ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] border-[var(--brand-primary)]'
              : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]'
          }`}
        >
          Todos os tópicos
        </button>
        {forum.categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)] border-[var(--brand-primary)]'
                : 'bg-transparent text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap px-3 py-2 mb-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px]">
        <div
          className="flex gap-0.5 bg-[var(--bg-default)] p-[3px] rounded-[7px] border border-[var(--border-subtle)] shrink-0 self-start sm:self-auto"
          role="tablist"
          aria-label="Ordenar tópicos"
        >
          {(
            [
              { key: 'recent', label: 'Recentes' },
              { key: 'active', label: 'Ativos' },
              { key: 'voted', label: 'Votados' },
            ] as const
          ).map((tab) => {
            const isActive = sortBy === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSortBy(tab.key)}
                className={`flex items-center justify-center h-6 px-3 rounded-[5px] text-[11.5px] font-medium leading-none cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[var(--sombra-1)]'
                    : 'bg-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="hidden sm:block w-px h-5 bg-[var(--border-subtle)] shrink-0" />

        <div className="flex gap-1.5 flex-wrap flex-1 min-w-0 items-center">
          {(
            [
              { key: 'solved', label: 'Resolvidos', count: solvedCount },
              { key: 'pinned', label: 'Fixados', count: pinnedCount },
              { key: 'unanswered', label: 'Sem resposta', count: unansweredCount },
            ] as const
          ).map((chip) => {
            const isActive = activeFilters.includes(chip.key);
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => toggleFilter(chip.key)}
                className={`inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[color-mix(in_srgb,var(--brand-primary)_14%,transparent)] border-[var(--brand-primary)] text-[var(--brand-primary)]'
                    : 'border-[var(--border-default)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-focus)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`inline-flex items-center justify-center h-[18px] min-w-[18px] text-[10px] rounded-full px-[5px] font-semibold leading-none forum-num ${
                    isActive
                      ? 'text-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]'
                      : 'text-[var(--text-muted)] bg-[var(--bg-default)]'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="inline-flex items-center gap-1 h-7 text-[11px] leading-none text-[var(--text-muted)] whitespace-nowrap sm:ml-auto self-end sm:self-auto">
          <strong className="text-[var(--text-secondary)] font-semibold forum-num">
            {displayedThreads.length}
          </strong>{' '}
          de <span className="forum-num">{threads.length}</span>{' '}
          {threads.length === 1 ? 'tópico' : 'tópicos'}
        </span>
      </div>

      {/* Threads List */}
      {error && (
        <div className="p-4 mb-4 rounded-xl bg-[var(--feedback-error)] text-[var(--text-inverse)] forum-body font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] overflow-hidden divide-y divide-[var(--border-subtle)]">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : displayedThreads.length === 0 ? (
        <div className="p-10 rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] text-center">
          <h3 className="forum-title text-[var(--text-primary)] m-0">
            Nenhum tópico encontrado
          </h3>
          <p className="forum-meta text-[var(--text-muted)] mt-1.5 mb-4 max-w-sm mx-auto">
            {activeFilters.length > 0
              ? 'Nenhum tópico corresponde aos filtros selecionados.'
              : selectedCategory
              ? 'Nenhum tópico cadastrado nesta subdivisão interna.'
              : 'Nenhum tópico criado neste fórum. Seja o primeiro a abrir uma discussão!'}
          </p>
          {allowCreate && !isCreatingThread && activeFilters.length === 0 && (
            <button
              type="button"
              onClick={() => setIsCreatingThread(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] text-[12px] font-semibold bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Criar primeiro tópico
            </button>
          )}
        </div>
      ) : (
        <div
          className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[10px] overflow-hidden"
          role="list"
        >
          {displayedThreads.map((thread) => (
            <ThreadListItem key={thread.id} thread={thread} forum={forum} />
          ))}
        </div>
      )}


      {/* Reports Review Modal Portal */}
      {showReportsModal &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget && !busyReport) {
                setReportsToast(null);
                setShowReportsModal(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reports-modal-title"
              className="dialog-transition bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl max-w-[720px] w-full shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4 px-6 pt-4.5 pb-3.5 border-b border-[var(--border-subtle)] shrink-0">
                <div>
                  <h3 id="reports-modal-title" className="forum-title text-[var(--text-primary)] m-0">
                    Denúncias do Fórum
                  </h3>
                  <p className="forum-meta text-[var(--text-muted)] mt-0.5 mb-0">
                    Análise e resolução de denúncias enviadas pelos membros.
                    <span className="mx-1">·</span>
                    <span className="forum-num">
                      {loadingReports || reportsError ? '—' : pendingReportsCount}
                    </span>{' '}
                    {!loadingReports && !reportsError && pendingReportsCount === 1
                      ? 'pendente'
                      : 'pendentes'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReportsToast(null);
                    setShowReportsModal(false);
                  }}
                  className="px-2 py-1.5 text-base leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)] rounded-md transition-colors cursor-pointer"
                  aria-label="Fechar denúncias"
                >
                  ✕
                </button>
              </div>

              <div
                aria-busy={loadingReports}
                className="flex-1 min-h-0 overflow-y-auto px-6 pt-3.5 pb-5 flex flex-col gap-3"
              >
                {loadingReports ? (
                  <>
                    <p className="sr-only" role="status">
                      Carregando denúncias…
                    </p>
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        aria-hidden="true"
                        className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] flex flex-col gap-2.5 animate-pulse"
                      >
                        <div className="flex justify-between">
                          <span className="h-[18px] w-[120px] rounded bg-[var(--bg-surface)]" />
                          <span className="h-[18px] w-[80px] rounded bg-[var(--bg-surface)]" />
                        </div>
                        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                          <span className="w-[30px] h-[30px] rounded-full bg-[var(--bg-surface-elevated)] shrink-0" />
                          <div className="flex flex-col gap-1.5 flex-1">
                            <span className="h-2.5 w-1/2 rounded bg-[var(--bg-surface-elevated)]" />
                            <span className="h-2.5 w-[30%] rounded bg-[var(--bg-surface-elevated)]" />
                          </div>
                        </div>
                        <span className="h-2.5 w-[90%] rounded bg-[var(--bg-surface-elevated)]" />
                      </div>
                    ))}
                  </>
                ) : reportsError ? (
                  <div
                    role="alert"
                    className="p-3.5 rounded-lg bg-[color-mix(in_srgb,var(--feedback-error)_12%,transparent)] border border-[var(--feedback-error)] flex items-start gap-3"
                  >
                    <AlertCircle
                      aria-hidden="true"
                      className="w-4 h-4 text-[var(--feedback-error)] shrink-0 mt-0.5"
                    />
                    <div>
                      <strong className="block forum-body font-semibold text-[var(--text-primary)]">
                        Não foi possível carregar as denúncias.
                      </strong>
                      <p className="text-[0.8125rem] leading-5 text-[var(--text-secondary)] mt-0.5 mb-0">
                        {reportsError}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRetryReports}
                      className="ml-auto self-center shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 forum-meta font-semibold rounded-md bg-transparent border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                    >
                      Tentar novamente
                    </button>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-9 px-4 text-center flex flex-col items-center gap-1.5">
                    <Inbox
                      aria-hidden="true"
                      className="w-[30px] h-[30px] text-[var(--text-muted)] mb-1"
                    />
                    <h4 className="forum-title text-[var(--text-primary)] m-0">
                      Nenhuma denúncia registrada
                    </h4>
                    <p className="forum-body text-[var(--text-muted)] max-w-[380px] m-0">
                      Quando um membro denunciar um tópico ou comentário, a denúncia aparece
                      aqui com quem denunciou, o motivo e o conteúdo denunciado.
                    </p>
                  </div>
                ) : (
                  hydratedReports.map((report) => {
                    const isBusy = busyReport?.id === report.id;
                    const isDismissing = isBusy && busyReport?.action === 'dismissed';
                    const isResolving = isBusy && busyReport?.action === 'reviewed';

                    return (
                      <article
                        key={report.id}
                        className="p-3.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 forum-meta font-semibold rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] uppercase tracking-wide">
                              {report.kind === 'thread' ? 'Tópico' : 'Comentário'}
                            </span>
                            <span
                              className={`px-2 py-0.5 forum-meta font-semibold rounded transition-colors ${
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
                          <time className="forum-meta text-[var(--text-muted)] forum-num shrink-0">
                            {report.createdAt?.toDate
                              ? report.createdAt.toDate().toLocaleDateString('pt-BR')
                              : ''}
                          </time>
                        </div>

                        <ReporterBlock
                          profile={reporterProfiles[report.reporterId]}
                          fallbackId={report.reporterId}
                        />

                        <TargetBlock
                          report={report}
                          onViewMessage={() => {
                            const targetThreadId =
                              report.kind === 'thread'
                                ? report.targetId || report.itemId
                                : report.threadId || report.targetId || report.itemId;
                            const basePath = `/forum/${forum.slug}/${targetThreadId}`;
                            const hash =
                              report.kind === 'comment'
                                ? `#comment-${report.targetId || report.itemId}`
                                : '';
                            navigate(`${basePath}${hash}`);
                            setShowReportsModal(false);
                          }}
                        />

                        <p className="forum-body text-[var(--text-primary)] m-0 font-medium">
                          Motivo: “{report.reason}”
                        </p>

                        {report.status === 'open' && (
                          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-[var(--border-subtle)]">
                            <button
                              type="button"
                              disabled={isBusy}
                              aria-disabled={isBusy}
                              onClick={() => handleReviewReportAction(report.id, 'dismissed')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 forum-meta font-semibold rounded-md bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-subtle)] hover:enabled:text-[var(--text-primary)] hover:enabled:bg-[var(--bg-surface-elevated)] disabled:opacity-65 disabled:cursor-default transition-colors cursor-pointer"
                            >
                              {isDismissing ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                                  Descartando…
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                  Descartar
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              aria-disabled={isBusy}
                              onClick={() => handleReviewReportAction(report.id, 'reviewed')}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 forum-meta font-semibold rounded-md bg-[var(--feedback-success)] text-[var(--text-inverse)] hover:enabled:brightness-105 disabled:opacity-65 disabled:cursor-default transition-all cursor-pointer"
                            >
                              {isResolving ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                                  Resolvendo…
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                  Marcar como resolvida
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        {report.status !== 'open' && (
                          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-[var(--border-subtle)]">
                            <button
                              type="button"
                              disabled={isBusy}
                              aria-disabled={isBusy}
                              onClick={() => handleReopenReport(report.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 forum-meta font-semibold rounded-md bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:enabled:text-[var(--text-primary)] hover:enabled:bg-[var(--bg-surface-elevated)] disabled:opacity-65 disabled:cursor-default transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                              Reabrir
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      {reportsToast &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="status"
            aria-live="polite"
            className={`fixed bottom-6 right-6 z-[70] max-w-[380px] toast-transition flex items-start gap-2.5 px-3.5 py-3 rounded-[10px] shadow-2xl border ${
              reportsToast.type === 'success'
                ? 'bg-[var(--bg-surface-elevated)] border-[var(--border-default)]'
                : 'bg-[var(--bg-surface-elevated)] border-[var(--feedback-error)]'
            }`}
          >
            {reportsToast.type === 'success' ? (
              <CheckCircle
                aria-hidden="true"
                className="w-4 h-4 text-[var(--feedback-success)] shrink-0 mt-0.5"
              />
            ) : (
              <AlertCircle
                aria-hidden="true"
                className="w-4 h-4 text-[var(--feedback-error)] shrink-0 mt-0.5"
              />
            )}
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <p className="text-[0.8125rem] leading-5 text-[var(--text-primary)] m-0">
                {reportsToast.text}
              </p>
              {reportsToast.undoSnapshot && (
                <button
                  type="button"
                  onClick={handleUndoToast}
                  className="self-start border-0 bg-transparent text-[var(--brand-primary)] font-bold text-[0.8125rem] cursor-pointer p-0 underline underline-offset-2"
                >
                  Desfazer
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setReportsToast(null)}
              className="px-0.5 text-sm leading-none text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded cursor-pointer ml-0.5"
              aria-label="Fechar aviso"
            >
              ✕
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};
