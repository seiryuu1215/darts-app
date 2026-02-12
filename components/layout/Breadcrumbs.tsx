'use client';

import { Breadcrumbs as MuiBreadcrumbs, Typography, Link as MuiLink } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import NextLink from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <MuiBreadcrumbs sx={{ mb: 2 }}>
      <MuiLink
        component={NextLink}
        href="/"
        color="text.secondary"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        underline="hover"
      >
        <HomeIcon sx={{ fontSize: 18 }} />
        ホーム
      </MuiLink>
      {items.map((item, i) =>
        item.href ? (
          <MuiLink
            key={i}
            component={NextLink}
            href={item.href}
            color="text.secondary"
            underline="hover"
          >
            {item.label}
          </MuiLink>
        ) : (
          <Typography key={i} color="text.primary">
            {item.label}
          </Typography>
        ),
      )}
    </MuiBreadcrumbs>
  );
}
