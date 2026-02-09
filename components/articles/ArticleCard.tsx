'use client';

import { Card, CardContent, CardMedia, Typography, Box, Chip } from '@mui/material';
import Link from 'next/link';
import type { Article } from '@/types';

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  const dateStr = article.createdAt?.toDate
    ? article.createdAt.toDate().toLocaleDateString('ja-JP')
    : '';

  return (
    <Card
      component={Link}
      href={`/articles/${article.slug}`}
      sx={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {article.coverImageUrl ? (
        <CardMedia
          component="img"
          height="160"
          image={article.coverImageUrl}
          alt={article.title}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box
          sx={{
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="h3" color="text.disabled">
            📝
          </Typography>
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom noWrap>
          {article.title}
        </Typography>
        {article.tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
            {article.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        )}
        <Typography variant="caption" color="text.secondary">
          {dateStr}
          {article.userName && ` ・ ${article.userName}`}
        </Typography>
      </CardContent>
    </Card>
  );
}
