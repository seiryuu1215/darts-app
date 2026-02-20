'use client';

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion
        defaultExpanded={false}
        disableGutters
        sx={{
          '&:before': { display: 'none' },
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">XP履歴</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
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
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
