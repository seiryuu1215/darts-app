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
  Chip,
  Avatar,
} from '@mui/material';
import DirectionsIcon from '@mui/icons-material/Directions';
import MapIcon from '@mui/icons-material/Map';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import StorefrontIcon from '@mui/icons-material/Storefront';
import TrainIcon from '@mui/icons-material/Train';
import { useState } from 'react';
import type { ShopBookmark, ShopList } from '@/types';

interface ShopCardProps {
  bookmark: ShopBookmark;
  lists?: ShopList[];
  onEdit?: () => void;
  onDelete?: () => void;
  onVisit?: () => void;
}

export default function ShopCard({
  bookmark,
  lists,
  onEdit,
  onDelete,
  onVisit,
}: ShopCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bookmark.address || bookmark.name)}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(bookmark.address || bookmark.name)}`;

  const assignedLists = lists?.filter((l) => l.id && bookmark.listIds?.includes(l.id)) ?? [];

  return (
    <Paper sx={{ p: 2, mb: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
        {/* Thumbnail */}
        <Avatar
          src={bookmark.imageUrl || undefined}
          variant="rounded"
          sx={{ width: 72, height: 72, flexShrink: 0, bgcolor: 'action.hover' }}
        >
          <StorefrontIcon sx={{ fontSize: 32, color: 'text.secondary' }} />
        </Avatar>

        {/* Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} noWrap>
                {bookmark.name}
              </Typography>
              {bookmark.nearestStation && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrainIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {bookmark.nearestStation}
                  </Typography>
                </Box>
              )}
              {bookmark.address && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                  {bookmark.address}
                </Typography>
              )}
              {bookmark.machineCount && (bookmark.machineCount.dl2 > 0 || bookmark.machineCount.dl3 > 0) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {[
                    bookmark.machineCount.dl3 > 0 && `DL3: ${bookmark.machineCount.dl3}台`,
                    bookmark.machineCount.dl2 > 0 && `DL2: ${bookmark.machineCount.dl2}台`,
                  ].filter(Boolean).join(' / ')}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
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
              <IconButton size="small" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* List Chips */}
          {assignedLists.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              {assignedLists.slice(0, 3).map((list) => (
                <Chip
                  key={list.id}
                  label={list.name}
                  size="small"
                  color={list.color as 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              ))}
              {assignedLists.length > 3 && (
                <Typography variant="caption" color="text.secondary">
                  +{assignedLists.length - 3}
                </Typography>
              )}
            </Box>
          )}

          {/* Rating & Note */}
          {bookmark.rating != null && bookmark.rating > 0 && (
            <Rating value={bookmark.rating} readOnly size="small" sx={{ mt: 0.5 }} />
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
                mt: 0.5,
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
      </Box>

      {/* Menu */}
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
