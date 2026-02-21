'use client';

import { useRef, useState, useCallback } from 'react';
import { Box, Chip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { ShopList } from '@/types';

interface ShopListChipsProps {
  lists: ShopList[];
  selectedListId: string | null;
  onSelect: (listId: string | null) => void;
  onCreateList: () => void;
  onEditList?: (list: ShopList) => void;
  onDeleteList?: (list: ShopList) => void;
}

export default function ShopListChips({
  lists,
  selectedListId,
  onSelect,
  onCreateList,
  onEditList,
  onDeleteList,
}: ShopListChipsProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuList, setMenuList] = useState<ShopList | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = useCallback((el: HTMLElement, list: ShopList) => {
    setMenuAnchor(el);
    setMenuList(list);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuAnchor(null);
    setMenuList(null);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>, list: ShopList) => {
      longPressTimer.current = setTimeout(() => {
        openMenu(e.currentTarget, list);
      }, 500);
    },
    [openMenu],
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, list: ShopList) => {
      e.preventDefault();
      openMenu(e.currentTarget, list);
    },
    [openMenu],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 0.5,
        overflowX: 'auto',
        pb: 1,
        mb: 1,
        '&::-webkit-scrollbar': { height: 0 },
        scrollbarWidth: 'none',
      }}
    >
      <Chip
        label="すべて"
        size="small"
        color={selectedListId === null ? 'primary' : 'default'}
        variant={selectedListId === null ? 'filled' : 'outlined'}
        onClick={() => onSelect(null)}
        sx={{ flexShrink: 0 }}
      />
      {lists.map((list) => (
        <Chip
          key={list.id}
          label={list.name}
          size="small"
          color={
            selectedListId === list.id
              ? (list.color as
                  | 'default'
                  | 'primary'
                  | 'secondary'
                  | 'success'
                  | 'warning'
                  | 'error')
              : 'default'
          }
          variant={selectedListId === list.id ? 'filled' : 'outlined'}
          onClick={() => onSelect(list.id ?? null)}
          onTouchStart={(e) => handleTouchStart(e, list)}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onContextMenu={(e) => handleContextMenu(e, list)}
          sx={{ flexShrink: 0 }}
        />
      ))}
      <Chip
        icon={<AddIcon />}
        label="リスト作成"
        size="small"
        variant="outlined"
        onClick={onCreateList}
        sx={{ flexShrink: 0 }}
      />

      {/* リスト編集・削除メニュー */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuList && onEditList) onEditList(menuList);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>編集</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuList && onDeleteList) onDeleteList(menuList);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>削除</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
