import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ForumReport,
  ForumReportKind,
  ForumReportStatus,
  ForumReportTargetSnapshot,
  ForumReportTargetStatus,
  ForumThread,
} from '../types/forum';

const MAX_REASON_LEN = 500;
const MAX_TITLE_LEN = 300;
const MAX_BODY_LEN = 8000;

function sanitizeSnapshot(data: unknown): ForumReportTargetSnapshot | null {
  if (!data || typeof data !== 'object') return null;
  const s = data as Record<string, unknown>;
  const title = typeof s.title === 'string' ? s.title : '';
  const body = typeof s.body === 'string' ? s.body : '';
  const authorId = typeof s.authorId === 'string' ? s.authorId : '';
  if (!title && !body) return null;
  return { title, body, authorId };
}

export function sanitizeReportDoc(id: string, data: Record<string, unknown>): ForumReport {
  const itemId = typeof data.itemId === 'string' ? data.itemId : '';
  const targetId =
    typeof data.targetId === 'string' && data.targetId ? data.targetId : itemId;
  const kind: ForumReportKind = data.kind === 'comment' ? 'comment' : 'thread';
  const threadId =
    typeof data.threadId === 'string' && data.threadId
      ? data.threadId
      : kind === 'thread'
      ? targetId
      : null;

  return {
    id,
    forumId: typeof data.forumId === 'string' ? data.forumId : '',
    kind,
    itemId,
    targetId,
    threadId,
    reporterId: typeof data.reporterId === 'string' ? data.reporterId : '',
    reason: typeof data.reason === 'string' ? data.reason : '',
    createdAt: (data.createdAt as Timestamp) || Timestamp.now(),
    status:
      data.status === 'reviewed' || data.status === 'dismissed'
        ? data.status
        : 'open',
    reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : null,
    reviewedAt: (data.reviewedAt as Timestamp) || null,
    targetSnapshot: sanitizeSnapshot(data.targetSnapshot),
  };
}

export async function createReport(data: {
  forumId: string;
  kind: ForumReportKind;
  itemId: string;
  targetId?: string;
  threadId?: string;
  reporterId: string;
  reason: string;
  targetSnapshot: ForumReportTargetSnapshot;
}): Promise<string> {
  if (!db) throw new Error('Firestore não inicializado.');
  const reportsRef = collection(db, 'forumReports');
  const newDocRef = doc(reportsRef);
  const resolvedTargetId = data.targetId || data.itemId;
  const resolvedThreadId =
    data.threadId || (data.kind === 'thread' ? resolvedTargetId : null);

  await setDoc(newDocRef, {
    forumId: data.forumId,
    kind: data.kind,
    itemId: data.itemId,
    targetId: resolvedTargetId,
    threadId: resolvedThreadId,
    reporterId: data.reporterId,
    reason: data.reason.trim().slice(0, MAX_REASON_LEN),
    targetSnapshot: {
      title: data.targetSnapshot.title.slice(0, MAX_TITLE_LEN),
      body: data.targetSnapshot.body.slice(0, MAX_BODY_LEN),
      authorId: data.targetSnapshot.authorId,
    },
    status: 'open',
    createdAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
  });

  return newDocRef.id;
}

export async function listReports(
  forumId: string,
  status?: ForumReportStatus
): Promise<ForumReport[]> {
  if (!db || !forumId) return [];
  try {
    const reportsRef = collection(db, 'forumReports');
    let q = query(reportsRef, where('forumId', '==', forumId), orderBy('createdAt', 'desc'));

    if (status) {
      q = query(
        reportsRef,
        where('forumId', '==', forumId),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => sanitizeReportDoc(d.id, d.data()));
  } catch (error) {
    console.error(`Failed to list reports for forum "${forumId}":`, error);
    return [];
  }
}

export async function reviewReport(
  reportId: string,
  status: 'reviewed' | 'dismissed',
  reviewedBy: string
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const reportRef = doc(db, 'forumReports', reportId);
  await updateDoc(reportRef, {
    status,
    reviewedBy,
    reviewedAt: serverTimestamp(),
  });
}

export async function reopenReport(reportId: string): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const reportRef = doc(db, 'forumReports', reportId);
  await updateDoc(reportRef, {
    status: 'open',
    reviewedBy: null,
    reviewedAt: null,
  });
}

export interface HydratedReport extends ForumReport {
  targetStatus: ForumReportTargetStatus;
  currentTitle: string | null;
  currentBody: string | null;
}

/**
 * Calcula o estado atual do alvo de cada denúncia a partir dos threads
 * carregados. Para denúncias de comentário, ou quando o thread não está na
 * lista carregada, o estado fica unknown -- o snapshot continua visível.
 */
export function hydrateReports(
  reports: ForumReport[],
  threads: ForumThread[]
): HydratedReport[] {
  const byId = new Map(threads.map((t) => [t.id, t]));

  return reports.map((r) => {
    if (r.kind !== 'thread') {
      let resolvedThreadId = r.threadId || null;
      if (!resolvedThreadId && r.targetSnapshot?.title) {
        const match = r.targetSnapshot.title.match(/^Comentário em ["“](.+)["”]$/i);
        const extractedTitle = (match ? match[1] : r.targetSnapshot.title).trim();
        const matchingThread = threads.find((t) => t.title.trim() === extractedTitle);
        if (matchingThread) {
          resolvedThreadId = matchingThread.id;
        }
      }
      return {
        ...r,
        threadId: resolvedThreadId,
        targetStatus: 'unknown',
        currentTitle: null,
        currentBody: null,
      };
    }

    const t = byId.get(r.targetId || r.itemId);
    if (!t) {
      return { ...r, targetStatus: 'unknown', currentTitle: null, currentBody: null };
    }

    const snapAuthorId = r.targetSnapshot?.authorId || t.authorId;
    let status: ForumReportTargetStatus;
    let wasEdited = false;

    if (t.isRemoved) {
      status =
        t.removedBy && t.removedBy !== snapAuthorId
          ? 'removed-by-moderator'
          : 'deleted-by-author';
    } else if (
      t.updatedAt &&
      r.createdAt &&
      t.updatedAt.toMillis() > r.createdAt.toMillis()
    ) {
      status = 'edited';
      wasEdited = true;
    } else {
      status = 'active';
    }

    return {
      ...r,
      threadId: t.id,
      targetStatus: status,
      currentTitle: wasEdited ? t.title : null,
      currentBody: wasEdited ? t.body : null,
    };
  });
}
