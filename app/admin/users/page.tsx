'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  subscriptionStatus: string | null;
  subscriptionId: string | null;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !isAdmin) {
      router.push('/');
      return;
    }

    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const userList: UserRow[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          email: doc.data().email || '',
          displayName: doc.data().displayName || '',
          role: doc.data().role || 'general',
          subscriptionStatus: doc.data().subscriptionStatus || null,
          subscriptionId: doc.data().subscriptionId || null,
        }));
        // admin を先頭、次にpro、最後にgeneral
        userList.sort((a, b) => {
          const order = { admin: 0, pro: 1, general: 2 };
          return order[a.role] - order[b.role];
        });
        setUsers(userList);
      } catch {
        setError('ユーザ一覧の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [session, status, isAdmin, router]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '権限変更に失敗しました');
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      setSuccess('権限を変更しました');
    } catch {
      setError('権限変更に失敗しました');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        ユーザ管理
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>表示名</TableCell>
              <TableCell>メール</TableCell>
              <TableCell>権限</TableCell>
              <TableCell>サブスク</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    size="small"
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                  >
                    <MenuItem value="admin">admin</MenuItem>
                    <MenuItem value="pro">pro</MenuItem>
                    <MenuItem value="general">general</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  {user.role === 'pro' && !user.subscriptionId ? (
                    <Chip label="手動" size="small" variant="outlined" />
                  ) : user.subscriptionStatus === 'active' ? (
                    <Chip label="active" size="small" color="success" variant="outlined" />
                  ) : user.subscriptionStatus === 'trialing' ? (
                    <Chip label="trial" size="small" color="info" variant="outlined" />
                  ) : user.subscriptionStatus === 'past_due' ? (
                    <Chip label="past_due" size="small" color="error" variant="outlined" />
                  ) : user.subscriptionStatus === 'canceled' ? (
                    <Chip label="canceled" size="small" variant="outlined" />
                  ) : (
                    <Typography variant="caption" color="text.disabled">
                      -
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
