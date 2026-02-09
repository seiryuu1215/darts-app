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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import { ColorModeContext } from '@/components/Providers';

export default function Header() {
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const isAdmin = session?.user?.role === 'admin';

  const menuItems = session
    ? [
        { label: 'バレル検索', href: '/barrels' },
        { label: 'みんなのセッティング', href: '/darts' },
        { label: '記事', href: '/articles' },
        { label: 'セッティング比較', href: '/darts/compare' },
        { label: 'スタッツ記録', href: '/stats' },
        { label: 'ブックマーク', href: '/bookmarks' },
        { label: 'プロフィール', href: '/profile/edit' },
        ...(isAdmin ? [{ label: 'ユーザ管理', href: '/admin/users' }] : []),
      ]
    : [
        { label: 'バレル検索', href: '/barrels' },
        { label: 'みんなのセッティング', href: '/darts' },
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
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <IconButton color="inherit" onClick={colorMode.toggleColorMode} size="small">
              {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <Button color="inherit" component={Link} href="/barrels" startIcon={<SearchIcon />}>
              バレル検索
            </Button>
            <Button color="inherit" component={Link} href="/darts">
              みんなのセッティング
            </Button>
            <Button color="inherit" component={Link} href="/articles">
              記事
            </Button>
            {session ? (
              <>
                <Button color="inherit" component={Link} href="/darts/compare">
                  セッティング比較
                </Button>
                <Button color="inherit" component={Link} href="/stats">
                  スタッツ記録
                </Button>
                <Button color="inherit" component={Link} href="/bookmarks">
                  ブックマーク
                </Button>
                {isAdmin && (
                  <Button color="inherit" component={Link} href="/admin/users">
                    ユーザ管理
                  </Button>
                )}
                <Link href="/profile/edit" style={{ display: 'flex' }}>
                  <Box sx={{ p: 0.5, border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%', ml: 0.5, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                    <UserAvatar
                      userId={session.user.id}
                      avatarUrl={null}
                      userName={session.user.name || ''}
                      size={32}
                    />
                  </Box>
                </Link>
                <Button color="inherit" onClick={() => signOut()}>
                  ログアウト
                </Button>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} href="/login">
                  ログイン
                </Button>
                <Button color="inherit" component={Link} href="/register">
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
            {menuItems.map((item) => (
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
