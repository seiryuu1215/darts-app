'use client';

import { useEffect, useState } from 'react';
import { Container, Typography, Box, CircularProgress, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MarkdownContent from '@/components/articles/MarkdownContent';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { isAdmin } from '@/lib/permissions';
import type { Article } from '@/types';

export default function AboutPage() {
  const { data: session } = useSession();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const q = query(
          collection(db, 'articles'),
          where('slug', '==', 'about'),
          where('articleType', '==', 'page')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setArticle({ id: doc.id, ...doc.data() } as Article);
        }
      } catch (err) {
        console.error('About page fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // page-type記事が未作成の場合のフォールバック
  if (!article) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Breadcrumbs items={[{ label: 'About' }]} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Darts Lab について
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          ダーツプレイヤーのためのセッティング管理・スタッツ記録・バレル探索アプリです。
        </Typography>
        <Typography variant="body2" color="text.secondary">
          お問い合わせは X（Twitter）@seiryuu_darts までお気軽にどうぞ。
        </Typography>
        {isAdmin(session?.user?.role) && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              size="small"
              component={Link}
              href="/articles/new?type=page&slug=about"
              startIcon={<EditIcon />}
            >
              Aboutページを作成
            </Button>
          </Box>
        )}
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: 'About' }]} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          {article.title}
        </Typography>
        {isAdmin(session?.user?.role) && (
          <Button
            size="small"
            startIcon={<EditIcon />}
            component={Link}
            href={`/articles/${article.slug}/edit`}
          >
            編集
          </Button>
        )}
      </Box>
      <MarkdownContent content={article.content} />
    </Container>
  );
}
