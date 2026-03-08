'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  setDoc,
  Timestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePermission } from '@/lib/hooks/usePermission';
import { useToast } from '@/components/ToastProvider';
import { geocodeAddress } from '@/lib/geocode';
import type { ShopBookmark, ShopList } from '@/types';
import { LINE_CATEGORIES } from '@/lib/line-stations';

const CATEGORY_NAMES = Object.keys(LINE_CATEGORIES);
const ITEMS_PER_PAGE = 30;
const SMOKING_TAGS_SET = new Set(['分煙', '禁煙', '喫煙可']);
const MACHINE_TAG_RE = /^DL[23]\s+\d+台$/;

export interface ShopSaveData {
  name: string;
  address: string;
  nearestStation: string;
  imageUrl: string | null;
  machineCount: { dl2: number; dl3: number } | null;
  tags: string[];
  lines?: string[];
  note: string;
  rating: number | null;
  isFavorite: boolean;
  listIds: string[];
  dartsliveSearchUrl?: string | null;
}

export function useShops() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isPro, shopBookmarkLimit } = usePermission();
  const { showToast } = useToast();
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
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visitFilter, setVisitFilter] = useState<'all' | 'visited' | 'unvisited'>('all');
  const [favoriteFilter, setFavoriteFilter] = useState(false);
  const [deleteConfirmBookmark, setDeleteConfirmBookmark] = useState<ShopBookmark | null>(null);
  const [deleteConfirmList, setDeleteConfirmList] = useState<ShopList | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [hiddenTags, setHiddenTags] = useState<string[]>([]);
  const [tagManageOpen, setTagManageOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [favoriteLines, setFavoriteLines] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

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
      showToast('ブックマークの読み込みに失敗しました');
    } finally {
      setBookmarksLoading(false);
    }
  }, [session]);

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
      showToast('リストの読み込みに失敗しました');
    }
  }, [session]);

  useEffect(() => {
    loadBookmarks();
    loadLists();
  }, [loadBookmarks, loadLists]);

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

  useEffect(() => {
    if (!session?.user?.id) return;
    getDoc(doc(db, 'users', session.user.id, 'shopPreferences', 'main'))
      .then((snap) => {
        if (snap.exists()) {
          setHiddenTags(snap.data()?.hiddenTags ?? []);
          setFavoriteLines(snap.data()?.favoriteLines ?? []);
        }
      })
      .catch(() => {});
  }, [session]);

  const handleSaveHiddenTags = async (tags: string[]) => {
    if (!session?.user?.id) return;
    await setDoc(
      doc(db, 'users', session.user.id, 'shopPreferences', 'main'),
      { hiddenTags: tags },
      { merge: true },
    );
    setHiddenTags(tags);
  };

  const handleSaveFavoriteLines = async (lines: string[]) => {
    if (!session?.user?.id) return;
    await setDoc(
      doc(db, 'users', session.user.id, 'shopPreferences', 'main'),
      { favoriteLines: lines },
      { merge: true },
    );
    setFavoriteLines(lines);
  };

  const atBookmarkLimit = shopBookmarkLimit !== null && bookmarks.length >= shopBookmarkLimit;

  const handleSaveBookmark = async (data: ShopSaveData) => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const now = Timestamp.now();

    let coords: { lat: number; lng: number } | null = null;
    if (data.address) {
      coords = await geocodeAddress(data.address);
    }

    try {
      if (editingBookmark) {
        await updateDoc(doc(db, 'users', userId, 'shopBookmarks', editingBookmark.id!), {
          name: data.name,
          address: data.address,
          nearestStation: data.nearestStation,
          imageUrl: data.imageUrl,
          machineCount: data.machineCount,
          tags: data.tags,
          ...(data.lines !== undefined && { lines: data.lines }),
          note: data.note,
          rating: data.rating,
          isFavorite: data.isFavorite,
          listIds: data.listIds,
          ...(coords && { lat: coords.lat, lng: coords.lng }),
          ...(data.dartsliveSearchUrl !== undefined && {
            dartsliveSearchUrl: data.dartsliveSearchUrl,
          }),
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
          ...(data.lines !== undefined && { lines: data.lines }),
          note: data.note,
          rating: data.rating,
          visitCount: 0,
          lastVisitedAt: null,
          isFavorite: data.isFavorite,
          listIds: data.listIds,
          ...(coords && { lat: coords.lat, lng: coords.lng }),
          dartsliveSearchUrl: data.dartsliveSearchUrl ?? null,
          createdAt: now,
          updatedAt: now,
        });
      }
      setDialogOpen(false);
      setEditingBookmark(null);
      await loadBookmarks();
    } catch {
      showToast('ショップの保存に失敗しました');
    }
  };

  const handleToggleFavorite = async (bm: ShopBookmark) => {
    if (!session?.user?.id) return;
    await updateDoc(doc(db, 'users', session.user.id, 'shopBookmarks', bm.id!), {
      isFavorite: !bm.isFavorite,
      updatedAt: Timestamp.now(),
    });
    await loadBookmarks();
  };

  const handleVisit = async (bm: ShopBookmark) => {
    if (!session?.user?.id) return;
    await updateDoc(doc(db, 'users', session.user.id, 'shopBookmarks', bm.id!), {
      visitCount: increment(1),
      lastVisitedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await loadBookmarks();
  };

  const handleDeleteConfirmed = async () => {
    if (!session?.user?.id || !deleteConfirmBookmark) return;
    await deleteDoc(doc(db, 'users', session.user.id, 'shopBookmarks', deleteConfirmBookmark.id!));
    setDeleteConfirmBookmark(null);
    await loadBookmarks();
  };

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
      showToast('リストの保存に失敗しました');
    }
  };

  const handleDeleteListConfirmed = async () => {
    if (!session?.user?.id || !deleteConfirmList?.id) return;
    const userId = session.user.id;
    const listId = deleteConfirmList.id;

    try {
      const batch = writeBatch(db);
      const affected = bookmarks.filter((bm) => bm.listIds?.includes(listId));
      for (const bm of affected) {
        batch.update(doc(db, 'users', userId, 'shopBookmarks', bm.id!), {
          listIds: bm.listIds.filter((id) => id !== listId),
          updatedAt: Timestamp.now(),
        });
      }
      batch.delete(doc(db, 'users', userId, 'shopLists', listId));
      await batch.commit();

      if (selectedListId === listId) setSelectedListId(null);
      setDeleteConfirmList(null);
      await loadLists();
      await loadBookmarks();
    } catch {
      showToast('リストの削除に失敗しました');
    }
  };

  const resetPage = () => setCurrentPage(1);

  const allRawTags = [...new Set(bookmarks.flatMap((bm) => bm.tags ?? []))];
  const filterTags = allRawTags
    .filter((t) => !SMOKING_TAGS_SET.has(t) && !MACHINE_TAG_RE.test(t))
    .sort();

  const hiddenTagsSet = useMemo(() => new Set(hiddenTags), [hiddenTags]);

  const availableLineSet = new Set(bookmarks.flatMap((bm) => bm.lines ?? []));
  const categoryLines = selectedCategory
    ? (LINE_CATEGORIES[selectedCategory] ?? []).filter((l) => availableLineSet.has(l))
    : [];
  const categoryLineSet = selectedCategory
    ? new Set(LINE_CATEGORIES[selectedCategory] ?? [])
    : null;

  const isAnyFilterActive =
    selectedListId ||
    selectedTags.length > 0 ||
    noSmokingFilter ||
    selectedLine ||
    selectedCategory ||
    visitFilter !== 'all' ||
    favoriteFilter;

  const filteredBookmarks = bookmarks.filter((bm) => {
    if (selectedListId && !bm.listIds?.includes(selectedListId)) return false;
    if (selectedTags.length > 0 && !selectedTags.every((t) => bm.tags?.includes(t))) return false;
    if (noSmokingFilter && bm.tags?.includes('喫煙可')) return false;
    if (favoriteFilter && !bm.isFavorite) return false;
    if (selectedLine) {
      if (!bm.lines?.includes(selectedLine)) return false;
    } else if (categoryLineSet) {
      if (!bm.lines?.some((l) => categoryLineSet.has(l))) return false;
    }
    if (visitFilter === 'visited' && !(bm.visitCount > 0)) return false;
    if (visitFilter === 'unvisited' && bm.visitCount > 0) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredBookmarks.length / ITEMS_PER_PAGE);
  const paginatedBookmarks = filteredBookmarks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const showFrom = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showTo = Math.min(currentPage * ITEMS_PER_PAGE, filteredBookmarks.length);

  const clearAllFilters = () => {
    setSelectedListId(null);
    setSelectedTags([]);
    setNoSmokingFilter(false);
    setSelectedLine(null);
    setSelectedCategory(null);
    setVisitFilter('all');
    setFavoriteFilter(false);
    resetPage();
  };

  const clearChipFilters = () => {
    setSelectedTags([]);
    setNoSmokingFilter(false);
    setVisitFilter('all');
    setFavoriteFilter(false);
    resetPage();
  };

  return {
    session,
    status,
    isPro,
    shopBookmarkLimit,
    bookmarks,
    lists,
    bookmarksLoading,
    dialogOpen,
    setDialogOpen,
    editingBookmark,
    setEditingBookmark,
    homeShop,
    selectedListId,
    setSelectedListId,
    listDialogOpen,
    setListDialogOpen,
    editingList,
    setEditingList,
    selectedTags,
    setSelectedTags,
    noSmokingFilter,
    setNoSmokingFilter,
    selectedLine,
    setSelectedLine,
    selectedCategory,
    setSelectedCategory,
    visitFilter,
    setVisitFilter,
    favoriteFilter,
    setFavoriteFilter,
    deleteConfirmBookmark,
    setDeleteConfirmBookmark,
    deleteConfirmList,
    setDeleteConfirmList,
    showTagFilter,
    setShowTagFilter,
    currentPage,
    setCurrentPage,
    viewMode,
    setViewMode,
    hiddenTags,
    hiddenTagsSet,
    tagManageOpen,
    setTagManageOpen,
    importDialogOpen,
    setImportDialogOpen,
    favoriteLines,
    atBookmarkLimit,
    filterTags,
    availableLineSet,
    categoryLines,
    isAnyFilterActive,
    filteredBookmarks,
    totalPages,
    paginatedBookmarks,
    showFrom,
    showTo,
    resetPage,
    clearAllFilters,
    clearChipFilters,
    loadBookmarks,
    handleSaveBookmark,
    handleToggleFavorite,
    handleVisit,
    handleDeleteConfirmed,
    handleSaveList,
    handleDeleteListConfirmed,
    handleSaveHiddenTags,
    handleSaveFavoriteLines,
    CATEGORY_NAMES,
    ITEMS_PER_PAGE,
  };
}
