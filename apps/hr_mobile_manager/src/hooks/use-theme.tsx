import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { localStg } from '@/utils/storage';

const ThemeContext = createContext<{
  theme: StorageType.Local['theme'];
  toggleTheme: () => void;
}>({ theme: 'light', toggleTheme: () => {} });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<StorageType.Local['theme']>(() => {
    const saved = localStg.get('theme');
    return (saved === 'dark' ? 'dark' : 'light') as StorageType.Local['theme'];
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStg.set('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
