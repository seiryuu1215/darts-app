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
  Collapse,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StarIcon from '@mui/icons-material/Star';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import BuildIcon from '@mui/icons-material/Build';
import BarChartIcon from '@mui/icons-material/BarChart';
import ForumIcon from '@mui/icons-material/Forum';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';
import { ColorModeContext } from '@/components/Providers';

interface DrawerGroup {
  label: string;
  icon: React.ReactNode;
  items: { label: string; href: string }[];
}

export default function Header() {
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [barrelMenuEl, setBarrelMenuEl] = useState<null | HTMLElement>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  const isAdmin = session?.user?.role === 'admin';
  const userIsPro = session?.user?.role === 'pro' || isAdmin;

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // グループ化されたドロワーメニュー
  const drawerGroups: DrawerGroup[] = session
    ? [
        {
          label: 'ダーツ',
          icon: <SportsBarIcon />,
          items: [
            { label: 'セッティング', href: '/darts' },
            { label: 'セッティング履歴', href: '/darts/history' },
            { label: 'バレル検索', href: '/barrels' },
            { label: 'おすすめバレル', href: '/barrels/recommend' },
          ],
        },
        {
          label: 'ツール',
          icon: <BuildIcon />,
          items: [
            { label: 'シミュレーター', href: '/barrels/simulator' },
            { label: '診断クイズ', href: '/barrels/quiz' },
            { label: 'セッティング比較', href: '/darts/compare' },
          ],
        },
        {
          label: 'スタッツ・記録',
          icon: <BarChartIcon />,
          items: [
            { label: 'スタッツ記録', href: '/stats' },
            { label: '目標', href: '/#goals' },
          ],
        },
        {
          label: 'コミュニティ',
          icon: <ForumIcon />,
          items: [
            { label: '記事', href: '/articles' },
            { label: 'ディスカッション', href: '/discussions' },
          ],
        },
        {
          label: 'マイページ',
          icon: <PersonIcon />,
          items: [
            { label: 'プロフィール', href: '/profile/edit' },
            { label: 'ブックマーク', href: '/bookmarks' },
            ...(userIsPro
              ? [{ label: 'サブスクリプション', href: '/profile/subscription' }]
              : [{ label: 'PROプラン', href: '/pricing' }]),
            ...(isAdmin
              ? [
                  { label: 'ユーザ管理', href: '/admin/users' },
                  { label: '料金設定', href: '/admin/pricing' },
                ]
              : []),
          ],
        },
      ]
    : [
        {
          label: 'ダーツ',
          icon: <SportsBarIcon />,
          items: [
            { label: 'セッティング', href: '/darts' },
            { label: 'バレル検索', href: '/barrels' },
            { label: 'おすすめバレル', href: '/barrels/recommend' },
          ],
        },
        {
          label: 'ツール',
          icon: <BuildIcon />,
          items: [
            { label: 'シミュレーター', href: '/barrels/simulator' },
            { label: '診断クイズ', href: '/barrels/quiz' },
          ],
        },
        {
          label: 'コミュニティ',
          icon: <ForumIcon />,
          items: [
            { label: '記事', href: '/articles' },
            { label: 'ディスカッション', href: '/discussions' },
          ],
        },
      ];

  return (
    <>
      <AppBar position="static" sx={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
            <Button
              color="inherit"
              size="small"
              endIcon={<ArrowDropDownIcon />}
              onClick={(e) => setBarrelMenuEl(e.currentTarget)}
            >
              バレル
            </Button>
            <Menu
              anchorEl={barrelMenuEl}
              open={Boolean(barrelMenuEl)}
              onClose={() => setBarrelMenuEl(null)}
              onClick={() => setBarrelMenuEl(null)}
            >
              <MenuItem component={Link} href="/barrels">
                バレル検索
              </MenuItem>
              <MenuItem component={Link} href="/barrels/recommend">
                おすすめ
              </MenuItem>
              <MenuItem component={Link} href="/barrels/simulator">
                シミュレーター
              </MenuItem>
              <MenuItem component={Link} href="/barrels/quiz">
                診断クイズ
              </MenuItem>
            </Menu>
            <Button color="inherit" component={Link} href="/articles" size="small">
              記事
            </Button>
            <Button color="inherit" component={Link} href="/discussions" size="small">
              ディスカッション
            </Button>
            {session && (
              <>
                <Button color="inherit" component={Link} href="/darts/compare" size="small">
                  比較
                </Button>
                <Button color="inherit" component={Link} href="/stats" size="small">
                  スタッツ
                </Button>
                {!userIsPro && (
                  <Button
                    component={Link}
                    href="/pricing"
                    size="small"
                    variant="outlined"
                    sx={{
                      color: '#ffc107',
                      borderColor: '#ffc107',
                      '&:hover': { borderColor: '#ffb300', bgcolor: '#ffc10711' },
                      ml: 0.5,
                    }}
                    startIcon={<StarIcon sx={{ fontSize: 16 }} />}
                  >
                    PRO
                  </Button>
                )}
              </>
            )}

            <IconButton
              color="inherit"
              onClick={colorMode.toggleColorMode}
              size="small"
              sx={{ ml: 0.5 }}
              aria-label="テーマ切替"
            >
              {theme.palette.mode === 'dark' ? (
                <Brightness7Icon fontSize="small" />
              ) : (
                <Brightness4Icon fontSize="small" />
              )}
            </IconButton>

            {session ? (
              <>
                <IconButton
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                  sx={{
                    p: 0.5,
                    ml: 0.5,
                    border: '2px solid rgba(255,255,255,0.5)',
                    '&:hover': { opacity: 0.8 },
                  }}
                  aria-label="ユーザーメニュー"
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
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    プロフィール
                  </MenuItem>
                  <MenuItem component={Link} href="/bookmarks">
                    <ListItemIcon>
                      <BookmarkIcon fontSize="small" />
                    </ListItemIcon>
                    ブックマーク
                  </MenuItem>
                  {userIsPro && (
                    <MenuItem component={Link} href="/profile/subscription">
                      <ListItemIcon>
                        <CreditCardIcon fontSize="small" />
                      </ListItemIcon>
                      サブスクリプション
                    </MenuItem>
                  )}
                  {isAdmin && (
                    <MenuItem component={Link} href="/admin/users">
                      <ListItemIcon>
                        <AdminPanelSettingsIcon fontSize="small" />
                      </ListItemIcon>
                      ユーザ管理
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={() => signOut()}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    ログアウト
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} href="/login" size="small">
                  ログイン
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  component={Link}
                  href="/register"
                  size="small"
                >
                  新規登録
                </Button>
              </>
            )}
          </Box>

          {/* モバイル表示 */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 0.5 }}>
            {session && (
              <Link href="/profile/edit" style={{ display: 'flex' }}>
                <Box
                  sx={{
                    p: 0.5,
                    border: '2px solid rgba(255,255,255,0.5)',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 },
                  }}
                >
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
              aria-label="メニューを開く"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* モバイルドロワー（グループ化） */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} role="navigation" aria-label="メインメニュー">
          {session && (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserAvatar
                userId={session.user.id}
                avatarUrl={null}
                userName={session.user.name || ''}
                size={36}
              />
              <Typography variant="body2">{session.user.name}</Typography>
            </Box>
          )}
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={colorMode.toggleColorMode}>
                <ListItemIcon>
                  {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </ListItemIcon>
                <ListItemText
                  primary={theme.palette.mode === 'dark' ? 'ライトモード' : 'ダークモード'}
                />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 0.5 }} />
            {drawerGroups.map((group) => (
              <Box key={group.label}>
                <ListItemButton onClick={() => toggleGroup(group.label)}>
                  <ListItemIcon>{group.icon}</ListItemIcon>
                  <ListItemText primary={group.label} />
                  {openGroups[group.label] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItemButton>
                <Collapse in={openGroups[group.label]} timeout="auto" unmountOnExit>
                  <List disablePadding>
                    {group.items.map((item) => (
                      <ListItem key={item.href} disablePadding>
                        <ListItemButton
                          component={Link}
                          href={item.href}
                          sx={{ pl: 6 }}
                          onClick={() => setDrawerOpen(false)}
                        >
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ))}
            {!session && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/login"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemText primary="ログイン" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href="/register"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <ListItemText primary="新規登録" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
            {session && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setDrawerOpen(false);
                      signOut();
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="ログアウト" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
