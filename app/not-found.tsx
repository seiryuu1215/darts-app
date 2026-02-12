import { Container, Typography, Paper, Box } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ textAlign: 'center', p: 4, borderRadius: 3 }}>
        <SearchOffIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
          ページが見つかりません
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          お探しのページは存在しないか、移動された可能性があります。
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                px: 3,
                py: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                borderRadius: 1,
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              トップへ戻る
            </Box>
          </Link>
          <Link href="/barrels" style={{ textDecoration: 'none' }}>
            <Box
              component="span"
              sx={{
                display: 'inline-block',
                px: 3,
                py: 1,
                border: '1px solid',
                borderColor: 'primary.main',
                color: 'primary.main',
                borderRadius: 1,
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              バレル検索
            </Box>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
}
