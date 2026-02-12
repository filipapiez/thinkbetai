import { Locale, LocaleTranslations } from './types';
import { pl } from './pl';
import { fr } from './fr';
import { de } from './de';

export type { Locale, LocaleTranslations };

const translations: Record<Exclude<Locale, 'en'>, LocaleTranslations> = { pl, fr, de };

export const getTranslations = (locale: Exclude<Locale, 'en'>): LocaleTranslations => translations[locale];

export const supportedLocales: Locale[] = ['en', 'pl', 'fr', 'de'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  pl: 'Polski',
  fr: 'Français',
  de: 'Deutsch',
};

export const getLocalePath = (locale: Locale, path: string = '') => {
  if (locale === 'en') return path || '/';
  return `/${locale}${path}`;
};

export const getHreflangEntries = (path: string) => {
  return supportedLocales.map(locale => ({
    locale,
    href: `https://thinkbetai.com${getLocalePath(locale, path)}`,
    hreflang: locale === 'en' ? 'en' : locale,
  }));
};
