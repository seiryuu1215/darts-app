'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert } from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { usePermission } from '@/lib/hooks/usePermission';
import ProPaywall from '@/components/ProPaywall';

export default function PushOptIn() {
  const { canUsePushNotifications } = usePermission();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const isSupported = 'PushManager' in window && 'serviceWorker' in navigator;
    setSupported(isSupported);
    if (isSupported) {
      setPermission(Notification.permission);
    }

    // 既存subscription確認
    if (isSupported && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  if (!canUsePushNotifications) {
    return (
      <ProPaywall
        title="Push通知"
        description="PROプランでプレイデータの変更をリアルタイムで受け取れます"
        variant="compact"
      />
    );
  }

  if (!supported) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        このブラウザはPush通知に対応していません
      </Alert>
    );
  }

  if (permission === 'denied') {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        通知がブロックされています。ブラウザ設定から許可してください。
      </Alert>
    );
  }

  const handleSubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return;

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        setError('VAPID鍵が設定されていません');
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      const res = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '登録に失敗しました');
      }

      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知の有効化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    setError('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch('/api/push-subscription', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知の無効化に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Push通知
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}
      {subscribed ? (
        <Button
          variant="outlined"
          size="small"
          startIcon={<NotificationsOffIcon />}
          onClick={handleUnsubscribe}
          disabled={loading}
        >
          {loading ? '処理中...' : '通知を無効にする'}
        </Button>
      ) : (
        <Button
          variant="contained"
          size="small"
          startIcon={<NotificationsActiveIcon />}
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? '処理中...' : '通知を有効にする'}
        </Button>
      )}
    </Box>
  );
}
