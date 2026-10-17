import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { FC } from 'react';
import ThumbsUp from 'lucide-react/dist/esm/icons/thumbs-up';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Flame from 'lucide-react/dist/esm/icons/flame';
import Pickaxe from 'lucide-react/dist/esm/icons/pickaxe';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import { ForumReactionKind } from '../types/forum';

export interface ForumReactionDefinition {
  id: string;
  label: string;
  emoji: string;
  iconName: string;
}

export const REACTION_ICONS: Record<string, FC<{ className?: string }>> = {
  like: ThumbsUp,
  heart: Heart,
  fire: Flame,
  pickaxe: Pickaxe,
  idea: Lightbulb,
};

export const FORUM_REACTIONS: ForumReactionDefinition[] = [
  { id: 'like', label: 'Curtir', emoji: '👍', iconName: 'ThumbsUp' },
  { id: 'heart', label: 'Amei', emoji: '❤️', iconName: 'Heart' },
  { id: 'fire', label: 'Fogo', emoji: '🔥', iconName: 'Flame' },
  { id: 'pickaxe', label: 'Mineração', emoji: '⛏️', iconName: 'Pickaxe' },
  { id: 'idea', label: 'Ideia', emoji: '💡', iconName: 'Lightbulb' },
];

export function getReactionDocId(userId: string, kind: ForumReactionKind, itemId: string): string {
  return `${userId}_${kind}_${itemId}`;
}

export async function getUserReaction(
  userId: string,
  kind: ForumReactionKind,
  itemId: string
): Promise<string | null> {
  if (!db || !userId || !itemId) return null;
  try {
    const reactionDocId = getReactionDocId(userId, kind, itemId);
    const snap = await getDoc(doc(db, 'forumReactions', reactionDocId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return typeof data.reaction === 'string' ? data.reaction : null;
  } catch (error) {
    console.error('Failed to get user reaction:', error);
    return null;
  }
}

export async function toggleReaction(
  userId: string,
  kind: ForumReactionKind,
  itemId: string,
  reactionId: string,
  parentThreadId?: string
): Promise<{ added: boolean; reaction: string | null }> {
  if (!db || !userId || !itemId || !reactionId) {
    return { added: false, reaction: null };
  }

  const reactionDocId = getReactionDocId(userId, kind, itemId);
  const reactionRef = doc(db, 'forumReactions', reactionDocId);

  // Target item ref
  const targetRef =
    kind === 'thread'
      ? doc(db, 'threads', itemId)
      : doc(db, 'threads', parentThreadId || itemId, 'comments', itemId);

  const existingSnap = await getDoc(reactionRef);

  if (existingSnap.exists()) {
    const existingReaction = existingSnap.data()?.reaction;
    if (existingReaction === reactionId) {
      // Toggle off: remove reaction
      await deleteDoc(reactionRef);
      await updateDoc(targetRef, {
        [`reactionCounts.${reactionId}`]: increment(-1),
      });
      return { added: false, reaction: null };
    } else {
      // Change reaction: decrement old, increment new
      await updateDoc(reactionRef, {
        reaction: reactionId,
        createdAt: serverTimestamp(),
      });
      const updates: Record<string, unknown> = {
        [`reactionCounts.${reactionId}`]: increment(1),
      };
      if (existingReaction) {
        updates[`reactionCounts.${existingReaction}`] = increment(-1);
      }
      await updateDoc(targetRef, updates);
      return { added: true, reaction: reactionId };
    }
  } else {
    // Add new reaction
    await setDoc(reactionRef, {
      userId,
      kind,
      itemId,
      reaction: reactionId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(targetRef, {
      [`reactionCounts.${reactionId}`]: increment(1),
    });
    return { added: true, reaction: reactionId };
  }
}
