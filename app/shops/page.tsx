'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Container, Box, Typography, CircularProgress, Button, Fab, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SmokeFreeIcon from '@mui/icons-material/SmokeFree';
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
import ShopListDialog from '@/components/shops/ShopListDialog';
import ShopListChips from '@/components/shops/ShopListChips';
import type { ShopBookmark, ShopList } from '@/types';

export default function ShopsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<ShopBookmark[]>([]);
  const [lists, setLists] = useState<ShopList[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<ShopBookmark | null>(null);
  const [homeShop, setHomeShop] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShopList | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [noSmokingFilter, setNoSmokingFilter] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  // Load bookmarks
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

  // Load lists
  const loadLists = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const snap = await getDocs(
        query(collection(db, 'users', session.user.id, 'shopLists'), orderBy('sortOrder', 'asc')),
      );
      const items: ShopList[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ShopList[];
      setLists(items);
    } catch {
      // ignore
    }
  }, [session]);

  useEffect(() => {
    loadBookmarks();
    loadLists();
  }, [loadBookmarks, loadLists]);

  // Get home shop
  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchHomeShop = async () => {
      try {
        const cacheDoc = await getDoc(
          doc(db, 'users', session.user.id, 'dartsliveCache', 'latest'),
        );
        if (cacheDoc.exists()) {
          const fullDataStr = cacheDoc.data()?.fullData;
          if (fullDataStr) {
            try {
              const full = JSON.parse(fullDataStr);
              if (full?.current?.homeShop) setHomeShop(full.current.homeShop);
            } catch {
              /* ignore */
            }
          }
        }
      } catch {
        /* ignore */
      }
    };
    fetchHomeShop();
  }, [session]);

  // Save bookmark (create / update)
  const handleSaveBookmark = async (data: {
    name: string;
    address: string;
    nearestStation: string;
    imageUrl: string | null;
    machineCount: { dl2: number; dl3: number } | null;
    tags: string[];
    note: string;
    rating: number | null;
    isFavorite: boolean;
    listIds: string[];
  }) => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const now = Timestamp.now();

    try {
      if (editingBookmark) {
        await updateDoc(doc(db, 'users', userId, 'shopBookmarks', editingBookmark.id!), {
          name: data.name,
          address: data.address,
          nearestStation: data.nearestStation,
          imageUrl: data.imageUrl,
          machineCount: data.machineCount,
          tags: data.tags,
          note: data.note,
          rating: data.rating,
          isFavorite: data.isFavorite,
          listIds: data.listIds,
          updatedAt: now,
        });
      } else {
        await addDoc(collection(db, 'users', userId, 'shopBookmarks'), {
          name: data.name,
          address: data.address,
          nearestStation: data.nearestStation,
          imageUrl: data.imageUrl,
          machineCount: data.machineCount,
          tags: data.tags,
          note: data.note,
          rating: data.rating,
          visitCount: 0,
          lastVisitedAt: null,
          isFavorite: data.isFavorite,
          listIds: data.listIds,
          createdAt: now,
          updatedAt: now,
        });
      }
      setDialogOpen(false);
      setEditingBookmark(null);
      await loadBookmarks();
    } catch {
      // ignore
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (bm: ShopBookmark) => {
    if (!session?.user?.id) return;
    await updateDoc(doc(db, 'users', session.user.id, 'shopBookmarks', bm.id!), {
      isFavorite: !bm.isFavorite,
      updatedAt: Timestamp.now(),
    });
    await loadBookmarks();
  };

  // Visit
  const handleVisit = async (bm: ShopBookmark) => {
    if (!session?.user?.id) return;
    await updateDoc(doc(db, 'users', session.user.id, 'shopBookmarks', bm.id!), {
      visitCount: increment(1),
      lastVisitedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await loadBookmarks();
  };

  // Delete
  const handleDelete = async (bm: ShopBookmark) => {
    if (!session?.user?.id) return;
    await deleteDoc(doc(db, 'users', session.user.id, 'shopBookmarks', bm.id!));
    await loadBookmarks();
  };

  // Save list
  const handleSaveList = async (data: { name: string; color: string }) => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const now = Timestamp.now();

    try {
      if (editingList) {
        await updateDoc(doc(db, 'users', userId, 'shopLists', editingList.id!), {
          name: data.name,
          color: data.color,
          updatedAt: now,
        });
      } else {
        await addDoc(collection(db, 'users', userId, 'shopLists'), {
          name: data.name,
          color: data.color,
          sortOrder: lists.length,
          createdAt: now,
          updatedAt: now,
        });
      }
      setListDialogOpen(false);
      setEditingList(null);
      await loadLists();
    } catch {
      // ignore
    }
  };

  // Curated filter tags (only show these in the filter bar)
  const FILTER_TAGS = ['投げ放題', 'Wi-Fi完備', 'グッズ販売あり'];
  const FILTER_PARTIAL = ['チャージ', '持ち込み'];
  const allRawTags = [...new Set(bookmarks.flatMap((bm) => bm.tags ?? []))];
  const filterTags = allRawTags
    .filter((t) => FILTER_TAGS.includes(t) || FILTER_PARTIAL.some((p) => t.includes(p)))
    .sort();

  // Filter bookmarks by selected list, tags, and smoking
  const filteredBookmarks = bookmarks.filter((bm) => {
    if (selectedListId && !bm.listIds?.includes(selectedListId)) return false;
    if (selectedTags.length > 0 && !selectedTags.every((t) => bm.tags?.includes(t))) return false;
    if (noSmokingFilter && bm.tags?.includes('喫煙可')) return false;
    return true;
  });

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
        <Breadcrumbs items={[{ label: 'マイショップ' }]} />

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          マイショップ
        </Typography>

        {/* DARTSLIVE SEARCH link */}
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

        {/* List chip bar */}
        <ShopListChips
          lists={lists}
          selectedListId={selectedListId}
          onSelect={setSelectedListId}
          onCreateList={() => {
            setEditingList(null);
            setListDialogOpen(true);
          }}
        />

        {/* Tag filter */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            flexWrap: 'wrap',
            mb: 1.5,
          }}
        >
          {/* Smoking filter */}
          <Chip
            icon={<SmokeFreeIcon sx={{ fontSize: '14px !important' }} />}
            label="禁煙・分煙のみ"
            size="small"
            color={noSmokingFilter ? 'info' : 'default'}
            variant={noSmokingFilter ? 'filled' : 'outlined'}
            onClick={() => setNoSmokingFilter((prev) => !prev)}
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
          {filterTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              color={selectedTags.includes(tag) ? 'primary' : 'default'}
              variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
              onClick={() =>
                setSelectedTags((prev) =>
                  prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                )
              }
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          ))}
          {(selectedTags.length > 0 || noSmokingFilter) && (
            <Chip
              label="クリア"
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                setSelectedTags([]);
                setNoSmokingFilter(false);
              }}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* Bookmarks */}
        {bookmarksLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredBookmarks.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {selectedListId ? 'このリストにショップはありません' : 'ショップを追加してみましょう'}
          </Typography>
        ) : (
          filteredBookmarks.map((bm) => (
            <ShopCard
              key={bm.id}
              bookmark={bm}
              lists={lists}
              onEdit={() => {
                setEditingBookmark(bm);
                setDialogOpen(true);
              }}
              onDelete={() => handleDelete(bm)}
              onVisit={() => handleVisit(bm)}
              onToggleFavorite={() => handleToggleFavorite(bm)}
            />
          ))
        )}
      </Box>

      {/* FAB: add shop */}
      <Fab
        color="primary"
        aria-label="ショップを追加"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          setEditingBookmark(null);
          setDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      {/* Bookmark dialog */}
      <ShopBookmarkDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingBookmark(null);
        }}
        onSave={handleSaveBookmark}
        initial={
          editingBookmark
            ? {
                name: editingBookmark.name,
                address: editingBookmark.address,
                nearestStation: editingBookmark.nearestStation,
                imageUrl: editingBookmark.imageUrl,
                machineCount: editingBookmark.machineCount,
                tags: editingBookmark.tags,
                note: editingBookmark.note,
                rating: editingBookmark.rating,
                isFavorite: editingBookmark.isFavorite,
                listIds: editingBookmark.listIds,
              }
            : null
        }
        homeShop={homeShop}
        lists={lists}
        userId={session.user.id}
        onCreateList={() => {
          setEditingList(null);
          setListDialogOpen(true);
        }}
      />

      {/* List dialog */}
      <ShopListDialog
        open={listDialogOpen}
        onClose={() => {
          setListDialogOpen(false);
          setEditingList(null);
        }}
        onSave={handleSaveList}
        initial={editingList}
      />
    </Container>
  );
}
