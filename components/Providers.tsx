'use client';

import { ReactNode, createContext, useMemo, useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export default function Providers({ children }: { children: ReactNode }) {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const stored = localStorage.getItem('colorMode') as 'light' | 'dark' | null;
    setMode(stored || (prefersDark ? 'dark' : 'light'));
  }, [prefersDark]);

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prev) => {
        const next = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem('colorMode', next);
        return next;
      });
    },
  }), []);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#dc004e' },
    },
  }), [mode]);

  return (
    <SessionProvider>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </SessionProvider>
  );
}
