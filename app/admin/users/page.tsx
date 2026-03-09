'use client';

import { useEffect, useState, useMemo } from 'react';
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
  TextField,
  InputAdornment,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSession } from 'next-auth/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useDemoGuard } from '@/hooks/useDemoGuard';
import { UserRole } from '@/types';

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  subscriptionStatus: string | null;
  subscriptionId: string | null;
}

const ITEMS_PER_PAGE = 20;

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDemo, guardedAction } = useDemoGuard();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [page, setPage] = useState(1);

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

  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter !== 'all') {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [users, roleFilter, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter]);

  const handleRoleChange = (userId: string, newRole: UserRole) =>
    guardedAction(async () => {
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
    });

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

      {isDemo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          デモアカウントではユーザー管理操作はできません
        </Alert>
      )}
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

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          placeholder="名前・メール・IDで検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <Select
          value={roleFilter}
          size="small"
          onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">全ロール</MenuItem>
          <MenuItem value="admin">admin</MenuItem>
          <MenuItem value="pro">pro</MenuItem>
          <MenuItem value="general">general</MenuItem>
        </Select>
        <Typography variant="caption" color="text.secondary">
          {filteredUsers.length}件
          {filteredUsers.length !== users.length && ` / 全${users.length}件`}
        </Typography>
      </Box>

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
            {paginatedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    size="small"
                    disabled={isDemo}
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

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
        </Box>
      )}
    </Box>
  );
}
