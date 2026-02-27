'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface ToastContextValue {
  showToast: (message: string, severity?: AlertColor) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('error');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // タイマーのクリーンアップ（メモリリーク防止）
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string, sev: AlertColor = 'error') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
    // Small delay to allow close animation before showing new toast
    timerRef.current = setTimeout(() => {
      setMessage(msg);
      setSeverity(sev);
      setOpen(true);
    }, 100);
  }, []);

  const handleClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity} variant="filled" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
