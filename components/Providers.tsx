'use client';

import { ReactNode, createContext, useMemo, useState, useEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { ThemeProvider, createTheme, CssBaseline, useMediaQuery } from '@mui/material';
import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

/** NextAuthセッションに連動してFirebase Authにもサインインする */
function FirebaseAuthSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return;

    // 既にFirebase Authにサインイン済みならスキップ
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) return; // 既にサインイン済み
      try {
        const res = await fetch('/api/firebase-token');
        if (!res.ok) return;
        const { token } = await res.json();
        await signInWithCustomToken(firebaseAuth, token);
      } catch (err) {
        console.error('Firebase Auth sync error:', err);
      }
    });

    return () => unsubscribe();
  }, [session, status]);

  return null;
}

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
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
          },
        },
      },
    },
  }), [mode]);

  return (
    <SessionProvider>
      <FirebaseAuthSync />
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </SessionProvider>
  );
}
