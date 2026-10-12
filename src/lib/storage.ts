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

export const UPLOAD_TIMEOUT_MS = 45_000;
export const DELETE_TIMEOUT_MS = 15_000;

export class StorageTimeoutError extends Error {
  readonly code = 'storage/timeout';
  constructor(message = 'Tempo limite excedido ao comunicar com o Firebase Storage.') {
    super(message);
    this.name = 'StorageTimeoutError';
  }
}

export class StorageBucketNotFoundError extends Error {
  readonly code = 'storage/bucket-not-found';
  constructor(
    message = 'O bucket do Firebase Storage não foi encontrado. Confirme se o serviço está ativado no console do Firebase.'
  ) {
    super(message);
    this.name = 'StorageBucketNotFoundError';
  }
}

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new StorageTimeoutError()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

/**
 * Valida se o bucket configurado existe no Firebase Storage.
 * Em caso de bucket inexistente (404), falha rapidamente em vez de entrar
 * no loop de retries de 45 segundos do Firebase SDK.
 */
export const checkBucketExists = async (bucketName: string): Promise<void> => {
  if (!bucketName) {
    throw new StorageBucketNotFoundError();
  }

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 3500) : null;
    const res = await fetch(
      `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o?maxResults=1`,
      controller ? { signal: controller.signal } : undefined
    );
    if (timer) clearTimeout(timer);

    if (res.status === 404) {
      throw new StorageBucketNotFoundError();
    }
  } catch (err: unknown) {
    if (
      err instanceof StorageBucketNotFoundError ||
      (err as { code?: string })?.code === 'storage/bucket-not-found'
    ) {
      throw err;
    }
    // Falhas de rede transitórias ou ausência de fetch prosseguem para a tentativa padrão
  }
};

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

  const bucket = storage.app.options.storageBucket;
  if (!bucket) {
    throw new StorageBucketNotFoundError();
  }

  await checkBucketExists(bucket);

  const storageRef = ref(storage, `users/${uid}/${kind}`);
  await withTimeout(uploadBytes(storageRef, file, { contentType: file.type }), UPLOAD_TIMEOUT_MS);
  return await withTimeout(getDownloadURL(storageRef), UPLOAD_TIMEOUT_MS);
};

/**
 * Remove a imagem do Storage. Tolerante a arquivos inexistentes.
 */
export const removeProfileImage = async (
  uid: string,
  kind: ProfileImageKind
): Promise<void> => {
  try {
    const bucket = storage.app.options.storageBucket;
    if (bucket) {
      await checkBucketExists(bucket);
    }
    const storageRef = ref(storage, `users/${uid}/${kind}`);
    await withTimeout(deleteObject(storageRef), DELETE_TIMEOUT_MS);
  } catch (error) {
    console.warn(`Erro ao remover imagem (${kind}) do Storage:`, error);
  }
};

/**
 * Mapeia erros do Firebase Storage para mensagens acionáveis em português.
 */
export const getStorageErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code;

  if (code === 'storage/unauthorized') {
    return 'Sem permissão para enviar imagens. Verifique as regras do Firebase Storage.';
  }
  if (
    code === 'storage/bucket-not-found' ||
    code === 'storage/unknown' ||
    error instanceof StorageBucketNotFoundError
  ) {
    return 'O bucket do Firebase Storage não foi encontrado. Confirme se o serviço está ativado no console do Firebase.';
  }
  if (code === 'storage/retry-limit-exceeded') {
    return 'Não foi possível conectar ao Firebase Storage. Confirme se o serviço está ativado no console do Firebase.';
  }
  if (code === 'storage/timeout' || error instanceof StorageTimeoutError) {
    return 'O envio da imagem demorou demais. Verifique sua conexão e tente novamente.';
  }

  return 'Não foi possível enviar a imagem. Tente novamente.';
};
