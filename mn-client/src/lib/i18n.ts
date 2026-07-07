"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en/translation.json';
import mlTranslation from '../locales/ml/translation.json';

// For optimization, we directly import the small JSON files to avoid network requests.
// As the app grows, you can dynamically import these or use i18next-http-backend.
const resources = {
  en: { translation: enTranslation },
  ml: { translation: mlTranslation },
};

i18n
  // detect user language from browser or localStorage
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ml'],
    
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'], // cache language in localStorage
    }
  });

export default i18n;
