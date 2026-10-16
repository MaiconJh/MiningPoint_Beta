import { describe, it, expect } from 'vitest';
import {
  canViewForum,
  canCreateThread,
  canComment,
  canPinThread,
  canLockThread,
  canMoveThread,
  canRemoveThread,
  canEditThread,
  canDeleteThread,
  canEditComment,
  canDeleteComment,
  canMarkSolution,
  canReact,
  canReport,
  canReviewReports,
  checkPermissionRule,
} from '../forumPermissions';
import { Forum, ForumThread, ForumComment } from '../../types/forum';
import { UserProfile } from '../../types/profile';
import { Timestamp } from 'firebase/firestore';

const fakeTimestamp = { seconds: 1700000000, nanoseconds: 0 } as Timestamp;

const createMockForum = (overrides?: Partial<Forum>): Forum => ({
  id: 'forum-1',
  slug: 'geral',
  title: 'Geral',
  description: 'Discussões gerais',
  focus: 'discussões',
  route: '/forum/geral',
  order: 1,
  isActive: true,
  threadStructure: 'flat',
  categories: [],
  features: {
    solution: true,
    reactions: true,
    reports: true,
  },
  permissions: {
    view: { mode: 'anyone', groupIds: [] },
    createThread: { mode: 'authenticated', groupIds: [] },
    comment: { mode: 'authenticated', groupIds: [] },
    moderate: {
      pin: { mode: 'staff', groupIds: [] },
      lock: { mode: 'staff', groupIds: [] },
      move: { mode: 'staff', groupIds: [] },
      remove: { mode: 'staff', groupIds: [] },
    },
  },
  createdAt: fakeTimestamp,
  createdBy: 'admin-1',
  updatedAt: fakeTimestamp,
  updatedBy: 'admin-1',
  ...overrides,
});

const createMockProfile = (overrides?: Partial<UserProfile>): UserProfile => ({
  uid: 'user-1',
  displayName: 'Minerador',
  email: 'miner@example.com',
  photoURL: null,
  bannerUrl: null,
  shortId: 'MIN123',
  handle: 'miner',
  primaryGroupId: 'membro',
  secondaryGroupIds: [],
  isStaff: false,
  effectivePermissions: {
    accessPanel: false,
    manageUsers: false,
    manageGroups: false,
    manageBadges: false,
    manageForum: false,
    manageContent: false,
    manageCatalogs: false,
  },
  bio: '',
  featuredTitleId: null,
  visibility: 'public',
  featuredBadges: [],
  attributes: {
    exploration: 10,
    gathering: 10,
    knowledge: 10,
    community: 10,
    endurance: 10,
    economy: 10,
  },
  isBanned: false,
  createdAt: fakeTimestamp,
  ...overrides,
});

const mockThread: ForumThread = {
  id: 'thread-1',
  forumId: 'forum-1',
  categoryId: null,
  title: 'Primeiro tópico',
  body: 'Texto inicial',
  authorId: 'user-1',
  createdAt: fakeTimestamp,
  updatedAt: fakeTimestamp,
  isPinned: false,
  isLocked: false,
  isRemoved: false,
  commentCount: 0,
  solutionCommentId: null,
  reactionCounts: {},
};

const mockComment: ForumComment = {
  id: 'comment-1',
  threadId: 'thread-1',
  authorId: 'user-1',
  body: 'Meu comentário',
  createdAt: fakeTimestamp,
  updatedAt: fakeTimestamp,
  isRemoved: false,
  parentCommentId: null,
  reactionCounts: {},
};

describe('Forum Permissions (SPEC-0002)', () => {
  describe('R-05 — Permissão de visibilidade por fórum', () => {
    it('permite visualização para visitante não autenticado quando mode=anyone', () => {
      const forum = createMockForum({
        permissions: {
          ...createMockForum().permissions,
          view: { mode: 'anyone', groupIds: [] },
        },
      });
      expect(canViewForum(forum, null, null)).toBe(true);
    });

    it('bloqueia visitante não autenticado quando mode=authenticated', () => {
      const forum = createMockForum({
        permissions: {
          ...createMockForum().permissions,
          view: { mode: 'authenticated', groupIds: [] },
        },
      });
      expect(canViewForum(forum, null, null)).toBe(false);
      expect(canViewForum(forum, { uid: 'u1' }, createMockProfile())).toBe(true);
    });

    it('permite apenas grupos específicos quando mode=groups', () => {
      const forum = createMockForum({
        permissions: {
          ...createMockForum().permissions,
          view: { mode: 'groups', groupIds: ['vip', 'mineradores'] },
        },
      });
      const profileNormal = createMockProfile({ primaryGroupId: 'membro', secondaryGroupIds: [] });
      const profileVip = createMockProfile({ primaryGroupId: 'vip', secondaryGroupIds: [] });
      const profileSecondary = createMockProfile({ primaryGroupId: 'membro', secondaryGroupIds: ['mineradores'] });

      expect(canViewForum(forum, { uid: 'u1' }, profileNormal)).toBe(false);
      expect(canViewForum(forum, { uid: 'u2' }, profileVip)).toBe(true);
      expect(canViewForum(forum, { uid: 'u3' }, profileSecondary)).toBe(true);
    });

    it('permite staff quando mode=staff', () => {
      const forum = createMockForum({
        permissions: {
          ...createMockForum().permissions,
          view: { mode: 'staff', groupIds: [] },
        },
      });
      const normalUser = createMockProfile({ isStaff: false });
      const staffUser = createMockProfile({ isStaff: true });

      expect(canViewForum(forum, { uid: 'u1' }, normalUser)).toBe(false);
      expect(canViewForum(forum, { uid: 'u2' }, staffUser)).toBe(true);
    });

    it('oculta fórum inativo para usuários normais e exibe para staff/admin', () => {
      const inactiveForum = createMockForum({ isActive: false });
      const normalUser = createMockProfile({ isStaff: false });
      const staffUser = createMockProfile({ isStaff: true });

      expect(canViewForum(inactiveForum, null, null)).toBe(false);
      expect(canViewForum(inactiveForum, { uid: 'u1' }, normalUser)).toBe(false);
      expect(canViewForum(inactiveForum, { uid: 'u2' }, staffUser)).toBe(true);
    });
  });

  describe('R-06 & R-07 — Publicação de tópicos e comentários independentes', () => {
    it('permite comentar sem poder criar tópicos quando configurado assim', () => {
      const forum = createMockForum({
        permissions: {
          ...createMockForum().permissions,
          view: { mode: 'anyone', groupIds: [] },
          createThread: { mode: 'staff', groupIds: [] },
          comment: { mode: 'authenticated', groupIds: [] },
        },
      });
      const normalUser = createMockProfile({ isStaff: false });
      const auth = { uid: normalUser.uid };

      expect(canCreateThread(forum, auth, normalUser)).toBe(false);
      expect(canComment(forum, auth, normalUser, mockThread)).toBe(true);
    });
  });

  describe('R-08 & R-12 — Moderação granular por ação', () => {
    it('avalia pin, lock, move e remove de forma independente', () => {
      const forum = createMockForum({
        permissions: {
          ...createMockForum().permissions,
          moderate: {
            pin: { mode: 'groups', groupIds: ['moderadores'] },
            lock: { mode: 'staff', groupIds: [] },
            move: { mode: 'admin', groupIds: [] },
            remove: { mode: 'admin', groupIds: [] },
          },
        },
      });

      const modGroupProfile = createMockProfile({
        primaryGroupId: 'moderadores',
        isStaff: false,
        effectivePermissions: { ...createMockProfile().effectivePermissions, accessPanel: false },
      });

      const auth = { uid: modGroupProfile.uid };
      expect(canPinThread(forum, auth, modGroupProfile)).toBe(true);
      expect(canLockThread(forum, auth, modGroupProfile)).toBe(false);
      expect(canMoveThread(forum, auth, modGroupProfile)).toBe(false);
      expect(canRemoveThread(forum, auth, modGroupProfile)).toBe(false);
    });
  });

  describe('R-11 — Edição e exclusão pelo autor', () => {
    it('permite que o autor edite e exclua o próprio tópico', () => {
      const forum = createMockForum();
      const author = createMockProfile({ uid: 'author-1' });
      const otherUser = createMockProfile({ uid: 'other-user' });
      const thread: ForumThread = { ...mockThread, authorId: 'author-1' };

      expect(canEditThread(forum, thread, { uid: 'author-1' }, author)).toBe(true);
      expect(canDeleteThread(forum, thread, { uid: 'author-1' }, author)).toBe(true);

      expect(canEditThread(forum, thread, { uid: 'other-user' }, otherUser)).toBe(false);
      expect(canDeleteThread(forum, thread, { uid: 'other-user' }, otherUser)).toBe(false);
    });

    it('impede autor de editar quando o tópico está trancado, mas moderador pode moderar', () => {
      const forum = createMockForum();
      const author = createMockProfile({ uid: 'author-1' });
      const staffMod = createMockProfile({ uid: 'mod-1', isStaff: true });
      const lockedThread: ForumThread = { ...mockThread, authorId: 'author-1', isLocked: true };

      expect(canEditThread(forum, lockedThread, { uid: 'author-1' }, author)).toBe(false);
      expect(canDeleteThread(forum, lockedThread, { uid: 'mod-1' }, staffMod)).toBe(true);
    });
  });

  describe('R-13 — Marcação de solução', () => {
    it('permite autor do tópico marcar solução quando feature.solution é ativa', () => {
      const forum = createMockForum({ features: { solution: true, reactions: false, reports: false } });
      const author = createMockProfile({ uid: 'author-1' });
      const thread: ForumThread = { ...mockThread, authorId: 'author-1' };

      expect(canMarkSolution(forum, thread, { uid: 'author-1' }, author)).toBe(true);
      expect(canMarkSolution(forum, thread, { uid: 'other' }, createMockProfile())).toBe(false);
    });

    it('bloqueia marcação de solução se feature.solution estiver desativada', () => {
      const forum = createMockForum({ features: { solution: false, reactions: false, reports: false } });
      const author = createMockProfile({ uid: 'author-1' });
      const thread: ForumThread = { ...mockThread, authorId: 'author-1' };

      expect(canMarkSolution(forum, thread, { uid: 'author-1' }, author)).toBe(false);
    });
  });

  describe('R-14 & R-15 — Reações e denúncias', () => {
    it('permite reações e denúncias para usuários autenticados com visibilidade', () => {
      const forum = createMockForum({ features: { reactions: true, reports: true, solution: false } });
      const user = createMockProfile({ uid: 'u1' });

      expect(canReact(forum, { uid: 'u1' }, user)).toBe(true);
      expect(canReport(forum, { uid: 'u1' }, user)).toBe(true);
      expect(canReact(forum, null, null)).toBe(false);
    });

    it('avalia permissão de revisão de denúncias para quem tem permissão de remoção', () => {
      const forum = createMockForum();
      const normalUser = createMockProfile({ isStaff: false });
      const staffUser = createMockProfile({ isStaff: true });

      expect(canReviewReports(forum, { uid: 'u1' }, normalUser)).toBe(false);
      expect(canReviewReports(forum, { uid: 'u2' }, staffUser)).toBe(true);
    });
  });

  describe('R-19 — Banimento e segurança', () => {
    it('usuário banido lê o que sua visibilidade permitir, mas é proibido de escrever', () => {
      const forum = createMockForum({
        permissions: {
          ...createMockForum().permissions,
          view: { mode: 'anyone', groupIds: [] },
          createThread: { mode: 'authenticated', groupIds: [] },
          comment: { mode: 'authenticated', groupIds: [] },
        },
      });

      const bannedUser = createMockProfile({ uid: 'banned-1', isBanned: true });
      const auth = { uid: 'banned-1' };
      const ownThread: ForumThread = { ...mockThread, authorId: 'banned-1' };
      const ownComment: ForumComment = { ...mockComment, authorId: 'banned-1' };

      // Pode ler (se a visibilidade do fórum permitir)
      expect(canViewForum(forum, auth, bannedUser)).toBe(true);

      // Não cria tópico nem comenta
      expect(canCreateThread(forum, auth, bannedUser)).toBe(false);
      expect(canComment(forum, auth, bannedUser, ownThread)).toBe(false);

      // Não edita nem exclui
      expect(canEditThread(forum, ownThread, auth, bannedUser)).toBe(false);
      expect(canDeleteThread(forum, ownThread, auth, bannedUser)).toBe(false);
      expect(canEditComment(forum, ownComment, ownThread, auth, bannedUser)).toBe(false);
      expect(canDeleteComment(forum, ownComment, ownThread, auth, bannedUser)).toBe(false);

      // Não reage nem denuncia
      expect(canReact(forum, auth, bannedUser)).toBe(false);
      expect(canReport(forum, auth, bannedUser)).toBe(false);
    });
  });

  describe('R-20 — Defaults e retrocompatibilidade', () => {
    it('cai em defaults seguros quando permissões ou regras forem ausentes', () => {
      expect(checkPermissionRule(undefined, null, null, false)).toBe(false);
      expect(canViewForum(null, null, null)).toBe(false);
      expect(canCreateThread(null, null, null)).toBe(false);
      expect(canComment(null, null, null)).toBe(false);
    });
  });
});
