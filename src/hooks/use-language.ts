
"use client";

import { createContext, useContext } from 'react';
import { dictionaries, Language } from '@/lib/dictionaries';

// We need to redefine the type here because we can't import a value (the `id` object)
// in a client component file that is used in a server component.
// This is a common pattern for creating typed context providers.
type Dictionary = typeof dictionaries['id'];

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  dictionary: Dictionary;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
