'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Typography, Link as MuiLink, Paper, Box, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import type { Components } from 'react-markdown';

interface MarkdownContentProps {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
      {children}
    </Typography>
  ),
  h2: ({ children }) => (
    <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, mb: 1.5, fontWeight: 'bold' }}>
      {children}
    </Typography>
  ),
  h3: ({ children }) => (
    <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
      {children}
    </Typography>
  ),
  p: ({ children }) => (
    <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
      {children}
    </Typography>
  ),
  a: ({ href, children }) => (
    <MuiLink href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </MuiLink>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.startsWith('language-');
    if (isBlock) {
      return (
        <Paper variant="outlined" sx={{ p: 2, my: 2, overflow: 'auto', bgcolor: 'action.hover' }}>
          <Box component="pre" sx={{ m: 0, fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
            <code>{children}</code>
          </Box>
        </Paper>
      );
    }
    return (
      <Box
        component="code"
        sx={{ px: 0.5, py: 0.25, borderRadius: 0.5, bgcolor: 'action.hover', fontFamily: 'monospace', fontSize: '0.875em' }}
      >
        {children}
      </Box>
    );
  },
  pre: ({ children }) => <>{children}</>,
  blockquote: ({ children }) => (
    <Box
      component="blockquote"
      sx={{ borderLeft: 4, borderColor: 'primary.main', pl: 2, my: 2, color: 'text.secondary', fontStyle: 'italic' }}
    >
      {children}
    </Box>
  ),
  ul: ({ children }) => (
    <Box component="ul" sx={{ pl: 3, mb: 2 }}>
      {children}
    </Box>
  ),
  ol: ({ children }) => (
    <Box component="ol" sx={{ pl: 3, mb: 2 }}>
      {children}
    </Box>
  ),
  li: ({ children }) => (
    <Typography component="li" variant="body1" sx={{ mb: 0.5, lineHeight: 1.8 }}>
      {children}
    </Typography>
  ),
  table: ({ children }) => (
    <Box sx={{ overflow: 'auto', my: 2 }}>
      <Table size="small">{children}</Table>
    </Box>
  ),
  thead: ({ children }) => <TableHead>{children}</TableHead>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow>{children}</TableRow>,
  th: ({ children }) => (
    <TableCell sx={{ fontWeight: 'bold' }}>{children}</TableCell>
  ),
  td: ({ children }) => <TableCell>{children}</TableCell>,
  hr: () => <Box component="hr" sx={{ my: 3, border: 'none', borderTop: 1, borderColor: 'divider' }} />,
  img: ({ src, alt }) => (
    <Box
      component="img"
      src={src}
      alt={alt || ''}
      sx={{ maxWidth: '100%', height: 'auto', borderRadius: 1, my: 2 }}
    />
  ),
};

export default function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
