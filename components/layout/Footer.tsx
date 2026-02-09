'use client';

import { Box, Typography, Link as MuiLink } from '@mui/material';
import XIcon from '@mui/icons-material/X';

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        py: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          開発・お問い合わせ:
        </Typography>
        <MuiLink
          href="https://x.com/seiryuu_darts"
          target="_blank"
          rel="noopener noreferrer"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
        >
          <XIcon sx={{ fontSize: 16 }} />
          <Typography variant="body2" component="span">@seiryuu_darts</Typography>
        </MuiLink>
      </Box>
      <Typography variant="caption" color="text.secondary">
        &copy; {new Date().getFullYear()} Darts Lab
      </Typography>
    </Box>
  );
}
