'use client';

import { useTransition } from 'react';
import { IconButton, Menu, MenuItem, ListItemText } from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import { useState } from 'react';
import { setUserLocale, type Locale } from '@/i18n/locale';
import { useRouter } from 'next/navigation';

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
];

export default function LocaleSwitcher() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = (locale: Locale) => {
    setAnchorEl(null);
    startTransition(async () => {
      await setUserLocale(locale);
      router.refresh();
    });
  };

  return (
    <>
      <IconButton
        color="inherit"
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="言語切替"
        disabled={isPending}
        sx={{ ml: 0.5 }}
      >
        <TranslateIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
      >
        {LOCALES.map((l) => (
          <MenuItem key={l.code} onClick={() => handleSelect(l.code)}>
            <ListItemText>{l.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
