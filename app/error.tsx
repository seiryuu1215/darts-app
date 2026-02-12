'use client';

import { useEffect } from 'react';
import { Container, Typography, Button, Paper, Box } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ textAlign: 'center', p: 4, borderRadius: 3 }}>
        <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
          エラーが発生しました
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          予期しないエラーが発生しました。もう一度お試しいただくか、ページを再読み込みしてください。
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" onClick={reset}>
            もう一度試す
          </Button>
          <Button variant="outlined" onClick={() => (window.location.href = '/')}>
            トップへ戻る
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
