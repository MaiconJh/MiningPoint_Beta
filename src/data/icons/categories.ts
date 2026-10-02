export type CategoryKey =
  | 'general'
  | 'community'
  | 'exploration'
  | 'progress'
  | 'items'
  | 'achievements'
  | 'time'
  | 'documents';

export const CATEGORIES: { key: CategoryKey; labelPt: string }[] = [
  { key: 'general', labelPt: 'Geral' },
  { key: 'community', labelPt: 'Comunidade' },
  { key: 'exploration', labelPt: 'Exploração' },
  { key: 'progress', labelPt: 'Progresso' },
  { key: 'items', labelPt: 'Itens' },
  { key: 'achievements', labelPt: 'Conquistas' },
  { key: 'time', labelPt: 'Tempo' },
  { key: 'documents', labelPt: 'Documentos' },
];
