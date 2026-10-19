import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import Pin from 'lucide-react/dist/esm/icons/pin';
import Lock from 'lucide-react/dist/esm/icons/lock';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import FolderInput from 'lucide-react/dist/esm/icons/folder-input';
import CornerDownRight from 'lucide-react/dist/esm/icons/corner-down-right';
import Quote from 'lucide-react/dist/esm/icons/quote';
import Smile from 'lucide-react/dist/esm/icons/smile';
import Check from 'lucide-react/dist/esm/icons/check';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Users from 'lucide-react/dist/esm/icons/users';
import Info from 'lucide-react/dist/esm/icons/info';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import History from 'lucide-react/dist/esm/icons/history';
import X from 'lucide-react/dist/esm/icons/x';
import {
  Forum,
  ForumThread,
  ForumComment,
  ForumCommentFormData,
  ThreadRevision,
} from '../../types/forum';
import { useAuth } from '../../context/AuthContext';
import {
  canComment,
  canEditThread,
  canDeleteThread,
  canEditComment,
  canDeleteComment,
  canPinThread,
  canLockThread,
  canMoveThread,
  canRemoveThread,
  canMarkSolution,
  canReact,
  canReport,
} from '../../lib/forumPermissions';
import {
  updateThread,
  restoreThreadRevision,
  getThreadRevisions,
  moderateThread,
  createComment,
  updateComment,
  deleteComment,
  setSolutionComment,
} from '../../lib/forumThreads';
import {
  toggleReaction,
  getUserReaction,
  FORUM_REACTIONS,
  REACTION_ICONS,
} from '../../lib/forumReactions';
import { createReport } from '../../lib/forumReports';
import { getUserProfile } from '../../lib/profile';
import { UserProfile } from '../../types/profile';
import { CommentForm } from './CommentForm';
import { Chip } from '../chip/Chip';
import { MarkdownBody } from './MarkdownBody';

interface ThreadViewProps {
  forum: Forum;
  thread: ForumThread;
  comments: ForumComment[];
  onReload: () => Promise<void>;
}

const profileCache = new Map<string, Promise<UserProfile | null>>();

function getCachedProfile(uid: string): Promise<UserProfile | null> {
  if (!profileCache.has(uid)) {
    profileCache.set(uid, getUserProfile(uid));
  }
  return profileCache.get(uid)!;
}

export const ThreadView: React.FC<ThreadViewProps> = ({
  forum,
  thread,
  comments,
  onReload,
}) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Author profile of the main thread
  const [threadAuthor, setThreadAuthor] = useState<UserProfile | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (thread.authorId) {
      getCachedProfile(thread.authorId).then((prof) => {
        if (isMounted) setThreadAuthor(prof);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [thread.authorId]);

  // Permissions
  const allowComment = canComment(forum, user, profile, thread);
  const allowEditThread = canEditThread(forum, thread, user, profile);
  const allowDeleteThread = canDeleteThread(forum, thread, user, profile);
  const allowPin = canPinThread(forum, user, profile);
  const allowLock = canLockThread(forum, user, profile);
  const allowMove = canMoveThread(forum, user, profile);
  const allowRemoveThread = canRemoveThread(forum, user, profile);
  const allowSolution = canMarkSolution(forum, thread, user, profile);
  const allowReact = canReact(forum, user, profile);
  const allowReport = canReport(forum, user, profile);

  // States
  const [savingComment, setSavingComment] = useState(false);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyQuote, setReplyQuote] = useState<{ id: string; text: string } | null>(null);

  // Edit thread modal & history states (SPEC-0004)
  const [isEditingThread, setIsEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [editBody, setEditBody] = useState(thread.body);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(thread.categoryId);
  const [editReason, setEditReason] = useState('');
  const [savingThreadEdit, setSavingThreadEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showRollbackConfirm, setShowRollbackConfirm] = useState<ThreadRevision | null>(null);
  const [restoringRevision, setRestoringRevision] = useState(false);
  const [revisions, setRevisions] = useState<ThreadRevision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);

  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  const isStaffOrModerator = Boolean(profile?.isStaff || profile?.effectivePermissions?.manageForum);
  const isAuthor = Boolean(user && thread.authorId === user.uid);
  const isEditWindowExpired =
    !isStaffOrModerator &&
    Boolean(thread.createdAt && Date.now() - thread.createdAt.toMillis() > 2 * 3600 * 1000);
  const canViewHistory = isStaffOrModerator || isAuthor;
  const canRestoreHistory = isStaffOrModerator;

  // Move thread modal
  const [isMovingThread, setIsMovingThread] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string | null>(thread.categoryId);

  // Edit comment state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentBody, setEditingCommentBody] = useState('');

  // Report modal state
  const [reportingItem, setReportingItem] = useState<{
    kind: 'thread' | 'comment';
    id: string;
  } | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

  // Reactions state for current user
  const [threadUserReaction, setThreadUserReaction] = useState<string | null>(null);
  const [showThreadReactionPicker, setShowThreadReactionPicker] = useState(false);

  useEffect(() => {
    if (user && forum.features?.reactions) {
      getUserReaction(user.uid, 'thread', thread.id).then(setThreadUserReaction);
    }
  }, [user, forum.features?.reactions, thread.id]);

  // Participants list (unique authors)
  const participantIds = useMemo(() => {
    const set = new Set<string>();
    if (thread.authorId) set.add(thread.authorId);
    comments.forEach((c) => {
      if (c.authorId) set.add(c.authorId);
    });
    return Array.from(set);
  }, [thread.authorId, comments]);

  const [participants, setParticipants] = useState<UserProfile[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all(participantIds.map((id) => getCachedProfile(id))).then((results) => {
      if (isMounted) {
        setParticipants(results.filter((p): p is UserProfile => p !== null));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [participantIds]);

  // Moderation handlers
  const handleTogglePin = async () => {
    if (!user) return;
    try {
      await moderateThread(thread.id, thread.isPinned ? 'unpin' : 'pin', user.uid);
      await onReload();
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const handleToggleLock = async () => {
    if (!user) return;
    try {
      await moderateThread(thread.id, thread.isLocked ? 'unlock' : 'lock', user.uid);
      await onReload();
    } catch (err) {
      console.error('Failed to toggle lock:', err);
    }
  };

  const handleToggleRemove = async () => {
    if (!user) return;
    try {
      await moderateThread(
        thread.id,
        thread.isRemoved ? 'restore' : 'remove',
        user.uid
      );
      if (!thread.isRemoved) {
        navigate(`/forum/${forum.slug}`);
      } else {
        await onReload();
      }
    } catch (err) {
      console.error('Failed to toggle remove:', err);
    }
  };

  const handleSaveMove = async () => {
    if (!user) return;
    try {
      await moderateThread(thread.id, 'move', user.uid, { categoryId: targetCategory });
      setIsMovingThread(false);
      await onReload();
    } catch (err) {
      console.error('Failed to move thread:', err);
    }
  };

  const openEditModal = () => {
    setEditTitle(thread.title);
    setEditBody(thread.body);
    setEditCategoryId(thread.categoryId);
    setEditReason('');
    setEditError(null);
    setShowDiscardConfirm(false);
    setShowRollbackConfirm(null);
    setIsEditingThread(true);
  };

  const closeEditModal = useCallback(() => {
    setIsEditingThread(false);
    setShowDiscardConfirm(false);
    setShowRollbackConfirm(null);
    setEditError(null);
    if (triggerButtonRef.current) {
      triggerButtonRef.current.focus();
    }
  }, []);

  const isDirty = useMemo(() => {
    return (
      editTitle.trim() !== thread.title.trim() ||
      editBody.trim() !== thread.body.trim() ||
      (editCategoryId ?? null) !== (thread.categoryId ?? null) ||
      editReason.trim().length > 0
    );
  }, [editTitle, editBody, editCategoryId, editReason, thread.title, thread.body, thread.categoryId]);

  const handleAttemptClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      closeEditModal();
    }
  }, [isDirty, closeEditModal]);

  // Carregar histórico ao abrir modal se for autor ou staff (R-13)
  useEffect(() => {
    if (isEditingThread && canViewHistory && user) {
      setLoadingRevisions(true);
      getThreadRevisions(thread.id)
        .then((revs) => setRevisions(revs))
        .catch((err) => {
          console.error('Erro ao carregar revisões:', err);
          setRevisions([]);
        })
        .finally(() => setLoadingRevisions(false));
    }
  }, [isEditingThread, canViewHistory, user, thread.id]);

  // Focus trap acessível e tecla Esc (R-08)
  useEffect(() => {
    if (!isEditingThread) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showRollbackConfirm) {
          setShowRollbackConfirm(null);
          return;
        }
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
          return;
        }
        handleAttemptClose();
        return;
      }

      if (e.key === 'Tab') {
        const container = modalContainerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditingThread, showDiscardConfirm, showRollbackConfirm, handleAttemptClose]);

  // Toast timer (R-09: ~2.8s)
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleSaveThreadEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isEditWindowExpired) {
      setEditError('A janela de edição de 2 horas para este tópico expirou.');
      return;
    }
    if (!editReason.trim()) {
      setEditError('O preenchimento do motivo da edição é obrigatório.');
      return;
    }
    if (!editTitle.trim() || !editBody.trim()) {
      setEditError('Título e mensagem não podem estar vazios.');
      return;
    }
    if (thread.isRemoved) {
      setEditError('Este tópico foi removido por um moderador e não pode ser editado.');
      return;
    }

    setSavingThreadEdit(true);
    setEditError(null);

    try {
      await updateThread(thread.id, {
        title: editTitle.trim(),
        body: editBody.trim(),
        categoryId: editCategoryId,
        reason: editReason.trim(),
        editedBy: user.uid,
        editedByStaff: isStaffOrModerator,
      });

      closeEditModal();
      setToastMessage({
        type: 'success',
        text: 'Alterações salvas com sucesso!',
      });
      await onReload();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao salvar alterações.';
      setEditError(errorMsg);
    } finally {
      setSavingThreadEdit(false);
    }
  };

  const handleConfirmRollback = async () => {
    if (!user || !showRollbackConfirm) return;
    setRestoringRevision(true);
    try {
      await restoreThreadRevision(thread.id, showRollbackConfirm, user.uid, isStaffOrModerator);
      setShowRollbackConfirm(null);
      closeEditModal();
      setToastMessage({
        type: 'success',
        text: 'Versão do tópico restaurada com sucesso!',
      });
      await onReload();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Falha ao restaurar revisão.';
      setToastMessage({
        type: 'error',
        text: errorMsg,
      });
    } finally {
      setRestoringRevision(false);
    }
  };

  // Comments handlers
  const handleCreateComment = async (data: ForumCommentFormData) => {
    if (!user) return;
    setSavingComment(true);
    try {
      await createComment(thread.id, data, user.uid);
      setReplyParentId(null);
      setReplyQuote(null);
      await onReload();
    } finally {
      setSavingComment(false);
    }
  };

  const handleStartEditComment = (comment: ForumComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentBody(comment.body);
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    if (!editingCommentBody.trim()) return;
    try {
      await updateComment(thread.id, commentId, editingCommentBody.trim());
      setEditingCommentId(null);
      await onReload();
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      await deleteComment(thread.id, commentId, user.uid);
      await onReload();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleToggleSolution = async (commentId: string) => {
    try {
      const nextSolution = thread.solutionCommentId === commentId ? null : commentId;
      await setSolutionComment(thread.id, nextSolution);
      await onReload();
    } catch (err) {
      console.error('Failed to set solution:', err);
    }
  };

  // Reactions
  const handleToggleThreadReaction = async (reactionId: string) => {
    if (!user) return;
    setShowThreadReactionPicker(false);
    try {
      const res = await toggleReaction(user.uid, 'thread', thread.id, reactionId);
      setThreadUserReaction(res.reaction);
      await onReload();
    } catch (err) {
      console.error('Failed to react to thread:', err);
    }
  };

  const handleToggleCommentReaction = async (commentId: string, reactionId: string) => {
    if (!user) return;
    try {
      await toggleReaction(user.uid, 'comment', commentId, reactionId, thread.id);
      await onReload();
    } catch (err) {
      console.error('Failed to react to comment:', err);
    }
  };

  // Report submit
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportingItem || !reportReason.trim()) return;
    setSubmittingReport(true);
    try {
      await createReport({
        forumId: forum.id,
        kind: reportingItem.kind,
        itemId: reportingItem.id,
        reporterId: user.uid,
        reason: reportReason.trim(),
      });
      setReportSuccess(true);
      setTimeout(() => {
        setReportingItem(null);
        setReportReason('');
        setReportSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Find solution comment
  const solutionComment = thread.solutionCommentId
    ? comments.find((c) => c.id === thread.solutionCommentId)
    : null;

  // Organize comments based on structure (flat, quoted, nested)
  const isNested = forum.threadStructure === 'nested';
  const rootComments = isNested
    ? comments.filter((c) => !c.parentCommentId)
    : comments;

  const getChildComments = (parentId: string) =>
    comments.filter((c) => c.parentCommentId === parentId);

  const category = forum.categories?.find((c) => c.id === thread.categoryId);

  const authorGroupColor = threadAuthor?.primaryGroup?.color || 'var(--brand-primary)';
  const authorLabel: string | null = threadAuthor?.handle
    ? `@${threadAuthor.handle}`
    : threadAuthor?.displayName || null;
  const authorInitial = threadAuthor?.displayName
    ? threadAuthor.displayName.charAt(0).toUpperCase()
    : null;

  const formattedDate = thread.createdAt?.toDate
    ? thread.createdAt.toDate().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="space-y-6 forum-screen-fade">
      {/* Top back navigation and badges */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to={`/forum/${forum.slug}`}
          className="inline-flex items-center gap-1.5 forum-meta font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para {forum.title}
        </Link>

        <div className="flex items-center gap-2">
          {category && (
            <span className="px-2.5 py-1 forum-meta font-medium rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
              {category.name}
            </span>
          )}
        </div>
      </div>

      {/* Main Layout with Contextual Sidebar (R-05) */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Main Column */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Main thread header card */}
          <div className="p-6 sm:p-8 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-5">
            {/* Badges & Moderation actions */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {thread.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 forum-meta font-semibold rounded-md bg-[var(--brand-primary)] text-[var(--text-on-primary)]">
                      <Pin className="w-3.5 h-3.5" />
                      Fixado
                    </span>
                  )}
                  {thread.isLocked && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 forum-meta font-semibold rounded-md bg-[var(--bg-default)] text-[var(--feedback-warning)] border border-[var(--border-subtle)]">
                      <Lock className="w-3.5 h-3.5" />
                      Trancado
                    </span>
                  )}
                  {thread.isRemoved && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 forum-meta font-semibold rounded-md bg-[var(--feedback-error)] text-[var(--text-inverse)]">
                      <Trash2 className="w-3.5 h-3.5" />
                      Removido
                    </span>
                  )}
                </div>

                <h1 className="forum-page text-[var(--text-primary)] m-0">
                  {thread.title}
                </h1>
              </div>

              {/* Action buttons (Author & Moderation) */}
              <div className="flex items-center gap-1 flex-wrap self-start">
                {allowEditThread && (
                  <button
                    ref={triggerButtonRef}
                    type="button"
                    onClick={openEditModal}
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)] rounded-lg transition-colors cursor-pointer"
                    title="Editar tópico"
                    aria-label="Editar tópico"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {allowPin && (
                  <button
                    type="button"
                    onClick={handleTogglePin}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      thread.isPinned
                        ? 'text-[var(--brand-primary)] bg-[var(--bg-default)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)]'
                    }`}
                    title={thread.isPinned ? 'Desafixar tópico' : 'Fixar tópico'}
                    aria-label={thread.isPinned ? 'Desafixar tópico' : 'Fixar tópico'}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                )}

                {allowLock && (
                  <button
                    type="button"
                    onClick={handleToggleLock}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      thread.isLocked
                        ? 'text-[var(--feedback-warning)] bg-[var(--bg-default)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)]'
                    }`}
                    title={thread.isLocked ? 'Destrancar tópico' : 'Trancar tópico'}
                    aria-label={thread.isLocked ? 'Destrancar tópico' : 'Trancar tópico'}
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                )}

                {allowMove && forum.categories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setTargetCategory(thread.categoryId);
                      setIsMovingThread(true);
                    }}
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)] rounded-lg transition-colors cursor-pointer"
                    title="Mover de subdivisão"
                    aria-label="Mover de subdivisão"
                  >
                    <FolderInput className="w-4 h-4" />
                  </button>
                )}

                {(allowDeleteThread || allowRemoveThread) && (
                  <button
                    type="button"
                    onClick={handleToggleRemove}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      thread.isRemoved
                        ? 'text-[var(--feedback-success)] hover:bg-[var(--bg-default)]'
                        : 'text-[var(--feedback-error)] hover:bg-[var(--bg-default)]'
                    }`}
                    title={thread.isRemoved ? 'Restaurar tópico' : 'Remover tópico'}
                    aria-label={thread.isRemoved ? 'Restaurar tópico' : 'Remover tópico'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {allowReport && (
                  <button
                    type="button"
                    onClick={() => setReportingItem({ kind: 'thread', id: thread.id })}
                    className="p-2 text-[var(--text-muted)] hover:text-[var(--feedback-error)] hover:bg-[var(--bg-default)] rounded-lg transition-colors cursor-pointer"
                    title="Denunciar tópico"
                    aria-label="Denunciar tópico"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Cabeçalho de Autoria Completo (R-05) */}
            <div className="p-3.5 rounded-lg bg-[var(--bg-default)] border border-[var(--border-subtle)] flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full border-2 overflow-hidden flex items-center justify-center bg-[var(--bg-surface)] shrink-0"
                  style={{ borderColor: authorGroupColor }}
                >
                  {threadAuthor?.photoURL ? (
                    <img
                      src={threadAuthor.photoURL}
                      alt={authorLabel ?? ''}
                      className="w-full h-full object-cover"
                    />
                  ) : authorInitial ? (
                    <span
                      className="forum-title font-bold"
                      style={{ color: authorGroupColor }}
                    >
                      {authorInitial}
                    </span>
                  ) : null}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    {authorLabel && (
                      <span className="forum-body font-bold text-[var(--text-primary)]">
                        {authorLabel}
                      </span>
                    )}
                    {threadAuthor?.primaryGroup && (
                      <Chip
                        label={threadAuthor.primaryGroup.name}
                        color={threadAuthor.primaryGroup.color}
                        style={threadAuthor.primaryGroup.chipStyle}
                      />
                    )}
                  </div>
                  {formattedDate && (
                    <span className="forum-meta text-[var(--text-muted)] block">
                      Publicado em {formattedDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Métricas do cabeçalho */}
              <div className="flex items-center gap-3 forum-meta text-[var(--text-muted)]">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="forum-num font-semibold">{thread.commentCount}</span> respostas
                </div>
              </div>
            </div>

            {/* Thread body com peso de leitura (R-05) */}
            <MarkdownBody content={thread.body} className="pt-2" />

            {/* Reações com contagem e picker ancorado (R-05) */}
            {forum.features?.reactions && (
              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center gap-2 flex-wrap relative">
                {FORUM_REACTIONS.map((r) => {
                  const count = thread.reactionCounts?.[r.id] || 0;
                  const isSelected = threadUserReaction === r.id;
                  if (count === 0 && !isSelected) return null;
                  const ReactionIcon = REACTION_ICONS[r.id];
                  return (
                    <button
                      key={r.id}
                      type="button"
                      disabled={!allowReact}
                      onClick={() => handleToggleThreadReaction(r.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 forum-meta rounded-lg border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                        isSelected
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--text-on-primary)] font-bold'
                          : 'border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:border-[var(--border-focus)]'
                      }`}
                    >
                      {ReactionIcon && <ReactionIcon className="w-3.5 h-3.5" />}
                      <span className="forum-num font-semibold">{count}</span>
                    </button>
                  );
                })}

                {allowReact && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowThreadReactionPicker(!showThreadReactionPicker)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-focus)] transition-colors cursor-pointer flex items-center gap-1.5 forum-meta"
                      title="Reagir ao tópico"
                    >
                      <Smile className="w-3.5 h-3.5" />
                      <span>Reagir</span>
                    </button>

                    {showThreadReactionPicker && (
                      <div className="absolute left-0 bottom-full mb-2 p-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-lg flex items-center gap-1 z-20">
                        {FORUM_REACTIONS.map((r) => {
                          const IconComp = REACTION_ICONS[r.id];
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => handleToggleThreadReaction(r.id)}
                              className="p-2 hover:bg-[var(--bg-surface)] text-[var(--brand-primary)] rounded-lg transition-transform hover:scale-125 cursor-pointer"
                              title={r.label}
                            >
                              {IconComp && <IconComp className="w-4 h-4" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Banner de Solução quando o tópico está resolvido (R-05) */}
          {forum.features?.solution && solutionComment && (
            <div className="p-5 sm:p-6 rounded-xl border-2 border-[var(--feedback-success)] bg-[var(--bg-surface)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--feedback-success)]">
                <CheckCircle className="w-5 h-5" />
                <h2 className="forum-title m-0 text-[var(--feedback-success)]">
                  Resposta Marcada como Solução
                </h2>
              </div>
              <MarkdownBody content={solutionComment.body} className="m-0" />
            </div>
          )}

          {/* Seção de respostas */}
          <div className="flex items-center justify-between pt-4">
            <h2 className="forum-title text-[var(--text-primary)] m-0">
              Respostas (<span className="forum-num">{comments.length}</span>)
            </h2>
            <span className="forum-meta text-[var(--text-muted)]">
              Estrutura: {forum.threadStructure === 'nested' ? 'Aninhada' : forum.threadStructure === 'quoted' ? 'Com citações' : 'Plana'}
            </span>
          </div>

          {/* Lista de Comentários */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="p-8 rounded-xl border border-dashed border-[var(--border-default)] text-center bg-[var(--bg-surface)]">
                <p className="forum-meta text-[var(--text-muted)] m-0">
                  Nenhuma resposta publicada ainda. Seja o primeiro a participar da conversa!
                </p>
              </div>
            ) : (
              rootComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  forum={forum}
                  thread={thread}
                  comment={comment}
                  childComments={isNested ? getChildComments(comment.id) : []}
                  onQuote={(qComment) => setReplyQuote({ id: qComment.id, text: qComment.body })}
                  onReplyParent={(parentId) => setReplyParentId(parentId)}
                  onToggleSolution={handleToggleSolution}
                  onStartEdit={handleStartEditComment}
                  onDelete={handleDeleteComment}
                  onReact={handleToggleCommentReaction}
                  onReport={(id) => setReportingItem({ kind: 'comment', id })}
                  isSolution={thread.solutionCommentId === comment.id}
                  allowSolution={allowSolution}
                  allowReact={allowReact}
                  allowReport={allowReport}
                  isEditing={editingCommentId === comment.id}
                  editingBody={editingCommentBody}
                  onEditingBodyChange={setEditingCommentBody}
                  onSaveEdit={handleSaveCommentEdit}
                  onCancelEdit={() => setEditingCommentId(null)}
                />
              ))
            )}
          </div>

          {/* Composer com Toolbar de Ícones (R-05) */}
          {allowComment ? (
            <div className="pt-4">
              <CommentForm
                onSave={handleCreateComment}
                saving={savingComment}
                parentCommentId={replyParentId}
                quoteCommentId={replyQuote?.id}
                quoteText={replyQuote?.text}
                onClearReply={() => {
                  setReplyParentId(null);
                  setReplyQuote(null);
                }}
              />
            </div>
          ) : thread.isLocked ? (
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-center forum-meta text-[var(--feedback-warning)] font-medium">
              Este tópico está trancado para novas respostas.
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] text-center forum-meta text-[var(--text-muted)]">
              Você não possui permissão para comentar neste fórum.
            </div>
          )}
        </div>

        {/* Sidebar própria do tópico (R-05) */}
        <aside className="hidden lg:block lg:w-80 shrink-0 space-y-4">
          {/* Card 1: Resumo do tópico */}
          <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-3">
            <div className="flex items-center gap-2 text-[var(--brand-primary)]">
              <Info className="w-4 h-4" />
              <h4 className="forum-title text-[var(--text-primary)] m-0">
                Resumo do Tópico
              </h4>
            </div>

            <div className="space-y-2.5 pt-1 forum-meta">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)]">Status</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {thread.isLocked
                    ? 'Trancado'
                    : thread.solutionCommentId
                    ? 'Resolvido'
                    : 'Aberto'}
                </span>
              </div>
              {category && (
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)]">Subdivisão</span>
                  <span className="font-semibold text-[var(--brand-primary)]">
                    {category.name}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)]">Criado em</span>
                <span className="forum-num text-[var(--text-secondary)]">
                  {thread.createdAt?.toDate
                    ? thread.createdAt.toDate().toLocaleDateString('pt-BR')
                    : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-muted)]">Total de Respostas</span>
                <span className="forum-num font-semibold text-[var(--text-primary)]">
                  {comments.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-muted)]">Participantes</span>
                <span className="forum-num font-semibold text-[var(--text-primary)]">
                  {participantIds.length}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Participantes da discussão */}
          <div className="p-5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-3">
            <div className="flex items-center gap-2 text-[var(--brand-primary)]">
              <Users className="w-4 h-4" />
              <h4 className="forum-title text-[var(--text-primary)] m-0">
                Participantes ({participantIds.length})
              </h4>
            </div>
            <p className="forum-meta text-[var(--text-muted)] m-0">
              Membros que participam desta discussão.
            </p>

            <div className="space-y-2 pt-1">
              {participants.map((p) => {
                const pColor = p.primaryGroup?.color || 'var(--brand-primary)';
                const pLabel: string | null = p.handle ? `@${p.handle}` : p.displayName || null;
                const pInitial = p.displayName
                  ? p.displayName.charAt(0).toUpperCase()
                  : null;

                return (
                  <div
                    key={p.uid}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-[var(--bg-default)] border border-[var(--border-subtle)]"
                  >
                    <div
                      className="w-7 h-7 rounded-full border overflow-hidden flex items-center justify-center bg-[var(--bg-surface)] shrink-0"
                      style={{ borderColor: pColor }}
                    >
                      {p.photoURL ? (
                        <img src={p.photoURL} alt={pLabel ?? ''} className="w-full h-full object-cover" />
                      ) : pInitial ? (
                        <span className="forum-meta font-bold" style={{ color: pColor }}>
                          {pInitial}
                        </span>
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      {pLabel && (
                        <span className="forum-meta font-semibold text-[var(--text-primary)] truncate block">
                          {pLabel}
                        </span>
                      )}
                      {p.primaryGroup && (
                        <Chip
                          label={p.primaryGroup.name}
                          color={p.primaryGroup.color}
                          style={p.primaryGroup.chipStyle}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Edit Thread Modal Portal (SPEC-0004: R-01 a R-14) */}
      {isEditingThread &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs"
            onClick={(e) => {
              if (e.target === e.currentTarget && !savingThreadEdit && !restoringRevision) {
                handleAttemptClose();
              }
            }}
          >
            <div
              ref={modalContainerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-thread-modal-title"
              className="dialog-transition bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
                <h3 id="edit-thread-modal-title" className="forum-title text-[var(--text-primary)] m-0">
                  Editar Tópico
                </h3>
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg cursor-pointer"
                  aria-label="Fechar modal de edição"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Warning: Expired Edit Window (R-05) */}
              {isEditWindowExpired && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--feedback-warning)]/15 border border-[var(--feedback-warning)] text-[var(--text-primary)] forum-body text-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-[var(--feedback-warning)] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Janela de edição expirada</strong>
                    <span>
                      O prazo de edição de 2 horas para autores comuns encerrou. Apenas membros da moderação podem alterar este tópico.
                    </span>
                  </div>
                </div>
              )}

              {/* Error Alert: Post removed or failed operation (R-06) */}
              {editError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--feedback-error)]/15 border border-[var(--feedback-error)] text-[var(--text-primary)] forum-body text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-[var(--feedback-error)] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Não foi possível salvar</strong>
                    <span>{editError}</span>
                  </div>
                </div>
              )}

              {thread.isRemoved && !editError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-[var(--feedback-error)]/15 border border-[var(--feedback-error)] text-[var(--text-primary)] forum-body text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-[var(--feedback-error)] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Tópico removido</strong>
                    <span>Este tópico foi removido por um moderador e não aceita mais edições.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveThreadEdit} className="space-y-4">
                <div>
                  <label className="block forum-meta font-semibold text-[var(--text-secondary)] mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={isEditWindowExpired || thread.isRemoved || savingThreadEdit}
                    className="w-full px-3 py-2 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] disabled:opacity-50"
                    required
                  />
                </div>

                {forum.categories.length > 0 && (
                  <div>
                    <label className="block forum-meta font-semibold text-[var(--text-secondary)] mb-1">
                      Subdivisão
                    </label>
                    <select
                      value={editCategoryId || ''}
                      onChange={(e) => setEditCategoryId(e.target.value || null)}
                      disabled={isEditWindowExpired || thread.isRemoved || savingThreadEdit}
                      className="w-full px-3 py-2 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] disabled:opacity-50"
                    >
                      {forum.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block forum-meta font-semibold text-[var(--text-secondary)] mb-1">
                    Mensagem
                  </label>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    disabled={isEditWindowExpired || thread.isRemoved || savingThreadEdit}
                    rows={6}
                    className="w-full px-3 py-2 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] resize-y disabled:opacity-50"
                    required
                  />
                </div>

                {/* Edit Reason (R-12: Mandatory) */}
                <div>
                  <label className="block forum-meta font-semibold text-[var(--text-secondary)] mb-1">
                    Motivo da edição <span className="text-[var(--feedback-error)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={editReason}
                    onChange={(e) => setEditReason(e.target.value)}
                    disabled={isEditWindowExpired || thread.isRemoved || savingThreadEdit}
                    placeholder="Descreva resumidamente o que foi alterado"
                    className="w-full px-3 py-2 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] disabled:opacity-50"
                    required
                  />
                  <p className="forum-meta text-xs text-[var(--text-muted)] mt-1">
                    O motivo da edição é obrigatório e fica registrado no histórico auditável para autor e moderação.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
                  <button
                    type="button"
                    onClick={handleAttemptClose}
                    disabled={savingThreadEdit}
                    className="px-4 py-2 forum-body font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isEditWindowExpired ||
                      thread.isRemoved ||
                      savingThreadEdit ||
                      !editReason.trim() ||
                      !editTitle.trim() ||
                      !editBody.trim()
                    }
                    className="btn-save-transition inline-flex items-center gap-2 px-4 py-2 forum-body font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingThreadEdit ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>Salvar alterações</span>
                    )}
                  </button>
                </div>
              </form>

              {/* History Panel (R-13) */}
              {canViewHistory && (
                <div className="border-t border-[var(--border-default)] pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[var(--text-secondary)]" />
                    <h4 className="forum-title text-sm font-semibold text-[var(--text-primary)] m-0">
                      Histórico de edições
                    </h4>
                  </div>

                  {loadingRevisions ? (
                    <div className="flex items-center justify-center p-4 text-[var(--text-muted)] gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="forum-meta text-sm">Carregando histórico...</span>
                    </div>
                  ) : revisions.length === 0 ? (
                    <p className="forum-meta text-sm text-[var(--text-muted)] m-0 p-3 bg-[var(--bg-default)] rounded-lg">
                      Nenhuma revisão registrada até o momento.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {revisions.map((rev) => {
                        const revDate = rev.editedAt
                          ? new Intl.DateTimeFormat('pt-BR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            }).format(rev.editedAt.toDate())
                          : 'Data desconhecida';

                        return (
                          <div
                            key={rev.id}
                            className="p-3 rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] flex items-start justify-between gap-3"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="forum-meta font-semibold text-[var(--text-primary)] text-xs">
                                  {rev.editedByStaff ? 'Moderador' : 'Autor'}
                                </span>
                                <span className="forum-meta text-xs text-[var(--text-muted)]">
                                  · {revDate}
                                </span>
                              </div>
                              <p className="forum-body text-xs text-[var(--text-secondary)] m-0 break-words">
                                <strong className="text-[var(--text-primary)]">Motivo:</strong> {rev.reason}
                              </p>
                            </div>

                            {canRestoreHistory && (
                              <button
                                type="button"
                                onClick={() => setShowRollbackConfirm(rev)}
                                disabled={restoringRevision || savingThreadEdit}
                                className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs forum-body font-semibold rounded bg-[var(--bg-surface)] hover:bg-[var(--border-default)] text-[var(--text-primary)] border border-[var(--border-default)] cursor-pointer disabled:opacity-50"
                                title="Restaurar esta versão anterior"
                              >
                                <RotateCcw className="w-3 h-3 text-[var(--brand-primary)]" />
                                <span>Restaurar</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Discard Confirmation Dialog (R-07) */}
              {showDiscardConfirm && (
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="discard-title"
                  className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs"
                >
                  <div className="dialog-transition bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 max-w-sm w-full shadow-2xl space-y-4">
                    <div className="flex items-center gap-2.5 text-[var(--feedback-warning)]">
                      <AlertTriangle className="w-5 h-5" />
                      <h4 id="discard-title" className="forum-title text-base font-semibold text-[var(--text-primary)] m-0">
                        Descartar alterações?
                      </h4>
                    </div>
                    <p className="forum-body text-sm text-[var(--text-secondary)] m-0">
                      Existem alterações não salvas no tópico. Deseja realmente descartá-las e fechar o modal?
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDiscardConfirm(false)}
                        className="px-3 py-1.5 forum-body text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Continuar editando
                      </button>
                      <button
                        type="button"
                        onClick={closeEditModal}
                        className="px-3 py-1.5 forum-body text-sm font-semibold rounded-lg bg-[var(--feedback-error)] text-[var(--text-on-primary)] hover:opacity-90 cursor-pointer"
                      >
                        Descartar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Rollback Confirmation Dialog (R-14) */}
              {showRollbackConfirm && (
                <div
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="rollback-title"
                  className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs"
                >
                  <div className="dialog-transition bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 max-w-md w-full shadow-2xl space-y-4">
                    <div className="flex items-center gap-2.5 text-[var(--brand-primary)]">
                      <RotateCcw className="w-5 h-5" />
                      <h4 id="rollback-title" className="forum-title text-base font-semibold text-[var(--text-primary)] m-0">
                        Restaurar esta versão?
                      </h4>
                    </div>
                    <p className="forum-body text-sm text-[var(--text-secondary)] m-0">
                      Esta ação irá restaurar o título, mensagem e subdivisão deste tópico para a versão selecionada. Uma cópia do estado atual será preservada automaticamente no histórico antes da restauração.
                    </p>
                    <div className="p-2.5 rounded bg-[var(--bg-default)] text-xs font-mono text-[var(--text-muted)] space-y-1">
                      <div>Título a restaurar: {showRollbackConfirm.title}</div>
                      <div>Motivo da versão: {showRollbackConfirm.reason}</div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRollbackConfirm(null)}
                        disabled={restoringRevision}
                        className="px-3 py-1.5 forum-body text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmRollback}
                        disabled={restoringRevision}
                        className="btn-save-transition inline-flex items-center gap-2 px-3 py-1.5 forum-body text-sm font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] cursor-pointer disabled:opacity-50"
                      >
                        {restoringRevision ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Restaurando...</span>
                          </>
                        ) : (
                          <span>Confirmar restauração</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* Toast feedback (R-09, R-10) */}
      {toastMessage &&
        typeof document !== 'undefined' &&
        createPortal(
          <div role="alert" className="fixed bottom-6 right-6 z-70 pointer-events-none">
            <div
              className={`toast-transition pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl text-sm font-semibold ${
                toastMessage.type === 'success'
                  ? 'bg-[var(--brand-primary)] text-[var(--text-on-primary)]'
                  : toastMessage.type === 'warning'
                  ? 'bg-[var(--feedback-warning)] text-[var(--text-primary)]'
                  : 'bg-[var(--feedback-error)] text-[var(--text-on-primary)]'
              }`}
            >
              {toastMessage.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
              {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 shrink-0" />}
              {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{toastMessage.text}</span>
            </div>
          </div>,
          document.body
        )}

      {/* Move Thread Modal */}
      {isMovingThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="forum-title text-[var(--text-primary)] m-0">
              Mover Tópico
            </h3>
            <p className="forum-meta text-[var(--text-secondary)] m-0">
              Escolha a nova subdivisão interna para este tópico:
            </p>
            <select
              value={targetCategory || ''}
              onChange={(e) => setTargetCategory(e.target.value || null)}
              className="w-full px-3 py-2 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
            >
              {forum.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsMovingThread(false)}
                className="px-4 py-2 forum-body font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveMove}
                className="px-4 py-2 forum-body font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="forum-title text-[var(--text-primary)] m-0">
              Denunciar Conteúdo
            </h3>
            <p className="forum-meta text-[var(--text-secondary)] m-0">
              Explique brevemente por que este conteúdo viola as diretrizes da comunidade:
            </p>

            {reportSuccess ? (
              <div className="p-4 rounded-lg bg-[var(--feedback-success)] text-[var(--text-inverse)] forum-meta font-semibold text-center">
                Denúncia enviada com sucesso para moderação.
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows={4}
                  placeholder="Motivo da denúncia..."
                  className="w-full px-3 py-2 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)]"
                  required
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setReportingItem(null);
                      setReportReason('');
                    }}
                    className="px-4 py-2 forum-body font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport}
                    className="px-4 py-2 forum-body font-semibold rounded-lg bg-[var(--feedback-error)] text-[var(--text-inverse)] hover:opacity-90 cursor-pointer disabled:opacity-50"
                  >
                    {submittingReport ? 'Enviando...' : 'Enviar denúncia'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CommentCardProps {
  forum: Forum;
  thread: ForumThread;
  comment: ForumComment;
  childComments: ForumComment[];
  onQuote: (comment: ForumComment) => void;
  onReplyParent: (parentId: string) => void;
  onToggleSolution: (commentId: string) => void;
  onStartEdit: (comment: ForumComment) => void;
  onDelete: (commentId: string) => void;
  onReact: (commentId: string, reactionId: string) => void;
  onReport: (commentId: string) => void;
  isSolution: boolean;
  allowSolution: boolean;
  allowReact: boolean;
  allowReport: boolean;
  isEditing: boolean;
  editingBody: string;
  onEditingBodyChange: (body: string) => void;
  onSaveEdit: (commentId: string) => void;
  onCancelEdit: () => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  forum,
  thread,
  comment,
  childComments,
  onQuote,
  onReplyParent,
  onToggleSolution,
  onStartEdit,
  onDelete,
  onReact,
  onReport,
  isSolution,
  allowSolution,
  allowReact,
  allowReport,
  isEditing,
  editingBody,
  onEditingBodyChange,
  onSaveEdit,
  onCancelEdit,
}) => {
  const { user, profile } = useAuth();
  const [commentAuthor, setCommentAuthor] = useState<UserProfile | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (comment.authorId) {
      getCachedProfile(comment.authorId).then((prof) => {
        if (isMounted) setCommentAuthor(prof);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [comment.authorId]);

  const allowEdit = canEditComment(forum, comment, thread, user, profile);
  const allowDelete = canDeleteComment(forum, comment, thread, user, profile);

  const formattedDate = comment.createdAt?.toDate
    ? comment.createdAt.toDate().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const authorGroupColor = commentAuthor?.primaryGroup?.color || 'var(--brand-primary)';
  const authorLabel: string | null = commentAuthor?.handle
    ? `@${commentAuthor.handle}`
    : commentAuthor?.displayName || null;
  const authorInitial = commentAuthor?.displayName
    ? commentAuthor.displayName.charAt(0).toUpperCase()
    : null;

  return (
    <div
      className={`p-4 sm:p-5 rounded-xl border forum-card-transition ${
        isSolution
          ? 'border-[var(--feedback-success)] bg-[var(--bg-surface-elevated)]'
          : 'border-[var(--border-default)] bg-[var(--bg-surface)]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Anatomia de autoria da resposta (R-05) */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full border overflow-hidden flex items-center justify-center bg-[var(--bg-default)] shrink-0"
            style={{ borderColor: authorGroupColor }}
          >
            {commentAuthor?.photoURL ? (
              <img src={commentAuthor.photoURL} alt={authorLabel ?? ''} className="w-full h-full object-cover" />
            ) : authorInitial ? (
              <span className="forum-meta font-bold" style={{ color: authorGroupColor }}>
                {authorInitial}
              </span>
            ) : null}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {authorLabel && (
                <span className="forum-body font-bold text-[var(--text-primary)]">
                  {authorLabel}
                </span>
              )}
              {commentAuthor?.primaryGroup && (
                <Chip
                  label={commentAuthor.primaryGroup.name}
                  color={commentAuthor.primaryGroup.color}
                  style={commentAuthor.primaryGroup.chipStyle}
                />
              )}
              {isSolution && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 forum-meta font-semibold rounded-md bg-[var(--feedback-success)] text-[var(--text-inverse)]">
                  <Check className="w-3 h-3" />
                  Solução
                </span>
              )}
              {comment.isRemoved && (
                <span className="px-2 py-0.5 forum-meta font-medium rounded-md bg-[var(--bg-default)] text-[var(--feedback-error)] border border-[var(--border-subtle)]">
                  Removido
                </span>
              )}
            </div>
            {formattedDate && (
              <span className="forum-meta text-[var(--text-muted)] forum-num">
                {formattedDate}
              </span>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {allowSolution && !comment.isRemoved && (
            <button
              type="button"
              onClick={() => onToggleSolution(comment.id)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSolution
                  ? 'text-[var(--feedback-success)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--feedback-success)] hover:bg-[var(--bg-default)]'
              }`}
              title={isSolution ? 'Desmarcar como solução' : 'Marcar como solução'}
              aria-label={isSolution ? 'Desmarcar como solução' : 'Marcar como solução'}
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}

          {forum.threadStructure === 'quoted' && !comment.isRemoved && (
            <button
              type="button"
              onClick={() => onQuote(comment)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)] rounded-lg transition-colors cursor-pointer"
              title="Citar esta resposta"
              aria-label="Citar esta resposta"
            >
              <Quote className="w-4 h-4" />
            </button>
          )}

          {forum.threadStructure === 'nested' && !comment.isRemoved && (
            <button
              type="button"
              onClick={() => onReplyParent(comment.id)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)] rounded-lg transition-colors cursor-pointer"
              title="Responder diretamente"
              aria-label="Responder diretamente"
            >
              <CornerDownRight className="w-4 h-4" />
            </button>
          )}

          {allowEdit && !comment.isRemoved && (
            <button
              type="button"
              onClick={() => onStartEdit(comment)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)] rounded-lg transition-colors cursor-pointer"
              title="Editar comentário"
              aria-label="Editar comentário"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {allowDelete && !comment.isRemoved && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--feedback-error)] hover:bg-[var(--bg-default)] rounded-lg transition-colors cursor-pointer"
              title="Excluir comentário"
              aria-label="Excluir comentário"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {allowReport && !comment.isRemoved && (
            <button
              type="button"
              onClick={() => onReport(comment.id)}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--feedback-error)] hover:bg-[var(--bg-default)] rounded-lg transition-colors cursor-pointer"
              title="Denunciar comentário"
              aria-label="Denunciar comentário"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body or removed placeholder */}
      <div className="pt-3 forum-body text-[var(--text-secondary)] leading-relaxed">
        {comment.isRemoved ? (
          <span className="italic text-[var(--text-muted)]">
            [Mensagem removida pelo autor ou moderação]
          </span>
        ) : isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editingBody}
              onChange={(e) => onEditingBodyChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 forum-body rounded-lg bg-[var(--bg-default)] border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] resize-y"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSaveEdit(comment.id)}
                className="px-3.5 py-1.5 forum-meta font-semibold rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-primary)] hover:bg-[var(--brand-primary-hover)] cursor-pointer"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-3.5 py-1.5 forum-meta font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <MarkdownBody content={comment.body} />
        )}
      </div>

      {/* Reactions on Comment (R-05) */}
      {forum.features?.reactions && !comment.isRemoved && (
        <div className="pt-3 border-t border-[var(--border-subtle)] mt-3 flex items-center gap-1.5 flex-wrap relative">
          {FORUM_REACTIONS.map((r) => {
            const count = comment.reactionCounts?.[r.id] || 0;
            if (count === 0) return null;
            const ReactionIcon = REACTION_ICONS[r.id];
            return (
              <button
                key={r.id}
                type="button"
                disabled={!allowReact}
                onClick={() => onReact(comment.id, r.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 forum-meta rounded-md border border-[var(--border-default)] bg-[var(--bg-default)] text-[var(--text-secondary)] hover:border-[var(--border-focus)] cursor-pointer"
              >
                {ReactionIcon && <ReactionIcon className="w-3 h-3 text-[var(--brand-primary)]" />}
                <span className="forum-num">{count}</span>
              </button>
            );
          })}

          {allowReact && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPicker(!showPicker)}
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-default)] transition-colors cursor-pointer forum-meta flex items-center gap-1"
                title="Reagir"
              >
                <Smile className="w-3.5 h-3.5" />
              </button>

              {showPicker && (
                <div className="absolute left-0 bottom-full mb-1 p-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-lg flex items-center gap-1 z-20">
                  {FORUM_REACTIONS.map((r) => {
                    const IconComp = REACTION_ICONS[r.id];
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          onReact(comment.id, r.id);
                          setShowPicker(false);
                        }}
                        className="p-1.5 hover:bg-[var(--bg-surface)] text-[var(--brand-primary)] rounded cursor-pointer"
                        title={r.label}
                      >
                        {IconComp && <IconComp className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Respostas aninhadas com barra lateral de indentação (R-05) */}
      {childComments && childComments.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] pl-4 sm:pl-6 border-l-2 border-l-[var(--border-subtle)] space-y-3">
          {childComments.map((child) => (
            <CommentCard
              key={child.id}
              forum={forum}
              thread={thread}
              comment={child}
              childComments={[]}
              onQuote={onQuote}
              onReplyParent={onReplyParent}
              onToggleSolution={onToggleSolution}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
              onReact={onReact}
              onReport={onReport}
              isSolution={thread.solutionCommentId === child.id}
              allowSolution={allowSolution}
              allowReact={allowReact}
              allowReport={allowReport}
              isEditing={isEditing}
              editingBody={editingBody}
              onEditingBodyChange={onEditingBodyChange}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};
