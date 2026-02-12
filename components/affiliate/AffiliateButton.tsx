'use client';

import { useState, useRef } from 'react';
import { Button, Menu, MenuItem, ListItemText } from '@mui/material';
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
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const shopLinks = getShopLinks(barrel);

  return (
    <>
      <Button
        ref={anchorRef}
        size={size}
        variant={variant}
        startIcon={<ShoppingCartIcon />}
        endIcon={<ArrowDropDownIcon />}
        onClick={() => setOpen(true)}
      >
        購入する
      </Button>
      <Menu
        anchorEl={anchorRef.current}
        open={open}
        onClose={() => setOpen(false)}
      >
        {shopLinks.map((link) => (
          <MenuItem
            key={link.shop}
            component="a"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            <ListItemText>{link.label}で見る</ListItemText>
            <OpenInNewIcon sx={{ fontSize: 16, ml: 1, color: 'text.secondary' }} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
