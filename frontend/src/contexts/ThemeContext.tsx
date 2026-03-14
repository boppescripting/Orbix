import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { Theme } from '../types';
import * as api from '../api';
import { useAuth } from './AuthContext';

const DEFAULT_THEME: Theme = {
  background: '#080808',
  surface: '#0f0f0f',
  surfaceHover: '#1a1a1a',
  primary: '#fff500',
  primaryHover: '#ffe000',
  text: '#efefef',
  textMuted: '#555555',
  border: '#2a2a2a',
  success: '#00e676',
  danger: '#ff1744',
  widgetBackground: '#0a0a0a',
  widgetBorder: '#2a2a2a',
  fontFamily: "'Courier New', Courier, monospace",
  fontWeight: '400',
};

function applyThemeToCss(theme: Theme) {
  const root = document.documentElement;
  root.style.setProperty('--color-background', theme.background);
  root.style.setProperty('--color-surface', theme.surface);
  root.style.setProperty('--color-surface-hover', theme.surfaceHover);
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-hover', theme.primaryHover);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-text-muted', theme.textMuted);
  root.style.setProperty('--color-border', theme.border);
  root.style.setProperty('--color-success', theme.success);
  root.style.setProperty('--color-danger', theme.danger);
  root.style.setProperty('--color-widget-bg', theme.widgetBackground);
  root.style.setProperty('--color-widget-border', theme.widgetBorder);
  root.style.setProperty('--font-family', theme.fontFamily ?? "'Courier New', Courier, monospace");
  root.style.setProperty('--font-weight', theme.fontWeight ?? '400');
}

interface ThemeContextValue {
  theme: Theme;
  loading: boolean;
  updateTheme: (partial: Partial<Theme>) => void;
  saveTheme: () => Promise<void>;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [loading, setLoading] = useState(false);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Apply default theme immediately on first render
  useEffect(() => {
    applyThemeToCss(DEFAULT_THEME);
  }, []);

  // When user logs in, fetch their theme
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .getTheme()
      .then((t) => {
        setTheme(t);
        applyThemeToCss(t);
      })
      .catch(() => {
        // Fall back to default
        applyThemeToCss(DEFAULT_THEME);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const updateTheme = useCallback((partial: Partial<Theme>) => {
    setTheme((prev) => {
      const next = { ...prev, ...partial };
      applyThemeToCss(next);
      return next;
    });
  }, []);

  const saveTheme = useCallback(async () => {
    await api.saveTheme(themeRef.current);
  }, []);

  const resetTheme = useCallback(() => {
    setTheme(DEFAULT_THEME);
    applyThemeToCss(DEFAULT_THEME);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, loading, updateTheme, saveTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
