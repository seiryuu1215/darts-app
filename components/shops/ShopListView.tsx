'use client';

import { Box, Typography, CircularProgress, Button, Pagination } from '@mui/material';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ShopCard from '@/components/shops/ShopCard';
import type { ShopBookmark, ShopList } from '@/types';

interface ShopListViewProps {
  bookmarksLoading: boolean;
  filteredBookmarks: ShopBookmark[];
  paginatedBookmarks: ShopBookmark[];
  lists: ShopList[];
  hiddenTags: Set<string>;
  isAnyFilterActive: boolean | string | null;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onEdit: (bm: ShopBookmark) => void;
  onDelete: (bm: ShopBookmark) => void;
  onVisit: (bm: ShopBookmark) => void;
  onToggleFavorite: (bm: ShopBookmark) => void;
  onClearAllFilters: () => void;
}

export default function ShopListView({
  bookmarksLoading,
  filteredBookmarks,
  paginatedBookmarks,
  lists,
  hiddenTags,
  isAnyFilterActive,
  totalPages,
  currentPage,
  onPageChange,
  onEdit,
  onDelete,
  onVisit,
  onToggleFavorite,
  onClearAllFilters,
}: ShopListViewProps) {
  if (bookmarksLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (filteredBookmarks.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        {isAnyFilterActive ? (
          <>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              条件に一致するショップがありません
            </Typography>
            <Button size="small" variant="outlined" color="error" onClick={onClearAllFilters}>
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
    );
  }

  return (
    <>
      {paginatedBookmarks.map((bm) => (
        <ShopCard
          key={bm.id}
          bookmark={bm}
          lists={lists}
          hiddenTags={hiddenTags}
          onEdit={() => onEdit(bm)}
          onDelete={() => onDelete(bm)}
          onVisit={() => onVisit(bm)}
          onToggleFavorite={() => onToggleFavorite(bm)}
        />
      ))}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </>
  );
}
