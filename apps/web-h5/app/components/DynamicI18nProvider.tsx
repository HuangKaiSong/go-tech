'use client';

import { createContext, useContext } from 'react';

export type DynamicMessages = Record<string, string>;

const DynamicI18nContext = createContext<DynamicMessages | null>(null);

interface DynamicI18nProviderProps {
  children: React.ReactNode;
  messages: DynamicMessages;
}

export function DynamicI18nProvider({
  children,
  messages,
}: DynamicI18nProviderProps) {
  return (
    <DynamicI18nContext.Provider value={messages}>
      {children}
    </DynamicI18nContext.Provider>
  );
}

export function useDynamicMessages(): DynamicMessages | null {
  return useContext(DynamicI18nContext);
}
