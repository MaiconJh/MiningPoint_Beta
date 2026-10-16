import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Forum,
  ForumFormData,
  DEFAULT_FORUM_PERMISSIONS,
  DEFAULT_FORUM_FEATURES,
} from '../types/forum';

const RESERVED_ROUTES = new Set([
  '/forum',
  'forum',
  '/admin',
  'admin',
  '/perfil',
  'perfil',
  '/conta',
  'conta',
  '/membros',
  'membros',
  '/eventos',
  'eventos',
  '/loja',
  'loja',
  '/sobre',
  'sobre',
  '/entrar',
  'entrar',
  '/login',
  'login',
  'novo',
  '/forum/novo',
]);

export interface RouteValidationResult {
  valid: boolean;
  error?: string;
  slug: string;
  route: string;
}

export function validateForumRoute(
  inputRoute: string,
  currentForumId?: string,
  existingForums: Forum[] = []
): RouteValidationResult {
  if (!inputRoute || !inputRoute.trim()) {
    return { valid: false, error: 'A rota do fórum é obrigatória.', slug: '', route: '' };
  }

  // Normalize: extract segment
  let cleaned = inputRoute.trim().toLowerCase();
  if (cleaned.startsWith('/forum/')) {
    cleaned = cleaned.replace('/forum/', '');
  } else if (cleaned.startsWith('/')) {
    cleaned = cleaned.replace(/^\/+/, '');
  }

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  // Regex validation: letters, numbers, hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!cleaned || !slugRegex.test(cleaned)) {
    return {
      valid: false,
      error: 'A rota deve conter apenas letras minúsculas, números e hífens (ex: "suporte" ou "/forum/suporte").',
      slug: cleaned,
      route: `/forum/${cleaned}`,
    };
  }

  const finalRoute = `/forum/${cleaned}`;

  if (RESERVED_ROUTES.has(cleaned) || RESERVED_ROUTES.has(finalRoute)) {
    return {
      valid: false,
      error: `A rota "${finalRoute}" colide com uma rota reservada do sistema.`,
      slug: cleaned,
      route: finalRoute,
    };
  }

  // Collision with existing forums
  const collision = existingForums.find(
    (f) => f.id !== currentForumId && (f.slug === cleaned || f.route === finalRoute)
  );

  if (collision) {
    return {
      valid: false,
      error: `A rota "${finalRoute}" já está sendo usada pelo fórum "${collision.title}".`,
      slug: cleaned,
      route: finalRoute,
    };
  }

  return {
    valid: true,
    slug: cleaned,
    route: finalRoute,
  };
}

export function sanitizeForumDoc(id: string, data: Record<string, unknown>): Forum {
  return {
    id,
    slug: typeof data.slug === 'string' ? data.slug : id,
    title: typeof data.title === 'string' ? data.title : 'Fórum',
    description: typeof data.description === 'string' ? data.description : '',
    focus: typeof data.focus === 'string' ? data.focus : 'discussões',
    route: typeof data.route === 'string' ? data.route : `/forum/${data.slug || id}`,
    order: typeof data.order === 'number' ? data.order : 0,
    isActive: typeof data.isActive === 'boolean' ? data.isActive : false,
    threadStructure:
      data.threadStructure === 'quoted' || data.threadStructure === 'nested'
        ? data.threadStructure
        : 'flat',
    categories: Array.isArray(data.categories)
      ? data.categories.map((c, idx) => ({
          id: typeof c?.id === 'string' ? c.id : `cat-${idx}`,
          name: typeof c?.name === 'string' ? c.name : '',
          description: typeof c?.description === 'string' ? c.description : '',
          order: typeof c?.order === 'number' ? c.order : idx,
        }))
      : [],
    features: {
      solution: Boolean((data.features as Record<string, unknown>)?.solution ?? DEFAULT_FORUM_FEATURES.solution),
      reactions: Boolean((data.features as Record<string, unknown>)?.reactions ?? DEFAULT_FORUM_FEATURES.reactions),
      reports: Boolean((data.features as Record<string, unknown>)?.reports ?? DEFAULT_FORUM_FEATURES.reports),
    },
    permissions: (data.permissions as Forum['permissions']) || DEFAULT_FORUM_PERMISSIONS,
    createdAt: (data.createdAt as Timestamp) || Timestamp.now(),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
    updatedAt: (data.updatedAt as Timestamp) || Timestamp.now(),
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : '',
  };
}

export async function listForums(): Promise<Forum[]> {
  if (!db) return [];
  try {
    const forumsRef = collection(db, 'forums');
    const q = query(forumsRef, orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => sanitizeForumDoc(d.id, d.data()));
  } catch (error) {
    console.error('Failed to list forums:', error);
    return [];
  }
}

export async function getForumBySlug(slug: string): Promise<Forum | null> {
  if (!db || !slug) return null;
  try {
    const forumsRef = collection(db, 'forums');
    const q = query(forumsRef, where('slug', '==', slug));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return sanitizeForumDoc(docSnap.id, docSnap.data());
    }

    // Fallback: check by ID or route
    const docById = await getDoc(doc(db, 'forums', slug));
    if (docById.exists()) {
      return sanitizeForumDoc(docById.id, docById.data());
    }

    return null;
  } catch (error) {
    console.error(`Failed to get forum by slug "${slug}":`, error);
    return null;
  }
}

export async function getForumById(forumId: string): Promise<Forum | null> {
  if (!db || !forumId) return null;
  try {
    const docSnap = await getDoc(doc(db, 'forums', forumId));
    if (!docSnap.exists()) return null;
    return sanitizeForumDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.error(`Failed to get forum by ID "${forumId}":`, error);
    return null;
  }
}

export async function createForum(data: ForumFormData, creatorUid: string): Promise<string> {
  if (!db) throw new Error('Firestore não inicializado.');
  const forumsRef = collection(db, 'forums');
  const newDocRef = doc(forumsRef);
  const now = serverTimestamp();

  await setDoc(newDocRef, {
    ...data,
    createdAt: now,
    createdBy: creatorUid,
    updatedAt: now,
    updatedBy: creatorUid,
  });

  return newDocRef.id;
}

export async function updateForum(
  forumId: string,
  data: Partial<ForumFormData>,
  updaterUid: string
): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const forumRef = doc(db, 'forums', forumId);
  await updateDoc(forumRef, {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: updaterUid,
  });
}

export async function deleteForum(forumId: string): Promise<void> {
  if (!db) throw new Error('Firestore não inicializado.');
  const forumRef = doc(db, 'forums', forumId);
  await deleteDoc(forumRef);
}
