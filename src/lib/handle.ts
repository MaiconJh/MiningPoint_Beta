import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from './firebase';

export const RESERVED_HANDLES = new Set([
  'admin',
  'conta',
  'perfil',
  'api',
  'login',
  'entrar',
  'sobre',
  'eventos',
  'membros',
  'forum',
  'loja',
  'home',
]);

export type ValidationResult =
  | { valid: true; handle: string }
  | { valid: false; reason: string };

export const validateHandle = (raw: string): ValidationResult => {
  if (typeof raw !== 'string') {
    return { valid: false, reason: 'Formato de @nick inválido.' };
  }

  const normalized = raw.trim().toLowerCase();

  if (normalized.length < 3 || normalized.length > 20) {
    return { valid: false, reason: 'O @nick deve ter entre 3 e 20 caracteres.' };
  }

  if (!/^[a-z0-9_]+$/.test(normalized)) {
    return {
      valid: false,
      reason: 'O @nick só pode conter letras minúsculas, números e sublinhado (_).',
    };
  }

  if (/^[0-9_]/.test(normalized)) {
    return {
      valid: false,
      reason: 'O @nick não pode começar com número ou sublinhado (_).',
    };
  }

  if (RESERVED_HANDLES.has(normalized)) {
    return { valid: false, reason: 'Este @nick é reservado pelo sistema.' };
  }

  return { valid: true, handle: normalized };
};

export const profileUrl = (profile: { handle?: string | null; shortId: string }): string => {
  const identifier = profile.handle || profile.shortId;
  return `/perfil/${identifier}`;
};

export const resolveSlugToUid = async (slug: string): Promise<string | null> => {
  if (!db || !slug) return null;

  const normalizedSlug = slug.trim();
  if (!normalizedSlug) return null;

  try {
    const usersRef = collection(db, 'users');

    // 1. Try matching handle
    const handleQuery = query(
      usersRef,
      where('handle', '==', normalizedSlug.toLowerCase()),
      limit(1)
    );
    const handleSnap = await getDocs(handleQuery);
    if (!handleSnap.empty) {
      return handleSnap.docs[0].id;
    }

    // 2. Try matching shortId
    const shortIdQuery = query(
      usersRef,
      where('shortId', '==', normalizedSlug),
      limit(1)
    );
    const shortIdSnap = await getDocs(shortIdQuery);
    if (!shortIdSnap.empty) {
      return shortIdSnap.docs[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error resolving slug to UID:', error);
    return null;
  }
};
