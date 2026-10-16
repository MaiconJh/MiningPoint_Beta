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
} from '../types/forum';

export function sanitizeReportDoc(id: string, data: Record<string, unknown>): ForumReport {
  return {
    id,
    forumId: typeof data.forumId === 'string' ? data.forumId : '',
    kind: data.kind === 'comment' ? 'comment' : 'thread',
    itemId: typeof data.itemId === 'string' ? data.itemId : '',
    reporterId: typeof data.reporterId === 'string' ? data.reporterId : '',
    reason: typeof data.reason === 'string' ? data.reason : '',
    createdAt: (data.createdAt as Timestamp) || Timestamp.now(),
    status:
      data.status === 'reviewed' || data.status === 'dismissed'
        ? data.status
        : 'open',
    reviewedBy: typeof data.reviewedBy === 'string' ? data.reviewedBy : null,
    reviewedAt: (data.reviewedAt as Timestamp) || null,
  };
}

export async function createReport(data: {
  forumId: string;
  kind: ForumReportKind;
  itemId: string;
  reporterId: string;
  reason: string;
}): Promise<string> {
  if (!db) throw new Error('Firestore não inicializado.');
  const reportsRef = collection(db, 'forumReports');
  const newDocRef = doc(reportsRef);

  await setDoc(newDocRef, {
    forumId: data.forumId,
    kind: data.kind,
    itemId: data.itemId,
    reporterId: data.reporterId,
    reason: data.reason.trim().slice(0, 500),
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
