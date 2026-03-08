'use client';

import { Container, Box, Typography, CircularProgress, Button, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrainIcon from '@mui/icons-material/Train';
import dynamic from 'next/dynamic';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import ShopBookmarkDialog from '@/components/shops/ShopBookmarkDialog';
import ShopListDialog from '@/components/shops/ShopListDialog';
import ShopListChips from '@/components/shops/ShopListChips';
import ShopViewToggle from '@/components/shops/ShopViewToggle';
import ShopFilterControls from '@/components/shops/ShopFilterControls';
import ShopListView from '@/components/shops/ShopListView';
import ShopDeleteDialogs from '@/components/shops/ShopDeleteDialogs';
import TagManageDialog from '@/components/shops/TagManageDialog';
import LineImportDialog from '@/components/shops/LineImportDialog';
import ProPaywall from '@/components/ProPaywall';
import { useShops } from '@/lib/hooks/useShops';
import { SHOP_BOOKMARK_LIMIT_GENERAL } from '@/lib/permissions';

const ShopMapView = dynamic(() => import('@/components/shops/ShopMapView'), { ssr: false });

export default function ShopsPage() {
  const shops = useShops();

  if (shops.status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!shops.session) return null;

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
          <ShopViewToggle viewMode={shops.viewMode} onChange={shops.setViewMode} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            component="a"
            href="https://search.dartslive.com/jp/"
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
            sx={{ textTransform: 'none' }}
          >
            ダーツライブサーチで探す
          </Button>
          {shops.isPro ? (
            <Button
              startIcon={<TrainIcon />}
              onClick={() => shops.setImportDialogOpen(true)}
              size="small"
              variant="outlined"
            >
              路線から取り込む
            </Button>
          ) : (
            <ProPaywall
              title="路線一括インポート"
              description="よく使う路線のダーツバーを自動で取り込めます"
              variant="compact"
            />
          )}
        </Box>

        {shops.atBookmarkLimit && !shops.isPro && (
          <ProPaywall
            title="ショップ登録は5件まで（無料プラン）"
            description="PROプランにアップグレードすると無制限にショップを登録できます"
            variant="compact"
            currentUsage={{
              current: shops.bookmarks.length,
              limit: SHOP_BOOKMARK_LIMIT_GENERAL,
              label: 'マイショップ',
            }}
          />
        )}

        <ShopListChips
          lists={shops.lists}
          selectedListId={shops.selectedListId}
          onSelect={(id) => {
            shops.setSelectedListId(id);
            shops.resetPage();
          }}
          onCreateList={() => {
            shops.setEditingList(null);
            shops.setListDialogOpen(true);
          }}
          onEditList={(list) => {
            shops.setEditingList(list);
            shops.setListDialogOpen(true);
          }}
          onDeleteList={(list) => shops.setDeleteConfirmList(list)}
        />

        <ShopFilterControls
          categoryNames={shops.CATEGORY_NAMES}
          selectedCategory={shops.selectedCategory}
          onSelectCategory={(cat) => {
            shops.setSelectedCategory(cat);
            shops.resetPage();
          }}
          selectedLine={shops.selectedLine}
          onSelectLine={(line) => {
            shops.setSelectedLine(line);
            shops.resetPage();
          }}
          categoryLines={shops.categoryLines}
          availableLineSet={shops.availableLineSet}
          favoriteFilter={shops.favoriteFilter}
          onToggleFavorite={() => {
            shops.setFavoriteFilter((prev) => !prev);
            shops.resetPage();
          }}
          noSmokingFilter={shops.noSmokingFilter}
          onToggleNoSmoking={() => {
            shops.setNoSmokingFilter((prev) => !prev);
            shops.resetPage();
          }}
          visitFilter={shops.visitFilter}
          onSetVisitFilter={(v) => {
            shops.setVisitFilter(v);
            shops.resetPage();
          }}
          selectedTags={shops.selectedTags}
          onToggleTag={(tag) => {
            shops.setSelectedTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
            );
            shops.resetPage();
          }}
          filterTags={shops.filterTags}
          showTagFilter={shops.showTagFilter}
          onToggleShowTagFilter={() => shops.setShowTagFilter((prev) => !prev)}
          onClearChipFilters={shops.clearChipFilters}
          onOpenTagManage={() => shops.setTagManageOpen(true)}
        />

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {!shops.isPro && shops.shopBookmarkLimit !== null
            ? `${shops.bookmarks.length}/${shops.shopBookmarkLimit}件`
            : shops.isAnyFilterActive
              ? shops.filteredBookmarks.length > shops.ITEMS_PER_PAGE
                ? `${shops.showFrom}-${shops.showTo} / 全${shops.filteredBookmarks.length}件（絞り込み中: 全${shops.bookmarks.length}件）`
                : `${shops.filteredBookmarks.length}件 / 全${shops.bookmarks.length}件`
              : shops.filteredBookmarks.length > shops.ITEMS_PER_PAGE
                ? `${shops.showFrom}-${shops.showTo} / 全${shops.bookmarks.length}件`
                : `${shops.bookmarks.length}件`}
        </Typography>

        {shops.viewMode === 'map' ? (
          <ShopMapView bookmarks={shops.filteredBookmarks} />
        ) : (
          <ShopListView
            bookmarksLoading={shops.bookmarksLoading}
            filteredBookmarks={shops.filteredBookmarks}
            paginatedBookmarks={shops.paginatedBookmarks}
            lists={shops.lists}
            hiddenTags={shops.hiddenTagsSet}
            isAnyFilterActive={shops.isAnyFilterActive}
            totalPages={shops.totalPages}
            currentPage={shops.currentPage}
            onPageChange={shops.setCurrentPage}
            onEdit={(bm) => {
              shops.setEditingBookmark(bm);
              shops.setDialogOpen(true);
            }}
            onDelete={(bm) => shops.setDeleteConfirmBookmark(bm)}
            onVisit={shops.handleVisit}
            onToggleFavorite={shops.handleToggleFavorite}
            onClearAllFilters={shops.clearAllFilters}
          />
        )}
      </Box>

      <Fab
        color="primary"
        aria-label="ショップを追加"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => {
          shops.setEditingBookmark(null);
          shops.setDialogOpen(true);
        }}
        disabled={shops.atBookmarkLimit && !shops.isPro}
      >
        <AddIcon />
      </Fab>

      <ShopBookmarkDialog
        open={shops.dialogOpen}
        onClose={() => {
          shops.setDialogOpen(false);
          shops.setEditingBookmark(null);
        }}
        onSave={shops.handleSaveBookmark}
        initial={
          shops.editingBookmark
            ? {
                name: shops.editingBookmark.name,
                address: shops.editingBookmark.address,
                nearestStation: shops.editingBookmark.nearestStation,
                imageUrl: shops.editingBookmark.imageUrl,
                machineCount: shops.editingBookmark.machineCount,
                tags: shops.editingBookmark.tags,
                lines: shops.editingBookmark.lines,
                note: shops.editingBookmark.note,
                rating: shops.editingBookmark.rating,
                isFavorite: shops.editingBookmark.isFavorite,
                listIds: shops.editingBookmark.listIds,
                dartsliveSearchUrl: shops.editingBookmark.dartsliveSearchUrl,
              }
            : null
        }
        homeShop={shops.homeShop}
        lists={shops.lists}
        userId={shops.session.user.id}
        onCreateList={() => {
          shops.setEditingList(null);
          shops.setListDialogOpen(true);
        }}
      />

      <ShopListDialog
        open={shops.listDialogOpen}
        onClose={() => {
          shops.setListDialogOpen(false);
          shops.setEditingList(null);
        }}
        onSave={shops.handleSaveList}
        initial={shops.editingList}
      />

      <ShopDeleteDialogs
        deleteConfirmBookmark={shops.deleteConfirmBookmark}
        onCloseBookmarkDelete={() => shops.setDeleteConfirmBookmark(null)}
        onConfirmBookmarkDelete={shops.handleDeleteConfirmed}
        deleteConfirmList={shops.deleteConfirmList}
        onCloseListDelete={() => shops.setDeleteConfirmList(null)}
        onConfirmListDelete={shops.handleDeleteListConfirmed}
      />

      <TagManageDialog
        open={shops.tagManageOpen}
        onClose={() => shops.setTagManageOpen(false)}
        allTags={shops.filterTags}
        hiddenTags={shops.hiddenTags}
        onSave={shops.handleSaveHiddenTags}
      />

      <LineImportDialog
        open={shops.importDialogOpen}
        onClose={() => shops.setImportDialogOpen(false)}
        onComplete={shops.loadBookmarks}
        favoriteLines={shops.favoriteLines}
        onSaveFavoriteLines={shops.handleSaveFavoriteLines}
      />
    </Container>
  );
}
