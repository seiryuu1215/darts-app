'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Typography,
  Box,
  CircularProgress,
  Chip,
  Button,
  CardMedia,
  Container,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MarkdownContent from '@/components/articles/MarkdownContent';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import AffiliateBanner from '@/components/affiliate/AffiliateBanner';
import type { Article } from '@/types';

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const q = query(
          collection(db, 'articles'),
          where('slug', '==', slug),
          where('isDraft', '==', false)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setArticle({ id: doc.id, ...doc.data() } as Article);
        }
      } catch (err) {
        console.error('記事取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!article) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" textAlign="center" color="text.secondary">
          記事が見つかりませんでした
        </Typography>
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button component={Link} href="/articles" startIcon={<ArrowBackIcon />}>
            記事一覧へ戻る
          </Button>
        </Box>
      </Container>
    );
  }

  const dateStr = article.createdAt?.toDate
    ? article.createdAt.toDate().toLocaleDateString('ja-JP')
    : '';

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Breadcrumbs
        items={[
          { label: '記事', href: '/articles' },
          { label: article.title },
        ]}
      />

      <Button component={Link} href="/articles" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        記事一覧
      </Button>

      {article.coverImageUrl && (
        <CardMedia
          component="img"
          image={article.coverImageUrl}
          alt={article.title}
          sx={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 2, mb: 3 }}
        />
      )}

      <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
        {article.title}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
        {article.tags.map((tag) => (
          <Chip key={tag} label={tag} size="small" variant="outlined" />
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {dateStr}
          {article.userName && ` ・ ${article.userName}`}
        </Typography>
        {isAdmin && (
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

      <Box sx={{ mt: 4 }}>
        <AffiliateBanner />
      </Box>
    </Container>
  );
}
