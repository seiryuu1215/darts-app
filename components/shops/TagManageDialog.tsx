'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Switch,
  Box,
} from '@mui/material';

interface TagManageDialogProps {
  open: boolean;
  onClose: () => void;
  allTags: string[];
  hiddenTags: string[];
  onSave: (hiddenTags: string[]) => void;
}

export default function TagManageDialog({
  open,
  onClose,
  allTags,
  hiddenTags,
  onSave,
}: TagManageDialogProps) {
  const [localHidden, setLocalHidden] = useState<Set<string>>(new Set());

  const handleEnter = () => {
    setLocalHidden(new Set(hiddenTags));
  };

  const handleToggle = (tag: string) => {
    setLocalHidden((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const handleSave = () => {
    onSave([...localHidden]);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      TransitionProps={{ onEnter: handleEnter }}
    >
      <DialogTitle>タグ表示設定</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, px: 2, pt: 1 }}>
          <Button size="small" onClick={() => setLocalHidden(new Set())}>
            すべて表示
          </Button>
          <Button size="small" onClick={() => setLocalHidden(new Set(allTags))}>
            すべて非表示
          </Button>
        </Box>
        <List dense>
          {allTags.map((tag) => {
            const isHidden = localHidden.has(tag);
            return (
              <ListItem
                key={tag}
                secondaryAction={
                  <Switch checked={!isHidden} onChange={() => handleToggle(tag)} size="small" />
                }
              >
                <ListItemText
                  primary={tag}
                  sx={{
                    textDecoration: isHidden ? 'line-through' : 'none',
                    color: isHidden ? 'text.disabled' : 'text.primary',
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button onClick={handleSave} variant="contained">
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
