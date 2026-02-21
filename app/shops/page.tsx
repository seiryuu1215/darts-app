'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Button,
  Fab,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ShopCard from '@/components/shops/ShopCard';
import ShopBookmarkDialog from '@/components/shops/ShopBookmarkDialog';

interface Shop {
  id: string;
  name: string;
  address: string;
  nearestStation?: string;
  area?: string;
}

interface ShopBookmark {
  id: string;
  shopId?: string | null;
  name: string;
  address: string;
  note: string;
  rating: number | null;
  visitCount: number;
  lastVisitedAt: Timestamp | null;
  isFavorite: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function ShopsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Shop[]>([]);
  const [searching, setSearching] = useState(false);
  const [bookmarks, setBookmarks] = useState<ShopBookmark[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<ShopBookmark | null>(null);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  const [homeShop, setHomeShop] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // ブックマーク読み込み
  const loadBookmarks = useCallback(async () => {
    if (!session?.user?.id) return;
    setBookmarksLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'users', session.user.id, 'shopBookmarks'),
          orderBy('isFavorite', 'desc'),
          orderBy('updatedAt', 'desc'),
        ),
      );
      const bms: ShopBookmark[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ShopBookmark[];
      setBookmarks(bms);
    } catch {
      // ignore
    } finally {
      setBookmarksLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // ホームショップ取得
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchHomeShop = async () => {
      try {
        const cacheDoc = await getDoc(doc(db, 'users', session.user.id, 'dartsliveCache', 'latest'));
        if (cacheDoc.exists()) {
          const fullDataStr = cacheDoc.data()?.fullData;
          if (fullDataStr) {
            try {
              const full = JSON.parse(fullDataStr);
              if (full?.current?.homeShop) setHomeShop(full.current.homeShop);
            } catch { /* ignore */ }
          }
        }
      } catch { /* ignore */ }
    };
    fetchHomeShop();
  }, [session]);

  // ショップ検索
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      // Firestore doesn't have full-text search so we filter by area
      // For better search, we query all shops and filter client-side
      const snap = await getDocs(collection(db, 'shops'));
      const allShops: Shop[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Shop[];

      const q = searchQuery.trim().toLowerCase();
      const filtered = allShops.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          (s.area && s.area.includes(q)) ||
          (s.nearestStation && s.nearestStation.toLowerCase().includes(q)),
      );
      setSearchResults(filtered.slice(0, 50));
    } catch {
      // ignore
    } finally {
      setSearching(false);
    }
  };

  // ブックマーク追加/更新
  const handleSaveBookmark = async (data: {
    shopId?: string | null;
    name: string;
    address: string;
    note: string;
    rating: number | null;
    isFavorite: boolean;
  }) => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const now = Timestamp.now();

    try {
      if (editingBookmark) {
        // 更新
        await updateDoc(doc(db, 'users', userId, 'shopBookmarks', editingBookmark.id), {
          name: data.name,
          address: data.address,
          note: data.note,
          rating: data.rating,
          isFavorite: data.isFavorite,
          updatedAt: now,
        });
      } else {
        // 新規追加
        await addDoc(collection(db, 'users', userId, 'shopBookmarks'), {
          shopId: data.shopId ?? null,
          name: data.name,
          address: data.address,
          note: data.note,
          rating: data.rating,
          visitCount: 0,
          lastVisitedAt: null,
          isFavorite: data.isFavorite,
          createdAt: now,
          updatedAt: now,
        });
      }
      setDialogOpen(false);
      setEditingBookmark(null);
      setEditingShop(null);
      await loadBookmarks();
    } catch {
      // ignore
    }
  };

  // ブックマークトグル
  const handleToggleBookmark = async (shop: Shop) => {
    if (!session?.user?.id) return;
    const existing = bookmarks.find((b) => b.shopId === shop.id || b.name === shop.name);
    if (existing) {
      // 削除
      await deleteDoc(doc(db, 'users', session.user.id, 'shopBookmarks', existing.id));
      await loadBookmarks();
    } else {
      // 追加ダイアログ表示
      setEditingShop(shop);
      setEditingBookmark(null);
      setDialogOpen(true);
    }
  };

  // 訪問記録
  const handleVisit = async (bm: ShopBookmark) => {
    if (!session?.user?.id) return;
    await updateDoc(doc(db, 'users', session.user.id, 'shopBookmarks', bm.id), {
      visitCount: increment(1),
      lastVisitedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await loadBookmarks();
  };

  // 削除
  const handleDelete = async (bm: ShopBookmark) => {
    if (!session?.user?.id) return;
    await deleteDoc(doc(db, 'users', session.user.id, 'shopBookmarks', bm.id));
    await loadBookmarks();
  };

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) return null;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'ショップ' }]} />

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          ショップ
        </Typography>

        {/* 検索 */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="店名・エリア・駅名で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            fullWidth
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button variant="contained" onClick={handleSearch} disabled={searching} sx={{ flexShrink: 0 }}>
            検索
          </Button>
        </Box>

        {/* ダーツライブサーチリンク */}
        <Button
          component="a"
          href="https://search.dartslive.com/jp/"
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
          sx={{ mb: 2, textTransform: 'none' }}
        >
          ダーツライブサーチで探す
        </Button>

        {/* 検索結果 */}
        {searching && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        {!searching && searchResults.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              検索結果 ({searchResults.length}件)
            </Typography>
            {searchResults.map((shop) => {
              const bm = bookmarks.find((b) => b.shopId === shop.id || b.name === shop.name);
              return (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  bookmark={bm ?? null}
                  onBookmark={() => handleToggleBookmark(shop)}
                  onEdit={() => {
                    if (bm) {
                      setEditingBookmark(bm);
                      setEditingShop(null);
                      setDialogOpen(true);
                    }
                  }}
                  onDelete={() => bm && handleDelete(bm)}
                  onVisit={() => bm && handleVisit(bm)}
                />
              );
            })}
          </Box>
        )}
        {!searching && searchQuery && searchResults.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            該当するショップが見つかりません
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* ブックマーク済みショップ */}
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1.5 }}>
          マイショップ
        </Typography>

        {bookmarksLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : bookmarks.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            ブックマークしたショップはありません
          </Typography>
        ) : (
          bookmarks.map((bm) => (
            <ShopCard
              key={bm.id}
              shop={{ id: bm.shopId ?? undefined, name: bm.name, address: bm.address }}
              bookmark={bm}
              onBookmark={() => handleDelete(bm)}
              onEdit={() => {
                setEditingBookmark(bm);
                setEditingShop(null);
                setDialogOpen(true);
              }}
              onDelete={() => handleDelete(bm)}
              onVisit={() => handleVisit(bm)}
            />
          ))
        )}
      </Box>

      {/* FAB: 手動追加 */}
      <Fab
        color="primary"
        aria-label="ショップを追加"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          setEditingBookmark(null);
          setEditingShop(null);
          setDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      {/* ブックマークダイアログ */}
      <ShopBookmarkDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingBookmark(null);
          setEditingShop(null);
        }}
        onSave={handleSaveBookmark}
        initial={
          editingBookmark
            ? {
                shopId: editingBookmark.shopId,
                name: editingBookmark.name,
                address: editingBookmark.address,
                note: editingBookmark.note,
                rating: editingBookmark.rating,
                isFavorite: editingBookmark.isFavorite,
              }
            : editingShop
              ? {
                  shopId: editingShop.id,
                  name: editingShop.name,
                  address: editingShop.address,
                }
              : null
        }
        homeShop={homeShop}
      />
    </Container>
  );
}
