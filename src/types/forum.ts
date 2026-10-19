import { type Timestamp } from 'firebase/firestore';

export type PermissionMode = 'anyone' | 'authenticated' | 'groups' | 'staff' | 'admin';

export interface PermissionRule {
  mode: PermissionMode;
  groupIds: string[];
}

export interface ForumModeratePermissions {
  pin: PermissionRule;
  lock: PermissionRule;
  move: PermissionRule;
  remove: PermissionRule;
}

export interface ForumPermissionMap {
  view: PermissionRule;
  createThread: PermissionRule;
  comment: PermissionRule;
  moderate: ForumModeratePermissions;
}

export const DEFAULT_PERMISSION_RULE: PermissionRule = {
  mode: 'staff',
  groupIds: [],
};

export const DEFAULT_FORUM_PERMISSIONS: ForumPermissionMap = {
  view: { mode: 'staff', groupIds: [] },
  createThread: { mode: 'staff', groupIds: [] },
  comment: { mode: 'staff', groupIds: [] },
  moderate: {
    pin: { mode: 'staff', groupIds: [] },
    lock: { mode: 'staff', groupIds: [] },
    move: { mode: 'staff', groupIds: [] },
    remove: { mode: 'staff', groupIds: [] },
  },
};

export type ThreadStructure = 'flat' | 'quoted' | 'nested';

export interface ForumCategory {
  id: string;
  name: string;
  description: string;
  order: number;
}

export interface ForumFeatures {
  solution: boolean;
  reactions: boolean;
  reports: boolean;
}

export const DEFAULT_FORUM_FEATURES: ForumFeatures = {
  solution: false,
  reactions: false,
  reports: false,
};

export interface Forum {
  id: string;
  slug: string;
  title: string;
  description: string;
  focus: string;
  route: string;
  order: number;
  isActive: boolean;
  threadStructure: ThreadStructure;
  categories: ForumCategory[];
  features: ForumFeatures;
  permissions: ForumPermissionMap;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

export type ForumFormData = Omit<
  Forum,
  'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;

export interface ForumThread {
  id: string;
  forumId: string;
  categoryId: string | null;
  title: string;
  body: string;
  authorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPinned: boolean;
  pinnedAt?: Timestamp | null;
  pinnedBy?: string | null;
  isLocked: boolean;
  lockedAt?: Timestamp | null;
  lockedBy?: string | null;
  isRemoved: boolean;
  removedAt?: Timestamp | null;
  removedBy?: string | null;
  movedAt?: Timestamp | null;
  movedBy?: string | null;
  commentCount: number;
  solutionCommentId: string | null;
  reactionCounts: Record<string, number>;
  editReason?: string | null;
}

export interface ThreadRevision {
  id: string;
  title: string;
  body: string;
  categoryId: string | null;
  reason: string;
  editedBy: string;
  editedByStaff: boolean;
  editedAt: Timestamp;
}

export interface ThreadRevisionFormData {
  title: string;
  body: string;
  categoryId: string | null;
  reason: string;
  editedBy: string;
  editedByStaff: boolean;
}

export interface ForumThreadFormData {
  title: string;
  body: string;
  categoryId: string | null;
  editReason?: string;
}

export interface ForumComment {
  id: string;
  threadId: string;
  authorId: string;
  body: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isRemoved: boolean;
  removedAt?: Timestamp | null;
  removedBy?: string | null;
  parentCommentId: string | null;
  quoteCommentId?: string | null;
  reactionCounts: Record<string, number>;
}

export interface ForumCommentFormData {
  body: string;
  parentCommentId?: string | null;
  quoteCommentId?: string | null;
}

export type ForumReactionKind = 'thread' | 'comment';

export interface ForumReaction {
  id: string;
  userId: string;
  kind: ForumReactionKind;
  itemId: string;
  reaction: string;
  createdAt: Timestamp;
}

export type ForumReportKind = 'thread' | 'comment';
export type ForumReportStatus = 'open' | 'reviewed' | 'dismissed';

export interface ForumReport {
  id: string;
  forumId: string;
  kind: ForumReportKind;
  itemId: string;
  reporterId: string;
  reason: string;
  createdAt: Timestamp;
  status: ForumReportStatus;
  reviewedBy?: string | null;
  reviewedAt?: Timestamp | null;
}
