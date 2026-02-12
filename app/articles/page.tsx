'use client';

import { useEffect, useState } from 'react';
import { Container, Typography, Grid, Box, CircularProgress, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ArticleCard from '@/components/articles/ArticleCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Article } from '@/types';
import { canWriteArticles } from '@/lib/permissions';

export default function ArticlesPage() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const canWrite = canWriteArticles(session?.user?.role);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const q = query(collection(db, 'articles'), where('isDraft', '==', false));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as Article)
          .filter((a) => a.articleType !== 'page')
          .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
          });
        setArticles(docs);
      } catch (err) {
        console.error('記事取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: '記事' }]} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">記事</Typography>
        {canWrite && (
          <Button variant="contained" startIcon={<AddIcon />} component={Link} href="/articles/new">
            新規記事
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : articles.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
          まだ記事がありません
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {articles.map((article) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={article.id}>
              <ArticleCard article={article} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
