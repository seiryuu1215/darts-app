'use client';

import { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArticleIcon from '@mui/icons-material/Article';
import ForumIcon from '@mui/icons-material/Forum';
import StorefrontIcon from '@mui/icons-material/Storefront';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NextLink from 'next/link';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toDartshiveAffiliateUrl, getAffiliateConfig, toRakutenSearchUrl } from '@/lib/affiliate';
import type { BarrelProduct, Article, Discussion } from '@/types';
import AffiliateButton from '@/components/affiliate/AffiliateButton';

interface SidebarProps {
  showPopularBarrels?: boolean;
  showRecentArticles?: boolean;
  showRecentDiscussions?: boolean;
  showShopBanners?: boolean;
  relatedBarrels?: BarrelProduct[];
}

interface RankedBarrel {
  rank: number;
  name: string;
  imageUrl: string | null;
  productUrl: string;
}

export default function Sidebar({
  showPopularBarrels = true,
  showRecentArticles = true,
  showRecentDiscussions = true,
  showShopBanners = true,
  relatedBarrels,
}: SidebarProps) {
  const [popularBarrels, setPopularBarrels] = useState<RankedBarrel[]>([]);
  const [articles, setArticles] = useState<(Article & { id: string })[]>([]);
  const [discussions, setDiscussions] = useState<(Discussion & { id: string })[]>([]);
  const affConfig = getAffiliateConfig();

  useEffect(() => {
    if (showPopularBarrels) {
      getDocs(query(collection(db, 'barrelRanking'), orderBy('rank', 'asc'), limit(5)))
        .then((snap) => {
          setPopularBarrels(snap.docs.map((d) => d.data() as RankedBarrel));
        })
        .catch(() => {});
    }
    if (showRecentArticles) {
      getDocs(
        query(
          collection(db, 'articles'),
          where('isDraft', '==', false),
          orderBy('createdAt', 'desc'),
          limit(5),
        ),
      )
        .then((snap) => {
          setArticles(
            snap.docs
              .map((d) => ({ id: d.id, ...d.data() }) as Article & { id: string })
              .filter((a) => a.articleType !== 'page'),
          );
        })
        .catch(() => {});
    }
    if (showRecentDiscussions) {
      getDocs(query(collection(db, 'discussions'), orderBy('lastRepliedAt', 'desc'), limit(5)))
        .then((snap) => {
          setDiscussions(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Discussion & { id: string }),
          );
        })
        .catch(() => {});
    }
  }, [showPopularBarrels, showRecentArticles, showRecentDiscussions]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 関連バレル */}
      {relatedBarrels && relatedBarrels.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <StorefrontIcon fontSize="small" color="primary" />
            関連バレル
          </Typography>
          <List dense disablePadding>
            {relatedBarrels.slice(0, 5).map((b) => (
              <Box key={b.id} sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight="bold" noWrap>
                  {b.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {b.brand} / {b.weight}g
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <AffiliateButton barrel={b} size="small" />
                </Box>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      {/* 人気バレルTOP5 */}
      {showPopularBarrels && popularBarrels.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <TrendingUpIcon fontSize="small" color="primary" />
            人気バレル TOP5
          </Typography>
          <List dense disablePadding>
            {popularBarrels.map((item) => (
              <ListItemButton
                key={item.rank}
                component="a"
                href={toDartshiveAffiliateUrl(item.productUrl, affConfig)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ px: 1, borderRadius: 1 }}
              >
                <Chip
                  label={item.rank}
                  size="small"
                  color={item.rank <= 3 ? 'primary' : 'default'}
                  sx={{ mr: 1, minWidth: 28, fontWeight: 'bold' }}
                />
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {/* 新着記事 */}
      {showRecentArticles && articles.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ArticleIcon fontSize="small" color="primary" />
            新着記事
          </Typography>
          <List dense disablePadding>
            {articles.map((article) => (
              <ListItemButton
                key={article.id}
                component={NextLink}
                href={`/articles/${article.slug}`}
                sx={{ px: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary={article.title}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {/* 最近のディスカッション */}
      {showRecentDiscussions && discussions.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ForumIcon fontSize="small" color="primary" />
            最近のディスカッション
          </Typography>
          <List dense disablePadding>
            {discussions.map((d) => (
              <ListItemButton
                key={d.id}
                component={NextLink}
                href={`/discussions/${d.id}`}
                sx={{ px: 1, borderRadius: 1 }}
              >
                <ListItemText
                  primary={d.title}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                />
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}

      {/* ショップバナー */}
      {showShopBanners && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <Typography variant="subtitle2" fontWeight="bold">
              ダーツショップ
            </Typography>
            <Chip label="PR" size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
          </Box>
          <Divider sx={{ mb: 1.5 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <MuiLink
              href={toDartshiveAffiliateUrl('https://www.dartshive.jp/', affConfig)}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.primary' }}
            >
              <Typography variant="body2">ダーツハイブ</Typography>
              <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            </MuiLink>
            <MuiLink
              href="https://www.s-darts.com/"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.primary' }}
            >
              <Typography variant="body2">S-DARTS（エスダーツ）</Typography>
              <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            </MuiLink>
            <MuiLink
              href={toRakutenSearchUrl('ダーツ バレル', affConfig)}
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.primary' }}
            >
              <Typography variant="body2">楽天市場 ダーツ</Typography>
              <OpenInNewIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
            </MuiLink>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
