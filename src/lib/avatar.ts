const AVATAR_COLORS = [
  '#3F4A5C',
  '#4A5568',
  '#2F4858',
  '#4C5A6B',
  '#3A4A5A',
  '#45566E',
  '#394B5C',
  '#2E3F4F',
];

export const getAvatarColor = (name?: string | null): string => {
  const str = String(name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash + str.charCodeAt(i) * (i + 1)) % 9973;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const getInitials = (name?: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};
