import type { Lang } from '../i18n';

/** Astro's BASE_URL always ends with a slash. */
export const BASE = import.meta.env.BASE_URL;

export const siteOrigin = (import.meta.env.SITE ?? 'https://vitali-lab.github.io').replace(/\/$/, '');

/** Prefix a public asset path with the deployment base. */
export const asset = (path: string): string =>
  `${BASE.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

/** The home URL for a locale, including the deployment base. */
export const home = (lang: Lang): string => (lang === 'ru' ? `${BASE}ru/` : BASE);

/** An absolute URL for canonical / share tags. */
export const absolute = (path: string): string =>
  `${siteOrigin}${BASE}${path.replace(/^\//, '')}`;

export const canonical = (lang: Lang): string => (lang === 'ru' ? absolute('ru/') : absolute(''));
