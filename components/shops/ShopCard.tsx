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
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmokingRoomsIcon from '@mui/icons-material/SmokingRooms';
import TrainIcon from '@mui/icons-material/Train';
import NoteIcon from '@mui/icons-material/StickyNote2';
import { useState, useMemo } from 'react';
import type { ShopBookmark, ShopList } from '@/types';

const SMOKING_TAGS = ['分煙', '禁煙', '喫煙可'];
const MACHINE_TAG_RE = /^DL[23]\s+\d+台$/;
const ALLOWED_TAGS = ['投げ放題', 'Wi-Fi完備', 'グッズ販売あり'];
const ALLOWED_PARTIAL = ['チャージ', '持ち込み'];

// MUIカラー名 → CSS色の簡易マップ
const LIST_COLOR_MAP: Record<string, string> = {
  primary: '#90caf9',
  secondary: '#ce93d8',
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#f44336',
  default: '#9e9e9e',
};

interface ShopCardProps {
  bookmark: ShopBookmark;
  lists?: ShopList[];
  onEdit?: () => void;
  onDelete?: () => void;
  onVisit?: () => void;
  onToggleFavorite?: () => void;
}

export default function ShopCard({
  bookmark,
  lists,
  onEdit,
  onDelete,
  onVisit,
  onToggleFavorite,
}: ShopCardProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bookmark.address || bookmark.name)}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(bookmark.address || bookmark.name)}`;
  const dartsliveSearchUrl = `https://search.dartslive.com/jp/shops/?freeword=${encodeURIComponent(bookmark.name)}`;

  const assignedLists = lists?.filter((l) => l.id && bookmark.listIds?.includes(l.id)) ?? [];

  const { smokingTag, attributeText } = useMemo(() => {
    const tags = bookmark.tags ?? [];
    const smoking = tags.find((t) => SMOKING_TAGS.includes(t)) ?? null;
    // 属性テキスト行用: 喫煙タグ以外の表示可能タグを「·」区切りで結合
    const attrs = tags.filter((t) => {
      if (SMOKING_TAGS.includes(t)) return false;
      if (MACHINE_TAG_RE.test(t)) return false;
      if (ALLOWED_TAGS.includes(t)) return true;
      if (ALLOWED_PARTIAL.some((p) => t.includes(p))) return true;
      return false;
    });
    const parts: string[] = [];
    if (smoking) parts.push(smoking);
    parts.push(...attrs);
    return { smokingTag: smoking, attributeText: parts.join(' · ') };
  }, [bookmark.tags]);

  return (
    <Paper
      sx={{
        p: 2,
        mb: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
      }}
      onClick={() => window.open(dartsliveSearchUrl, '_blank', 'noopener,noreferrer')}
    >
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite?.();
                  }}
                  aria-label={bookmark.isFavorite ? 'お気に入り解除' : 'お気に入り'}
                  sx={{ p: 0.25, ml: -0.5 }}
                >
                  {bookmark.isFavorite ? (
                    <StarIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                  ) : (
                    <StarBorderIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  )}
                </IconButton>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} noWrap>
                  {bookmark.name}
                </Typography>
                {bookmark.visitCount > 0 && (
                  <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', flexShrink: 0 }} />
                )}
              </Box>
              {bookmark.nearestStation && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrainIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {bookmark.nearestStation}
                  </Typography>
                </Box>
              )}
              {bookmark.address && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                  noWrap
                >
                  {bookmark.address}
                </Typography>
              )}
            </Box>

            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
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

          {/* ダーツ台数 — 最も目立たせる */}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            {bookmark.machineCount?.dl3 != null && bookmark.machineCount.dl3 > 0 && (
              <Chip
                label={`DL3：${bookmark.machineCount.dl3}`}
                size="small"
                color="success"
                sx={{ height: 26, fontSize: '0.8rem', fontWeight: 'bold' }}
              />
            )}
            {bookmark.machineCount?.dl2 != null && bookmark.machineCount.dl2 > 0 && (
              <Chip
                label={`DL2：${bookmark.machineCount.dl2}`}
                size="small"
                sx={{
                  height: 26,
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  bgcolor: 'grey.700',
                  color: 'grey.100',
                }}
              />
            )}
          </Box>

          {/* 属性テキスト行（喫煙・投げ放題・Wi-Fi等を「·」区切り） */}
          {attributeText && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {smokingTag === '喫煙可' && (
                <SmokingRoomsIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              )}
              <Typography variant="caption" color="text.secondary">
                {attributeText}
              </Typography>
            </Box>
          )}

          {/* 路線チップ（統一色・最大2つ） */}
          {bookmark.lines && bookmark.lines.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              {bookmark.lines.slice(0, 2).map((line) => (
                <Chip
                  key={line}
                  label={line}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.6rem',
                    bgcolor: 'action.hover',
                    color: 'text.secondary',
                  }}
                />
              ))}
              {bookmark.lines.length > 2 && (
                <Typography variant="caption" color="text.secondary">
                  +{bookmark.lines.length - 2}
                </Typography>
              )}
            </Box>
          )}

          {/* リスト（カラードット + テキスト・最大2つ） */}
          {assignedLists.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              {assignedLists.slice(0, 2).map((list) => (
                <Box key={list.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: LIST_COLOR_MAP[list.color] ?? LIST_COLOR_MAP.default,
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                    {list.name}
                  </Typography>
                </Box>
              ))}
              {assignedLists.length > 2 && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  +{assignedLists.length - 2}
                </Typography>
              )}
            </Box>
          )}

          {/* Rating */}
          {bookmark.rating != null && bookmark.rating > 0 && (
            <Rating value={bookmark.rating} readOnly size="small" sx={{ mt: 0.5 }} />
          )}

          {/* Note — prominent */}
          {bookmark.note && (
            <Box
              sx={{
                mt: 0.75,
                p: 1,
                bgcolor: 'action.hover',
                borderRadius: 1,
                borderLeft: '3px solid',
                borderLeftColor: 'primary.main',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                <NoteIcon sx={{ fontSize: 14, color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
                <Typography
                  variant="body2"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: '0.8rem',
                    lineHeight: 1.5,
                  }}
                >
                  {bookmark.note}
                </Typography>
              </Box>
            </Box>
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
          <ListItemIcon>
            <AddCircleOutlineIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>訪問記録</ListItemText>
        </MenuItem>
        <MenuItem onClick={onEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        <MenuItem onClick={onDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>削除</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
}
