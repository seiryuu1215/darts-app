'use client';

import { useState } from 'react';
import { Button, Menu, MenuItem, ListItemText, Chip, Typography } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { getShopLinks } from '@/lib/affiliate';
import type { BarrelProduct } from '@/types';

interface AffiliateButtonProps {
  barrel: BarrelProduct;
  size?: 'small' | 'medium';
  variant?: 'text' | 'outlined' | 'contained';
}

export default function AffiliateButton({
  barrel,
  size = 'small',
  variant = 'text',
}: AffiliateButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const shopLinks = getShopLinks(barrel);

  return (
    <>
      <Button
        size={size}
        variant={variant}
        startIcon={<ShoppingCartIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ whiteSpace: 'nowrap' }}
      >
        購入する
        <Chip
          label="PR"
          size="small"
          variant="outlined"
          sx={{ fontSize: 10, height: 18, ml: 0.5 }}
        />
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 2, py: 0.5, display: 'block' }}
        >
          ※ アフィリエイトリンクを含みます
        </Typography>
        {shopLinks.map((link) => (
          <MenuItem
            key={link.shop}
            component="a"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setAnchorEl(null)}
          >
            <ListItemText>{link.label}で見る</ListItemText>
            <OpenInNewIcon sx={{ fontSize: 16, ml: 1, color: 'text.secondary' }} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
