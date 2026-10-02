export interface NavigationItem {
  name: string;
  path: string;
  iconName: 'home' | 'about' | 'events' | 'members' | 'forum' | 'shop';
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { name: 'Home', path: '/', iconName: 'home' },
  { name: 'Sobre', path: '/sobre', iconName: 'about' },
  { name: 'Eventos', path: '/eventos', iconName: 'events' },
  { name: 'Membros', path: '/membros', iconName: 'members' },
  { name: 'Fórum', path: '/forum', iconName: 'forum' },
  { name: 'Loja', path: '/loja', iconName: 'shop' },
];
