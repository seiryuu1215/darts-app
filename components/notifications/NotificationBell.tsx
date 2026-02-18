'use client';

import { useEffect, useState } from 'react';
import { IconButton, Badge, Popover, Box, Typography, Button, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

interface Notification {
  id: string;
  type: string;
  title: string;
  details: { action: string; xp: number; label: string }[];
  totalXp: number;
  read: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/notifications');
        if (!res.ok) return;
        const json = await res.json();
        setNotifications(json.notifications || []);
      } catch {
        // ignore
      }
    })();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (ids.length === 0) return;
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleOpen}
        size="small"
        sx={{ ml: 0.5 }}
        aria-label="通知"
      >
        <Badge badgeContent={unreadCount} color="error" invisible={unreadCount === 0}>
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 320, maxHeight: 400 } } }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1,
          }}
        >
          <Typography variant="subtitle2">通知</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>
              すべて既読
            </Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            通知はありません
          </Typography>
        ) : (
          <Box sx={{ overflow: 'auto', maxHeight: 320 }}>
            {notifications.map((n) => (
              <Box
                key={n.id}
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: n.read ? 'transparent' : 'action.hover',
                  '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: n.read ? 'normal' : 'bold' }}>
                  {n.title}
                </Typography>
                {n.totalXp > 0 && (
                  <Typography variant="caption" color="primary">
                    +{n.totalXp} XP
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {formatDate(n.createdAt)}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Popover>
    </>
  );
}
