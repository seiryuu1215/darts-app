'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Button,
  Chip,
  CircularProgress,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useSession } from 'next-auth/react';

interface ShopItemData {
  id: string;
  cost: number;
  label: string;
  description: string;
  maxOwned: number;
  owned: number;
}

interface ShopData {
  items: ShopItemData[];
  xp: number;
  milestones: string[];
}

export default function Shop() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const fetchShopData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      const res = await fetch('/api/progression/shop');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (open) fetchShopData();
  }, [open, fetchShopData]);

  const handlePurchase = async (itemId: string) => {
    setPurchasing(itemId);
    try {
      const res = await fetch('/api/progression/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      });
      if (res.ok) {
        await fetchShopData();
      }
    } catch {
      // ignore
    } finally {
      setPurchasing(null);
    }
  };

  if (!session) return null;

  return (
    <>
      <Button
        size="small"
        startIcon={<ShoppingCartIcon />}
        onClick={() => setOpen(true)}
        sx={{ fontSize: '0.75rem' }}
      >
        XPショップ
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>XPショップ</span>
            {data && (
              <Chip
                label={`${data.xp.toLocaleString()} XP`}
                color="primary"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : data ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              {data.items.map((item) => {
                const canBuy = data.xp >= item.cost && item.owned < item.maxOwned;
                const atMax = item.owned >= item.maxOwned;
                return (
                  <Box
                    key={item.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 2,
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">
                        {item.label}
                        {item.owned > 0 && (
                          <Typography
                            component="span"
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 0.5 }}
                          >
                            ({item.owned}/{item.maxOwned})
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                    <Button
                      variant={canBuy ? 'contained' : 'outlined'}
                      size="small"
                      disabled={!canBuy || purchasing === item.id}
                      onClick={() => handlePurchase(item.id)}
                    >
                      {purchasing === item.id ? (
                        <CircularProgress size={16} />
                      ) : atMax ? (
                        '上限'
                      ) : (
                        `${item.cost} XP`
                      )}
                    </Button>
                  </Box>
                );
              })}
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
