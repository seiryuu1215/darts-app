import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Chip,
  Alert,
} from '@mui/material';

interface UserRow {
  id: string;
  displayName: string;
  email: string;
  role: 'admin' | 'pro' | 'general';
  subscriptionStatus: string | null;
  subscriptionId: string | null;
}

const MOCK_ADMIN_USERS: UserRow[] = [
  {
    id: 'admin_001',
    displayName: '管理者',
    email: 'admin@example.com',
    role: 'admin',
    subscriptionStatus: 'active',
    subscriptionId: null,
  },
  {
    id: 'user_002',
    displayName: 'PROプレイヤー',
    email: 'pro@example.com',
    role: 'pro',
    subscriptionStatus: 'active',
    subscriptionId: 'sub_123',
  },
  {
    id: 'user_003',
    displayName: 'トライアルユーザー',
    email: 'trial@example.com',
    role: 'pro',
    subscriptionStatus: 'trialing',
    subscriptionId: 'sub_456',
  },
  {
    id: 'user_001',
    displayName: 'ダーツ太郎',
    email: 'taro@example.com',
    role: 'general',
    subscriptionStatus: null,
    subscriptionId: null,
  },
  {
    id: 'user_004',
    displayName: '解約済みユーザー',
    email: 'canceled@example.com',
    role: 'general',
    subscriptionStatus: 'canceled',
    subscriptionId: 'sub_789',
  },
];

interface AdminUsersPageStoryProps {
  isAdmin: boolean;
}

function AdminUsersPageStory({ isAdmin }: AdminUsersPageStoryProps) {
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">管理者権限が必要です</Alert>
      </Box>
    );
  }

  const statusChip = (status: string | null, subId: string | null) => {
    if (!status && !subId) {
      return <Chip label="Free" size="small" variant="outlined" />;
    }
    if (status === 'active' && !subId) {
      return <Chip label="手動PRO" size="small" color="warning" />;
    }
    const colors: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
      active: 'success',
      trialing: 'info',
      canceled: 'warning',
      past_due: 'error',
    };
    return <Chip label={status ?? 'Free'} size="small" color={colors[status ?? ''] ?? 'default'} />;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
        ユーザ管理
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>表示名</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>メール</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>ロール</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>ステータス</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {MOCK_ADMIN_USERS.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Select value={user.role} size="small" sx={{ minWidth: 100 }}>
                    <MenuItem value="admin">admin</MenuItem>
                    <MenuItem value="pro">pro</MenuItem>
                    <MenuItem value="general">general</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>{statusChip(user.subscriptionStatus, user.subscriptionId)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

const meta = {
  title: 'Pages/Admin/AdminUsersPage',
  component: AdminUsersPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof AdminUsersPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  args: { isAdmin: true },
};

export const NotAdmin: Story = {
  args: { isAdmin: false },
};
