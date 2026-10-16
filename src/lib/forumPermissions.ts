import {
  Forum,
  ForumThread,
  ForumComment,
  PermissionRule,
  DEFAULT_FORUM_PERMISSIONS,
  DEFAULT_PERMISSION_RULE,
} from '../types/forum';
import { UserProfile } from '../types/profile';

export interface UserAuthCheck {
  uid: string;
}

/**
 * Checks a single PermissionRule against user and profile.
 * When isWriteAction is true, banned users are unconditionally denied.
 */
export function checkPermissionRule(
  rule: PermissionRule | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null,
  isWriteAction = false
): boolean {
  const safeRule = rule || DEFAULT_PERMISSION_RULE;

  // Banned users can never perform write actions
  if (isWriteAction && profile?.isBanned) {
    return false;
  }

  // Admin access panel permission or manageForum bypasses restrictions for authenticated users
  if (user && (profile?.effectivePermissions?.accessPanel || profile?.effectivePermissions?.manageForum)) {
    return true;
  }

  switch (safeRule.mode) {
    case 'anyone':
      // Anyone can read; write actions require at least being signed in and not banned
      if (isWriteAction) {
        return Boolean(user && !profile?.isBanned);
      }
      return true;

    case 'authenticated':
      return Boolean(user);

    case 'groups': {
      if (!user || !profile) return false;
      const userGroupIds = new Set<string>();
      if (profile.primaryGroupId) userGroupIds.add(profile.primaryGroupId);
      if (Array.isArray(profile.secondaryGroupIds)) {
        profile.secondaryGroupIds.forEach((gid) => userGroupIds.add(gid));
      }
      return (safeRule.groupIds || []).some((gid) => userGroupIds.has(gid));
    }

    case 'staff':
      if (!user || !profile) return false;
      return Boolean(profile.isStaff);

    case 'admin':
      if (!user || !profile) return false;
      return Boolean(profile.effectivePermissions?.accessPanel || profile.effectivePermissions?.manageForum);

    default:
      return false;
  }
}

export function canViewForum(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum) return false;
  // Inactive forums are only visible to staff/admins
  if (!forum.isActive) {
    if (!user || !profile) return false;
    return Boolean(profile.isStaff || profile.effectivePermissions?.manageForum || profile.effectivePermissions?.accessPanel);
  }
  const viewRule = forum.permissions?.view || DEFAULT_FORUM_PERMISSIONS.view;
  return checkPermissionRule(viewRule, user, profile, false);
}

export function canCreateThread(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !user || profile?.isBanned) return false;
  if (!canViewForum(forum, user, profile)) return false;
  const rule = forum.permissions?.createThread || DEFAULT_FORUM_PERMISSIONS.createThread;
  return checkPermissionRule(rule, user, profile, true);
}

export function canComment(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null,
  thread?: ForumThread | null
): boolean {
  if (!forum || !user || profile?.isBanned) return false;
  if (!canViewForum(forum, user, profile)) return false;
  if (thread?.isRemoved) return false;

  const isModerator = canModerate(forum, user, profile);
  // Normal commenters cannot comment on locked threads
  if (thread?.isLocked && !isModerator) return false;

  const rule = forum.permissions?.comment || DEFAULT_FORUM_PERMISSIONS.comment;
  return checkPermissionRule(rule, user, profile, true);
}

export function canPinThread(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !user || profile?.isBanned) return false;
  const rule = forum.permissions?.moderate?.pin || DEFAULT_FORUM_PERMISSIONS.moderate.pin;
  return checkPermissionRule(rule, user, profile, true);
}

export function canLockThread(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !user || profile?.isBanned) return false;
  const rule = forum.permissions?.moderate?.lock || DEFAULT_FORUM_PERMISSIONS.moderate.lock;
  return checkPermissionRule(rule, user, profile, true);
}

export function canMoveThread(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !user || profile?.isBanned) return false;
  const rule = forum.permissions?.moderate?.move || DEFAULT_FORUM_PERMISSIONS.moderate.move;
  return checkPermissionRule(rule, user, profile, true);
}

export function canRemoveThread(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !user || profile?.isBanned) return false;
  const rule = forum.permissions?.moderate?.remove || DEFAULT_FORUM_PERMISSIONS.moderate.remove;
  return checkPermissionRule(rule, user, profile, true);
}

export function canRemoveComment(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !user || profile?.isBanned) return false;
  const rule = forum.permissions?.moderate?.remove || DEFAULT_FORUM_PERMISSIONS.moderate.remove;
  return checkPermissionRule(rule, user, profile, true);
}

export function canModerate(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !user || profile?.isBanned) return false;
  return (
    canPinThread(forum, user, profile) ||
    canLockThread(forum, user, profile) ||
    canMoveThread(forum, user, profile) ||
    canRemoveThread(forum, user, profile)
  );
}

export function canEditThread(
  forum: Forum | null | undefined,
  thread: ForumThread | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !thread || !user || profile?.isBanned) return false;
  if (thread.isRemoved) return false;
  if (thread.isLocked && !canModerate(forum, user, profile)) return false;
  return thread.authorId === user.uid;
}

export function canDeleteThread(
  forum: Forum | null | undefined,
  thread: ForumThread | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !thread || !user || profile?.isBanned) return false;
  if (thread.authorId === user.uid) return true;
  return canRemoveThread(forum, user, profile);
}

export function canEditComment(
  forum: Forum | null | undefined,
  comment: ForumComment | null | undefined,
  thread: ForumThread | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !comment || !thread || !user || profile?.isBanned) return false;
  if (comment.isRemoved || thread.isRemoved) return false;
  if (thread.isLocked && !canModerate(forum, user, profile)) return false;
  return comment.authorId === user.uid;
}

export function canDeleteComment(
  forum: Forum | null | undefined,
  comment: ForumComment | null | undefined,
  _thread: ForumThread | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum || !comment || !user || profile?.isBanned) return false;
  if (comment.authorId === user.uid) return true;
  return canRemoveComment(forum, user, profile);
}

export function canMarkSolution(
  forum: Forum | null | undefined,
  thread: ForumThread | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum?.features?.solution || !thread || !user || profile?.isBanned) return false;
  if (thread.authorId === user.uid) return true;
  return canModerate(forum, user, profile);
}

export function canReact(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum?.features?.reactions || !user || profile?.isBanned) return false;
  return canViewForum(forum, user, profile);
}

export function canReport(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum?.features?.reports || !user || profile?.isBanned) return false;
  return canViewForum(forum, user, profile);
}

export function canReviewReports(
  forum: Forum | null | undefined,
  user: UserAuthCheck | null,
  profile: UserProfile | null
): boolean {
  if (!forum?.features?.reports || !user || profile?.isBanned) return false;
  return canRemoveThread(forum, user, profile) || Boolean(profile?.effectivePermissions?.manageForum);
}
