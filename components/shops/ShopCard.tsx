'use client';

import {
  Paper,
  Box,
  Typography,
  IconButton,
  Rating,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import DirectionsIcon from '@mui/icons-material/Directions';
import MapIcon from '@mui/icons-material/Map';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState } from 'react';

interface ShopBookmark {
  id?: string;
  note: string;
  rating: number | null;
  visitCount: number;
  isFavorite: boolean;
}

interface Shop {
  id?: string;
  name: string;
  address: string;
  nearestStation?: string;
  area?: string;
}

interface ShopCardProps {
  shop: Shop;
  bookmark?: ShopBookmark | null;
  onBookmark?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onVisit?: () => void;
}

export default function ShopCard({
  shop,
  bookmark,
  onBookmark,
  onEdit,
  onDelete,
  onVisit,
}: ShopCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address || shop.name)}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(shop.address || shop.name)}`;

  return (
    <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} noWrap>
            {shop.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
            {shop.address}
          </Typography>
          {shop.nearestStation && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {shop.nearestStation}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          <IconButton
            size="small"
            onClick={onBookmark}
            color={bookmark ? 'warning' : 'default'}
            aria-label={bookmark ? 'ブックマーク済み' : 'ブックマークする'}
          >
            {bookmark ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            component="a"
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Googleマップで開く"
          >
            <MapIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            component="a"
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="経路"
          >
            <DirectionsIcon fontSize="small" />
          </IconButton>
          {bookmark && (
            <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* ブックマーク済み: 評価・感想 */}
      {bookmark && (
        <Box sx={{ mt: 1 }}>
          {bookmark.rating != null && bookmark.rating > 0 && (
            <Rating value={bookmark.rating} readOnly size="small" sx={{ mb: 0.5 }} />
          )}
          {bookmark.note && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {bookmark.note}
            </Typography>
          )}
          {bookmark.visitCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              訪問: {bookmark.visitCount}回
            </Typography>
          )}
        </Box>
      )}

      {/* ブックマーク済みメニュー */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        onClick={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={onVisit}>
          <ListItemIcon><AddCircleOutlineIcon fontSize="small" /></ListItemIcon>
          <ListItemText>訪問記録</ListItemText>
        </MenuItem>
        <MenuItem onClick={onEdit}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        <MenuItem onClick={onDelete}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>削除</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
}
