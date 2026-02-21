'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Rating,
  Typography,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import type { ShopBookmark, ShopList } from '@/types';

interface ShopBookmarkDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
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
  }) => void;
  initial?: Partial<ShopBookmark> | null;
  homeShop?: string | null;
  lists?: ShopList[];
  userId?: string;
  onCreateList?: () => void;
}

export default function ShopBookmarkDialog({
  open,
  onClose,
  onSave,
  initial,
  homeShop,
  lists,
  userId,
  onCreateList,
}: ShopBookmarkDialogProps) {
  const [url, setUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [nearestStation, setNearestStation] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [machineCount, setMachineCount] = useState<{ dl2: number; dl3: number } | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [showHomeShop, setShowHomeShop] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);

  // Reset form when dialog opens
  if (open && !lastOpen) {
    setUrl('');
    setFetching(false);
    setName(initial?.name || '');
    setAddress(initial?.address || '');
    setNearestStation(initial?.nearestStation || '');
    setImageUrl(initial?.imageUrl ?? null);
    setMachineCount(initial?.machineCount ?? null);
    setTags(initial?.tags ?? []);
    setNote(initial?.note || '');
    setRating(initial?.rating ?? null);
    setIsFavorite(initial?.isFavorite ?? false);
    setSelectedListIds(initial?.listIds ?? []);
    setShowHomeShop(!initial?.name && !!homeShop);
    setUploading(false);
  }
  if (open !== lastOpen) {
    setLastOpen(open);
  }

  const isEdit = useMemo(() => !!initial?.name, [initial]);

  const handleFetchUrl = async () => {
    if (!url.trim()) return;
    setFetching(true);
    try {
      const res = await fetch('/api/shops/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.name) setName(data.name);
      if (data.address) setAddress(data.address);
      if (data.nearestStation) setNearestStation(data.nearestStation);
      if (data.imageUrl) setImageUrl(data.imageUrl);
      if (data.machineCount) setMachineCount(data.machineCount);
      if (data.tags?.length) setTags(data.tags);
    } catch {
      // Silently fail — user can manually input
    } finally {
      setFetching(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `images/shops/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      setImageUrl(downloadUrl);
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      address: address.trim(),
      nearestStation: nearestStation.trim(),
      imageUrl,
      machineCount,
      tags,
      note: note.trim(),
      rating,
      isFavorite,
      listIds: selectedListIds,
    });
  };

  const handleUseHomeShop = () => {
    if (homeShop) {
      setName(homeShop);
      setShowHomeShop(false);
    }
  };

  const toggleList = (listId: string) => {
    setSelectedListIds((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId],
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'ショップ編集' : 'ショップを追加'}</DialogTitle>
      <DialogContent>
        {/* Home shop suggestion */}
        {showHomeShop && homeShop && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button size="small" onClick={handleUseHomeShop}>
                追加
              </Button>
            }
          >
            ホームショップ「{homeShop}」を追加しますか？
          </Alert>
        )}

        {/* URL auto-fetch section */}
        {!isEdit && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              ダーツライブサーチのURLを貼り付けて自動入力
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                placeholder="https://search.dartslive.com/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFetchUrl()}
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <LinkIcon sx={{ mr: 0.5, color: 'text.secondary', fontSize: 18 }} />
                    ),
                  },
                }}
              />
              <Button
                variant="contained"
                size="small"
                onClick={handleFetchUrl}
                disabled={fetching || !url.trim()}
                sx={{ flexShrink: 0, minWidth: 60 }}
              >
                {fetching ? <CircularProgress size={20} /> : '取得'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Image preview & upload */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            src={imageUrl || undefined}
            variant="rounded"
            sx={{ width: 80, height: 80, bgcolor: 'action.hover' }}
          >
            <StorefrontIcon sx={{ fontSize: 36, color: 'text.secondary' }} />
          </Avatar>
          <Box>
            <input
              accept="image/*"
              type="file"
              id="shop-image-upload"
              hidden
              onChange={handleImageUpload}
            />
            <label htmlFor="shop-image-upload">
              <IconButton component="span" size="small" disabled={uploading}>
                {uploading ? <CircularProgress size={20} /> : <PhotoCameraIcon />}
              </IconButton>
            </label>
            {imageUrl && (
              <Button size="small" color="error" onClick={() => setImageUrl(null)}>
                削除
              </Button>
            )}
          </Box>
        </Box>

        <TextField
          label="店名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <TextField
          label="住所"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        <TextField
          label="最寄り駅"
          value={nearestStation}
          onChange={(e) => setNearestStation(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        {/* Tags */}
        {tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              タグ
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  onDelete={() => setTags((prev) => prev.filter((t) => t !== tag))}
                />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            評価
          </Typography>
          <Rating value={rating} onChange={(_, v) => setRating(v)} />
        </Box>

        <TextField
          label="感想・メモ"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          fullWidth
          multiline
          rows={3}
          helperText={`${note.length}/500`}
          sx={{ mb: 2 }}
        />

        {/* List selection */}
        {lists && lists.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              リスト
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {lists.map((list) => (
                <Chip
                  key={list.id}
                  label={list.name}
                  size="small"
                  color={
                    list.id && selectedListIds.includes(list.id)
                      ? (list.color as
                          | 'default'
                          | 'primary'
                          | 'secondary'
                          | 'success'
                          | 'warning'
                          | 'error')
                      : 'default'
                  }
                  variant={list.id && selectedListIds.includes(list.id) ? 'filled' : 'outlined'}
                  onClick={() => list.id && toggleList(list.id)}
                />
              ))}
              {onCreateList && (
                <Chip
                  icon={<AddIcon />}
                  label="新規リスト"
                  size="small"
                  variant="outlined"
                  onClick={onCreateList}
                />
              )}
            </Box>
          </Box>
        )}
        {lists && lists.length === 0 && onCreateList && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              リスト
            </Typography>
            <Chip
              icon={<AddIcon />}
              label="新規リスト"
              size="small"
              variant="outlined"
              onClick={onCreateList}
            />
          </Box>
        )}

        <FormControlLabel
          control={
            <Switch checked={isFavorite} onChange={(e) => setIsFavorite(e.target.checked)} />
          }
          label="お気に入り"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          {isEdit ? '更新' : '追加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
