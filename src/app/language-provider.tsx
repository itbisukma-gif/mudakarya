'use client';

import { useState, ReactNode } from 'react';
import { LanguageContext, LanguageContextType } from "@/hooks/use-language";
import { dictionaries, Language } from '@/lib/dictionaries';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('id');
  const dictionary = dictionaries[language];

  const value: LanguageContextType = {
    language,
    setLanguage,
    dictionary,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
