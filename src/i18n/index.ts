import { en, type Copy } from './en';
import { ru } from './ru';

export type Lang = 'en' | 'ru';

const copy: Record<Lang, Copy> = { en, ru };

export const getCopy = (lang: Lang): Copy => copy[lang];
export type { Copy };
