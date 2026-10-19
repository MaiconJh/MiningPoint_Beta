import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  ForumThread,
  ForumThreadFormData,
  ForumComment,
  ForumCommentFormData,
  ThreadRevision,
} from '../types/forum';

export function sanitizeThreadDoc(id: string, data: Record<string, unknown>): ForumThread {
  return {
    id,
    forumId: typeof data.forumId === 'string' ? data.forumId : '',
    categoryId: typeof data.categoryId === 'string' ? data.categoryId : null,
    title: typeof data.title === 'string' ? data.title : 'Sem título',
    body: typeof data.body === 'string' ? data.body : '',
    authorId: typeof data.authorId === 'string' ? data.authorId : '',
    createdAt: (data.createdAt as Timestamp) || Timestamp.now(),
    updatedAt: (data.updatedAt as Timestamp) || Timestamp.now(),
    isPinned: Boolean(data.isPinned),
    pinnedAt: (data.pinnedAt as Timestamp) || null,
    pinnedBy: typeof data.pinnedBy === 'string' ? data.pinnedBy : null,
    isLocked: Boolean(data.isLocked),
    lockedAt: (data.lockedAt as Timestamp) || null,
    lockedBy: typeof data.lockedBy === 'string' ? data.lockedBy : null,
    isRemoved: Boolean(data.isRemoved),
    removedAt: (data.removedAt as Timestamp) || null,
    removedBy: typeof data.removedBy === 'string' ? data.removedBy : null,
    movedAt: (data.movedAt as Timestamp) || null,
    movedBy: typeof data.movedBy === 'string' ? data.movedBy : null,
    commentCount: typeof data.commentCount === 'number' ? data.commentCount : 0,
    solutionCommentId: typeof data.solutionCommentId === 'string' ? data.solutionCommentId : null,
    reactionCounts:
      data.reactionCounts && typeof data.reactionCounts === 'object'
        ? (data.reactionCounts as Record<string, number>)
        : {},
    editReason: typeof data.editReason === 'string' ? data.editReason : null,
  };
}

export function sanitizeCommentDoc(id: string, data: Record<string, unknown>): ForumComment {
  return {
    id,
    threadId: typeof data.threadId === 'string' ? data.threadId : '',
    authorId: typeof data.authorId === 'string' ? data.authorId : '',
    body: typeof data.body === 'string' ? data.body : '',
    createdAt: (data.createdAt as Timestamp) || Timestamp.now(),
    updatedAt: (data.updatedAt as Timestamp) || Timestamp.now(),
    isRemoved: Boolean(data.isRemoved),
    removedAt: (data.removedAt as Timestamp) || null,
    removedBy: typeof data.removedBy === 'string' ? data.removedBy : null,
    parentCommentId: typeof data.parentCommentId === 'string' ? data.parentCommentId : null,
    quoteCommentId: typeof data.quoteCommentId === 'string' ? data.quoteCommentId : null,
    reactionCounts:
      data.reactionCounts && typeof data.reactionCounts === 'object'
        ? (data.reactionCounts as Record<string, number>)
        : {},
  };
}

export async function listThreads(
  forumId: string,
  options?: { categoryId?: string | null; includeRemoved?: boolean }
): Promise<ForumThread[]> {
  if (!db || !forumId) return [];
  try {
    const threadsRef = collection(db, 'threads');
    let q = query(threadsRef, where('forumId', '==', forumId));

    if (options?.categoryId !== undefined && options.categoryId !== null) {
      q = query(threadsRef, where('forumId', '==', forumId), where('categoryId', '==', options.categoryId));
    }

    const snap = await getDocs(q);
    const threads = snap.docs.map((d) => sanitizeThreadDoc(d.id, d.data()));

    // Filter out removed threads unless explicitly requested
    const visibleThreads = options?.includeRemoved
      ? threads
      : threads.filter((t) => !t.isRemoved);

    // Sort: pinned first, then by updatedAt desc
    visibleThreads.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const timeA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const timeB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return timeB - timeA;
    });

    return visibleThreads;
  } catch (error) {
    console.error(`Failed to list threads for forum "${forumId}":`, error);
    return [];
  }
}

export async function getThread(threadId: string): Promise<ForumThread | null> {
  if (!db || !threadId) return null;
  try {
    const threadRef = doc(db, 'threads', threadId);
    const snap = await getDoc(threadRef);
    if (!snap.exists()) return null;
    return sanitizeThreadDoc(snap.id, snap.data());
  } catch (error) {
    console.error(`Failed to get thread "${threadId}":`, error);
    return null;
  }
}

export async function createThread(
  forumId: string,
  data: ForumThreadFormData,
  authorId: string
): Promise<string> {
  if (!db) throw new Error('Firestore não inicializado.');
  const threadsRef = collection(db, 'threads');
  const newDocRef = doc(threadsRef);
  const now = serverTimestamp();

  await setDoc(newDocRef, {
    forumId,
    categoryId: data.categoryId || null,
    title: data.title.trim().slice(0, 150),
    body: data.body.trim().slice(0, 10000),
    authorId,
    createdAt: now,
    updatedAt: now,
    isPinned: false,
    pinnedAt: null,
    pinnedBy: null,
    isLocked: false,
    lockedAt: null,
    lockedBy: null,
    isRemoved: false,
    removedAt: null,
    removedBy: null,
    movedAt: null,
    movedBy: null,
    commentCount: 0,
    solutionCommentId: null,
    reactionCounts: {},
  });

  return newDocRef.id;
}

export async function updateThread(
  threadId: string,
  data: Partial<ForumThreadFormData> & {
    reason?: string;
    editedBy?: string;
    editedByStaff?: boolean;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const threadRef = doc(db, 'threads', threadId);

  await runTransaction(db, async (transaction) => {
    const threadSnap = await transaction.get(threadRef);
    if (!threadSnap.exists()) {
      throw new Error('Tópico não encontrado.');
    }
    const currentData = threadSnap.data();
    if (currentData.isRemoved) {
      throw new Error('Este tópico foi removido por um moderador.');
    }

    if (data.reason && data.editedBy) {
      const revisionColRef = collection(db, 'threads', threadId, 'revisions');
      const newRevRef = doc(revisionColRef);
      transaction.set(newRevRef, {
        title: typeof currentData.title === 'string' ? currentData.title : '',
        body: typeof currentData.body === 'string' ? currentData.body : '',
        categoryId: typeof currentData.categoryId === 'string' ? currentData.categoryId : null,
        reason: data.reason.trim(),
        editedBy: data.editedBy,
        editedByStaff: Boolean(data.editedByStaff),
        editedAt: serverTimestamp(),
      });
    }

    const updatePayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (typeof data.title === 'string') {
      updatePayload.title = data.title.trim().slice(0, 150);
    }
    if (typeof data.body === 'string') {
      updatePayload.body = data.body.trim().slice(0, 10000);
    }
    if (data.categoryId !== undefined) {
      updatePayload.categoryId = data.categoryId;
    }
    if (data.reason) {
      updatePayload.editReason = data.reason.trim();
    }

    transaction.update(threadRef, updatePayload);
  });
}

export async function restoreThreadRevision(
  threadId: string,
  revision: ThreadRevision,
  restoredByUid: string,
  restoredByStaff: boolean = true
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const threadRef = doc(db, 'threads', threadId);

  await runTransaction(db, async (transaction) => {
    const threadSnap = await transaction.get(threadRef);
    if (!threadSnap.exists()) {
      throw new Error('Tópico não encontrado.');
    }
    const currentData = threadSnap.data();
    if (currentData.isRemoved) {
      throw new Error('Este tópico foi removido por um moderador.');
    }

    const revisionColRef = collection(db, 'threads', threadId, 'revisions');

    // 1. Grava o estado atual como nova revisão preservando evidência
    const preserveRevRef = doc(revisionColRef);
    transaction.set(preserveRevRef, {
      title: typeof currentData.title === 'string' ? currentData.title : '',
      body: typeof currentData.body === 'string' ? currentData.body : '',
      categoryId: typeof currentData.categoryId === 'string' ? currentData.categoryId : null,
      reason: `Estado anterior preservado antes da restauração da revisão ${revision.id.slice(0, 7)}`,
      editedBy: restoredByUid,
      editedByStaff: restoredByStaff,
      editedAt: serverTimestamp(),
    });

    // 2. Grava a revisão referente ao ato de restauração
    const restoreRevRef = doc(revisionColRef);
    transaction.set(restoreRevRef, {
      title: revision.title,
      body: revision.body,
      categoryId: revision.categoryId ?? null,
      reason: `Restauração aplicada a partir da revisão ${revision.id.slice(0, 7)}`,
      editedBy: restoredByUid,
      editedByStaff: restoredByStaff,
      editedAt: serverTimestamp(),
    });

    // 3. Atualiza o tópico com os dados da revisão restaurada
    transaction.update(threadRef, {
      title: revision.title.trim().slice(0, 150),
      body: revision.body.trim().slice(0, 10000),
      categoryId: revision.categoryId ?? null,
      editReason: `Restaurado para a versão ${revision.id.slice(0, 7)}`,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function getThreadRevisions(threadId: string): Promise<ThreadRevision[]> {
  if (!db) return [];
  const revisionsRef = collection(db, 'threads', threadId, 'revisions');
  const q = query(revisionsRef, orderBy('editedAt', 'desc'), limit(50));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: typeof data.title === 'string' ? data.title : '',
      body: typeof data.body === 'string' ? data.body : '',
      categoryId: typeof data.categoryId === 'string' ? data.categoryId : null,
      reason: typeof data.reason === 'string' ? data.reason : '',
      editedBy: typeof data.editedBy === 'string' ? data.editedBy : '',
      editedByStaff: Boolean(data.editedByStaff),
      editedAt: (data.editedAt as Timestamp) || Timestamp.now(),
    };
  });
}

export type ModerationAction =
  | 'pin'
  | 'unpin'
  | 'lock'
  | 'unlock'
  | 'remove'
  | 'restore'
  | 'move';

export async function moderateThread(
  threadId: string,
  action: ModerationAction,
  moderatorUid: string,
  payload?: { categoryId?: string | null }
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const threadRef = doc(db, 'threads', threadId);
  const now = serverTimestamp();

  let updatePayload: Record<string, unknown> = {
    updatedAt: now,
  };

  switch (action) {
    case 'pin':
      updatePayload = { ...updatePayload, isPinned: true, pinnedBy: moderatorUid, pinnedAt: now };
      break;
    case 'unpin':
      updatePayload = { ...updatePayload, isPinned: false, pinnedBy: null, pinnedAt: null };
      break;
    case 'lock':
      updatePayload = { ...updatePayload, isLocked: true, lockedBy: moderatorUid, lockedAt: now };
      break;
    case 'unlock':
      updatePayload = { ...updatePayload, isLocked: false, lockedBy: null, lockedAt: null };
      break;
    case 'remove':
      updatePayload = { ...updatePayload, isRemoved: true, removedBy: moderatorUid, removedAt: now };
      break;
    case 'restore':
      updatePayload = { ...updatePayload, isRemoved: false, removedBy: null, removedAt: null };
      break;
    case 'move':
      updatePayload = {
        ...updatePayload,
        categoryId: payload?.categoryId ?? null,
        movedBy: moderatorUid,
        movedAt: now,
      };
      break;
  }

  await updateDoc(threadRef, updatePayload);
}

export async function setSolutionComment(
  threadId: string,
  commentId: string | null
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const threadRef = doc(db, 'threads', threadId);
  await updateDoc(threadRef, {
    solutionCommentId: commentId,
    updatedAt: serverTimestamp(),
  });
}

export async function listComments(threadId: string): Promise<ForumComment[]> {
  if (!db || !threadId) return [];
  try {
    const commentsRef = collection(db, 'threads', threadId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => sanitizeCommentDoc(d.id, d.data()));
  } catch (error) {
    console.error(`Failed to list comments for thread "${threadId}":`, error);
    return [];
  }
}

export async function createComment(
  threadId: string,
  data: ForumCommentFormData,
  authorId: string
): Promise<string> {
  if (!db) throw new Error('Firestore não inicializado.');
  const commentsRef = collection(db, 'threads', threadId, 'comments');
  const newCommentRef = doc(commentsRef);
  const now = serverTimestamp();

  await setDoc(newCommentRef, {
    threadId,
    authorId,
    body: data.body.trim().slice(0, 5000),
    parentCommentId: data.parentCommentId || null,
    quoteCommentId: data.quoteCommentId || null,
    isRemoved: false,
    removedAt: null,
    removedBy: null,
    reactionCounts: {},
    createdAt: now,
    updatedAt: now,
  });

  // Increment thread comment count and bump updatedAt
  const threadRef = doc(db, 'threads', threadId);
  await updateDoc(threadRef, {
    commentCount: increment(1),
    updatedAt: now,
  });

  return newCommentRef.id;
}

export async function updateComment(
  threadId: string,
  commentId: string,
  body: string
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const commentRef = doc(db, 'threads', threadId, 'comments', commentId);
  await updateDoc(commentRef, {
    body: body.trim().slice(0, 5000),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(
  threadId: string,
  commentId: string,
  removedByUid: string
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const commentRef = doc(db, 'threads', threadId, 'comments', commentId);
  await updateDoc(commentRef, {
    isRemoved: true,
    removedBy: removedByUid,
    removedAt: serverTimestamp(),
  });
}
