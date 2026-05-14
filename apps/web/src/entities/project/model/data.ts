import type { Project } from './types';

export const PROJECTS: Project[] = [
  { id: 'all', name: 'Все проекты', nameEn: 'All projects', icon: '▦', color: '#0a0a0a', count: 27 },
  { id: 'personal', name: 'Личное', nameEn: 'Personal', icon: 'П', color: '#1347ff', count: 12 },
  { id: 'family', name: 'Семья', nameEn: 'Family', icon: 'С', color: '#0a7a3f', count: 8 },
  { id: 'work', name: 'Работа', nameEn: 'Work', icon: 'Р', color: '#6b21d9', count: 7 },
];
