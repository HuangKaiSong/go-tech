'use client';

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { MOBILE_BREAKPOINT, VIEW_MODE_COOKIE, type ViewMode, getViewFrame, parseViewMode } from '@/lib/view-mode';

interface ViewModeContextValue {
  frame: ReturnType<typeof getViewFrame> | null;
  isMobile: boolean;
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children, initialMode = 'auto' }: { children: ReactNode; initialMode?: ViewMode }) {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  const [viewport, setViewport] = useState<{ height: number; width: number } | null>(null);

  useEffect(() => {
    // Migrate the old preview preference without importing iframe behavior.
    if (!document.cookie.split(';').some(cookie => cookie.trim().startsWith(`${VIEW_MODE_COOKIE}=`))) {
      try {
        const saved = parseViewMode(localStorage.getItem('viewMode'));
        if (saved === 'mobile' || localStorage.getItem('forcePC')) setMode(saved === 'mobile' ? 'mobile' : 'pc');
      } catch {
        // Storage can be unavailable in restricted browser sessions.
      }
    }

    let previousWidth = window.innerWidth;
    const measure = () => {
      const width = window.innerWidth;
      // A real width change resumes responsive layout after a manual preview.
      // Height-only changes (for example the mobile keyboard) keep the chosen mode.
      if (width !== previousWidth) setMode('auto');
      previousWidth = width;
      setViewport({ width, height: window.visualViewport?.height ?? window.innerHeight });
    };
    measure();
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, []);

  const handleModeChange = (nextMode: ViewMode) => {
    setMode(nextMode);
    document.cookie = `${VIEW_MODE_COOKIE}=${nextMode}; Path=/; Max-Age=31536000; SameSite=Lax`;
    try {
      localStorage.setItem('viewMode', nextMode);
      localStorage.removeItem('forcePC');
    } catch {
      // The current display mode still works without persistence.
    }
  };

  const frame = viewport ? getViewFrame(mode, viewport) : null;
  return (
    <ViewModeContext.Provider
      value={{ mode, setMode: handleModeChange, frame, isMobile: (frame?.width ?? 1280) < MOBILE_BREAKPOINT }}
    >
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (!context) throw new Error('useViewMode must be used inside ViewModeProvider');
  return context;
}
