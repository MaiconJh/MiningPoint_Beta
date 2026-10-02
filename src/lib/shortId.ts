const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export const generateShortId = (): string => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += CHARS[bytes[i] % CHARS.length];
  }
  return result;
};

export const ensureUniqueShortId = (existing: Set<string>): string => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateShortId();
    if (!existing.has(candidate)) {
      return candidate;
    }
  }
  return generateShortId();
};
