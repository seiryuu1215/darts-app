'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

interface XpDetail {
  action: string;
  xp: number;
  label: string;
}

interface XpNotification {
  id: string;
  type: string;
  title: string;
  details: XpDetail[];
  totalXp: number;
}

interface XpNotificationDialogProps {
  open: boolean;
  notifications: XpNotification[];
  onClose: () => void;
}

export default function XpNotificationDialog({
  open,
  notifications,
  onClose,
}: XpNotificationDialogProps) {
  if (notifications.length === 0) return null;

  const totalXp = notifications.reduce((sum, n) => sum + n.totalXp, 0);
  const allDetails = notifications.flatMap((n) => n.details);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmojiEventsIcon color="primary" />
          <span>デイリーXP獲得!</span>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            +{totalXp} XP
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {allDetails.map((detail, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 0.5,
                px: 1,
                borderRadius: 1,
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="body2">{detail.label}</Typography>
              <Chip
                label={`+${detail.xp} XP`}
                size="small"
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={onClose} fullWidth>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
