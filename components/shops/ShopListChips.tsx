'use client';

import { Box, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { ShopList } from '@/types';

interface ShopListChipsProps {
  lists: ShopList[];
  selectedListId: string | null; // null = "すべて"
  onSelect: (listId: string | null) => void;
  onCreateList: () => void;
}

export default function ShopListChips({
  lists,
  selectedListId,
  onSelect,
  onCreateList,
}: ShopListChipsProps) {
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
    </Box>
  );
}
