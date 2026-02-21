'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Button,
  Fab,
} from '@mui/material';
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
        query(
          collection(db, 'users', session.user.id, 'shopLists'),
          orderBy('sortOrder', 'asc'),
        ),
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

  // Filter bookmarks by selected list
  const filteredBookmarks = selectedListId
    ? bookmarks.filter((bm) => bm.listIds?.includes(selectedListId))
    : bookmarks;

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

        {/* Bookmarks */}
        {bookmarksLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filteredBookmarks.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {selectedListId
              ? 'このリストにショップはありません'
              : 'ショップを追加してみましょう'}
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
