'use client';

import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

interface XpHistoryEntry {
  id: string;
  action: string;
  xp: number;
  detail: string;
  createdAt: string;
}

interface XpHistoryListProps {
  history: XpHistoryEntry[];
}

export default function XpHistoryList({ history }: XpHistoryListProps) {
  if (history.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          XP履歴
        </Typography>
        <Typography variant="body2" color="text.secondary">
          まだXP獲得履歴がありません
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        XP履歴
      </Typography>
      <List dense disablePadding>
        {history.map((entry) => (
          <ListItem
            key={entry.id}
            disableGutters
            sx={{
              py: 0.5,
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <ListItemText
              primary={entry.detail}
              secondary={
                entry.createdAt
                  ? new Date(entry.createdAt).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''
              }
              slotProps={{
                primary: { variant: 'body2' },
                secondary: { variant: 'caption' },
              }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', color: 'success.main', whiteSpace: 'nowrap' }}
            >
              +{entry.xp} XP
            </Typography>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
