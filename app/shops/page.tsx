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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Collapse,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SmokeFreeIcon from '@mui/icons-material/SmokeFree';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import TrainIcon from '@mui/icons-material/Train';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import dynamic from 'next/dynamic';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ShopCard from '@/components/shops/ShopCard';
import ShopBookmarkDialog from '@/components/shops/ShopBookmarkDialog';
import ShopListDialog from '@/components/shops/ShopListDialog';
import ShopListChips from '@/components/shops/ShopListChips';
import ShopViewToggle from '@/components/shops/ShopViewToggle';
import ProPaywall from '@/components/ProPaywall';
import { usePermission } from '@/lib/hooks/usePermission';
import { SHOP_BOOKMARK_LIMIT_GENERAL } from '@/lib/permissions';
import { geocodeAddress } from '@/lib/geocode';
import type { ShopBookmark, ShopList } from '@/types';
import { LINE_CATEGORIES } from '@/lib/line-stations';

const ShopMapView = dynamic(() => import('@/components/shops/ShopMapView'), { ssr: false });

const CATEGORY_NAMES = Object.keys(LINE_CATEGORIES);
const ITEMS_PER_PAGE = 30;

export default function ShopsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isPro, shopBookmarkLimit } = usePermission();
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

  // PRO制限判定
  const atBookmarkLimit = shopBookmarkLimit !== null && bookmarks.length >= shopBookmarkLimit;

  // Save bookmark (create / update) + ジオコーディング
  const handleSaveBookmark = async (data: {
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
  }) => {
    if (!session?.user?.id) return;
    const userId = session.user.id;
    const now = Timestamp.now();

    // ジオコーディング
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

  // Delete bookmark (確認ダイアログ経由)
  const handleDeleteConfirmed = async () => {
    if (!session?.user?.id || !deleteConfirmBookmark) return;
    await deleteDoc(doc(db, 'users', session.user.id, 'shopBookmarks', deleteConfirmBookmark.id!));
    setDeleteConfirmBookmark(null);
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

  // Delete list（確認ダイアログ経由）
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
      // ignore
    }
  };

  // フィルター変更時にページリセット
  const resetPage = () => setCurrentPage(1);

  // Curated filter tags
  const FILTER_TAGS = ['投げ放題', 'Wi-Fi完備', 'グッズ販売あり'];
  const FILTER_PARTIAL = ['チャージ', '持ち込み'];
  const allRawTags = [...new Set(bookmarks.flatMap((bm) => bm.tags ?? []))];
  const filterTags = allRawTags
    .filter((t) => FILTER_TAGS.includes(t) || FILTER_PARTIAL.some((p) => t.includes(p)))
    .sort();

  // 路線フィルター
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

  // Filter bookmarks
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

  // ページネーション
  const totalPages = Math.ceil(filteredBookmarks.length / ITEMS_PER_PAGE);
  const paginatedBookmarks = filteredBookmarks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const showFrom = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showTo = Math.min(currentPage * ITEMS_PER_PAGE, filteredBookmarks.length);

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

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            マイショップ
          </Typography>
          <ShopViewToggle viewMode={viewMode} onChange={setViewMode} />
        </Box>

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

        {/* PRO制限バナー */}
        {atBookmarkLimit && !isPro && (
          <ProPaywall
            title="ショップ登録は5件まで（無料プラン）"
            description="PROプランにアップグレードすると無制限にショップを登録できます"
            variant="compact"
            currentUsage={{
              current: bookmarks.length,
              limit: SHOP_BOOKMARK_LIMIT_GENERAL,
              label: 'マイショップ',
            }}
          />
        )}

        {/* List chip bar */}
        <ShopListChips
          lists={lists}
          selectedListId={selectedListId}
          onSelect={(id) => {
            setSelectedListId(id);
            resetPage();
          }}
          onCreateList={() => {
            setEditingList(null);
            setListDialogOpen(true);
          }}
          onEditList={(list) => {
            setEditingList(list);
            setListDialogOpen(true);
          }}
          onDeleteList={(list) => setDeleteConfirmList(list)}
        />

        {/* 路線フィルター — 2段構成 */}
        {availableLineSet.size > 0 && (
          <Box sx={{ mb: 1 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                overflowX: 'auto',
                pb: 0.5,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'action.hover', borderRadius: 2 },
              }}
            >
              <Chip
                label="全路線"
                size="small"
                color={!selectedCategory && !selectedLine ? 'primary' : 'default'}
                variant={!selectedCategory && !selectedLine ? 'filled' : 'outlined'}
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedLine(null);
                  resetPage();
                }}
                sx={{ height: 24, fontSize: '0.7rem', flexShrink: 0 }}
              />
              {CATEGORY_NAMES.map((cat) => (
                <Chip
                  key={cat}
                  icon={<TrainIcon sx={{ fontSize: '14px !important' }} />}
                  label={cat}
                  size="small"
                  color={selectedCategory === cat ? 'primary' : 'default'}
                  variant={selectedCategory === cat ? 'filled' : 'outlined'}
                  onClick={() => {
                    setSelectedCategory((prev) => (prev === cat ? null : cat));
                    setSelectedLine(null);
                    resetPage();
                  }}
                  sx={{ height: 24, fontSize: '0.7rem', flexShrink: 0 }}
                />
              ))}
            </Box>

            {selectedCategory && categoryLines.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                  overflowX: 'auto',
                  pt: 0.5,
                  pb: 0.5,
                  '&::-webkit-scrollbar': { height: 4 },
                  '&::-webkit-scrollbar-thumb': { bgcolor: 'action.hover', borderRadius: 2 },
                }}
              >
                {categoryLines.map((line) => (
                  <Chip
                    key={line}
                    label={line}
                    size="small"
                    color={selectedLine === line ? 'secondary' : 'default'}
                    variant={selectedLine === line ? 'filled' : 'outlined'}
                    onClick={() => {
                      setSelectedLine((prev) => (prev === line ? null : line));
                      resetPage();
                    }}
                    sx={{ height: 24, fontSize: '0.7rem', flexShrink: 0 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* 1行目: メインフィルター */}
        <Box
          sx={{
            display: 'flex',
            gap: 0.5,
            flexWrap: 'wrap',
            mb: 0.5,
          }}
        >
          <Chip
            icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
            label="お気に入り"
            size="small"
            color={favoriteFilter ? 'warning' : 'default'}
            variant={favoriteFilter ? 'filled' : 'outlined'}
            onClick={() => {
              setFavoriteFilter((prev) => !prev);
              resetPage();
            }}
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
          <Chip
            icon={<SmokeFreeIcon sx={{ fontSize: '14px !important' }} />}
            label="禁煙・分煙のみ"
            size="small"
            color={noSmokingFilter ? 'info' : 'default'}
            variant={noSmokingFilter ? 'filled' : 'outlined'}
            onClick={() => {
              setNoSmokingFilter((prev) => !prev);
              resetPage();
            }}
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
            label="訪問済み"
            size="small"
            color={visitFilter === 'visited' ? 'success' : 'default'}
            variant={visitFilter === 'visited' ? 'filled' : 'outlined'}
            onClick={() => {
              setVisitFilter((prev) => (prev === 'visited' ? 'all' : 'visited'));
              resetPage();
            }}
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
          <Chip
            label="未訪問"
            size="small"
            color={visitFilter === 'unvisited' ? 'warning' : 'default'}
            variant={visitFilter === 'unvisited' ? 'filled' : 'outlined'}
            onClick={() => {
              setVisitFilter((prev) => (prev === 'unvisited' ? 'all' : 'unvisited'));
              resetPage();
            }}
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
          {(selectedTags.length > 0 ||
            noSmokingFilter ||
            visitFilter !== 'all' ||
            favoriteFilter) && (
            <Chip
              label="クリア"
              size="small"
              variant="outlined"
              color="error"
              onClick={() => {
                setSelectedTags([]);
                setNoSmokingFilter(false);
                setVisitFilter('all');
                setFavoriteFilter(false);
                resetPage();
              }}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {/* 2行目: タグフィルター（折りたたみ） */}
        {filterTags.length > 0 && (
          <Box sx={{ mb: 1 }}>
            <Chip
              label={showTagFilter ? 'タグで絞る ▲' : 'タグで絞る ▼'}
              size="small"
              variant="outlined"
              icon={
                showTagFilter ? (
                  <ExpandLessIcon sx={{ fontSize: '14px !important' }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: '14px !important' }} />
                )
              }
              onClick={() => setShowTagFilter((prev) => !prev)}
              sx={{ height: 24, fontSize: '0.7rem', mb: 0.5 }}
            />
            <Collapse in={showTagFilter}>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {filterTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    color={selectedTags.includes(tag) ? 'primary' : 'default'}
                    variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                    onClick={() => {
                      setSelectedTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                      );
                      resetPage();
                    }}
                    sx={{ height: 24, fontSize: '0.7rem' }}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        {/* 件数表示 */}
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {!isPro && shopBookmarkLimit !== null
            ? `${bookmarks.length}/${shopBookmarkLimit}件`
            : isAnyFilterActive
              ? filteredBookmarks.length > ITEMS_PER_PAGE
                ? `${showFrom}-${showTo} / 全${filteredBookmarks.length}件（絞り込み中: 全${bookmarks.length}件）`
                : `${filteredBookmarks.length}件 / 全${bookmarks.length}件`
              : filteredBookmarks.length > ITEMS_PER_PAGE
                ? `${showFrom}-${showTo} / 全${bookmarks.length}件`
                : `${bookmarks.length}件`}
        </Typography>

        {/* 地図/リスト表示 */}
        {viewMode === 'map' ? (
          <ShopMapView bookmarks={filteredBookmarks} />
        ) : (
          <>
            {/* Bookmarks */}
            {bookmarksLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : filteredBookmarks.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                {isAnyFilterActive ? (
                  <>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>
                      条件に一致するショップがありません
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setSelectedListId(null);
                        setSelectedTags([]);
                        setNoSmokingFilter(false);
                        setSelectedLine(null);
                        setSelectedCategory(null);
                        setVisitFilter('all');
                        setFavoriteFilter(false);
                        resetPage();
                      }}
                    >
                      フィルターをクリア
                    </Button>
                  </>
                ) : (
                  <>
                    <StorefrontIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary">
                      お気に入りのダーツショップを追加してみましょう
                    </Typography>
                  </>
                )}
              </Box>
            ) : (
              <>
                {paginatedBookmarks.map((bm) => (
                  <ShopCard
                    key={bm.id}
                    bookmark={bm}
                    lists={lists}
                    onEdit={() => {
                      setEditingBookmark(bm);
                      setDialogOpen(true);
                    }}
                    onDelete={() => setDeleteConfirmBookmark(bm)}
                    onVisit={() => handleVisit(bm)}
                    onToggleFavorite={() => handleToggleFavorite(bm)}
                  />
                ))}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(_, page) => setCurrentPage(page)}
                      color="primary"
                      size="small"
                    />
                  </Box>
                )}
              </>
            )}
          </>
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
        disabled={atBookmarkLimit && !isPro}
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
                lines: editingBookmark.lines,
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

      {/* ショップ削除確認ダイアログ */}
      <Dialog open={Boolean(deleteConfirmBookmark)} onClose={() => setDeleteConfirmBookmark(null)}>
        <DialogTitle>ショップを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{deleteConfirmBookmark?.name}」を削除しますか？この操作は取り消せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmBookmark(null)}>キャンセル</Button>
          <Button onClick={handleDeleteConfirmed} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>

      {/* リスト削除確認ダイアログ */}
      <Dialog open={Boolean(deleteConfirmList)} onClose={() => setDeleteConfirmList(null)}>
        <DialogTitle>リストを削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{deleteConfirmList?.name}
            」を削除しますか？リスト内のショップは削除されませんが、リストへの紐付けは解除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmList(null)}>キャンセル</Button>
          <Button onClick={handleDeleteListConfirmed} color="error" variant="contained">
            削除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
