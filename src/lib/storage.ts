/**
 * Módulo de armazenamento de imagens do perfil (avatar e banner) no Firebase Storage.
 *
 * Configuração de segurança necessária no bucket do Firebase Storage:
 * O bucket precisa permitir escrita autenticada em `users/{uid}/**`:
 * match /users/{uid}/{kind} {
 *   allow read: if true;
 *   allow write: if request.auth != null && request.auth.uid == uid;
 * }
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Valida o tipo MIME e tamanho máximo de um arquivo de imagem.
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      reason: 'Formato não aceito. Use JPG, PNG ou WebP.',
    };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1).replace('.', ',');
    return {
      valid: false,
      reason: `Arquivo muito grande (${sizeMb} MB). O limite é 5 MB.`,
    };
  }

  return { valid: true };
};

export type ProfileImageKind = 'banner' | 'avatar';

/**
 * Faz upload de imagem de perfil ou banner para o Firebase Storage e retorna a URL pública de download.
 */
export const uploadProfileImage = async (
  uid: string,
  kind: ProfileImageKind,
  file: File
): Promise<string> => {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.reason || 'Arquivo de imagem inválido.');
  }

  const storageRef = ref(storage, `users/${uid}/${kind}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return await getDownloadURL(storageRef);
};

/**
 * Remove a imagem do Storage. Tolerante a arquivos inexistentes.
 */
export const removeProfileImage = async (
  uid: string,
  kind: ProfileImageKind
): Promise<void> => {
  try {
    const storageRef = ref(storage, `users/${uid}/${kind}`);
    await deleteObject(storageRef);
  } catch (error) {
    console.error(`Erro ao remover imagem (${kind}) do Storage:`, error);
  }
};
