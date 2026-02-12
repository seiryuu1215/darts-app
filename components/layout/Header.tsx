'use client';

import { useState, useContext } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import { ColorModeContext } from '@/components/Providers';

export default function Header() {
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const isAdmin = session?.user?.role === 'admin';

  // モバイルドロワー用メニュー（よく使う順）
  const drawerItems = session
    ? [
        { label: 'セッティング', href: '/darts' },
        { label: 'セッティング履歴', href: '/darts/history' },
        { label: 'バレル検索', href: '/barrels' },
        { label: 'スタッツ記録', href: '/stats' },
        { label: '記事', href: '/articles' },
        { label: 'セッティング比較', href: '/darts/compare' },
        { label: 'ブックマーク', href: '/bookmarks' },
        { label: 'プロフィール', href: '/profile/edit' },
        ...(isAdmin ? [{ label: 'ユーザ管理', href: '/admin/users' }] : []),
      ]
    : [
        { label: 'セッティング', href: '/darts' },
        { label: 'バレル検索', href: '/barrels' },
        { label: '記事', href: '/articles' },
        { label: 'ログイン', href: '/login' },
        { label: '新規登録', href: '/register' },
      ];

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            href="/"
            sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}
          >
            Darts Lab
          </Typography>

          {/* PC表示 */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5, alignItems: 'center' }}>
            <Button color="inherit" component={Link} href="/darts" size="small">
              セッティング
            </Button>
            <Button color="inherit" component={Link} href="/barrels" size="small">
              バレル検索
            </Button>
            <Button color="inherit" component={Link} href="/articles" size="small">
              記事
            </Button>
            {session && (
              <>
                <Button color="inherit" component={Link} href="/darts/compare" size="small">
                  比較
                </Button>
                <Button color="inherit" component={Link} href="/stats" size="small">
                  スタッツ
                </Button>
              </>
            )}

            <IconButton color="inherit" onClick={colorMode.toggleColorMode} size="small" sx={{ ml: 0.5 }}>
              {theme.palette.mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>

            {session ? (
              <>
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{ p: 0.5, ml: 0.5, border: '2px solid rgba(255,255,255,0.5)', '&:hover': { opacity: 0.8 } }}
                >
                  <UserAvatar
                    userId={session.user.id}
                    avatarUrl={null}
                    userName={session.user.name || ''}
                    size={30}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  onClick={() => setAnchorEl(null)}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem component={Link} href="/profile/edit">
                    <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                    プロフィール
                  </MenuItem>
                  <MenuItem component={Link} href="/bookmarks">
                    <ListItemIcon><BookmarkIcon fontSize="small" /></ListItemIcon>
                    ブックマーク
                  </MenuItem>
                  {isAdmin && (
                    <MenuItem component={Link} href="/admin/users">
                      <ListItemIcon><AdminPanelSettingsIcon fontSize="small" /></ListItemIcon>
                      ユーザ管理
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={() => signOut()}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    ログアウト
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} href="/login" size="small">
                  ログイン
                </Button>
                <Button variant="outlined" color="inherit" component={Link} href="/register" size="small">
                  新規登録
                </Button>
              </>
            )}
          </Box>

          {/* モバイル表示 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5 }}>
            {session && (
              <Link href="/profile/edit" style={{ display: 'flex' }}>
                <Box sx={{ p: 0.5, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                  <UserAvatar
                    userId={session.user.id}
                    avatarUrl={null}
                    userName={session.user.name || ''}
                    size={28}
                  />
                </Box>
              </Link>
            )}
            <IconButton
              color="inherit"
              edge="end"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* モバイルドロワー */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }}>
          {session && (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserAvatar userId={session.user.id} avatarUrl={null} userName={session.user.name || ''} size={36} />
              <Typography variant="body2">{session.user.name}</Typography>
            </Box>
          )}
          <Divider />
          <List onClick={() => setDrawerOpen(false)}>
            <ListItem disablePadding>
              <ListItemButton onClick={colorMode.toggleColorMode}>
                <ListItemIcon>
                  {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </ListItemIcon>
                <ListItemText primary={theme.palette.mode === 'dark' ? 'ライトモード' : 'ダークモード'} />
              </ListItemButton>
            </ListItem>
            {drawerItems.map((item) => (
              <ListItem key={item.href} disablePadding>
                <ListItemButton component={Link} href={item.href}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
            {session && (
              <ListItem disablePadding>
                <ListItemButton onClick={() => signOut()}>
                  <ListItemText primary="ログアウト" />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
