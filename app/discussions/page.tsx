'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import CategoryTabs from '@/components/discussions/CategoryTabs';
import DiscussionCard from '@/components/discussions/DiscussionCard';
import { canCreateDiscussion } from '@/lib/permissions';
import type { Discussion, DiscussionCategory } from '@/types';

const PAGE_SIZE = 20;

export default function DiscussionsPage() {
  const { data: session } = useSession();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [category, setCategory] = useState<DiscussionCategory | 'all'>('all');
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const canCreate = canCreateDiscussion(session?.user?.role);

  const fetchDiscussions = useCallback(
    async (cat: DiscussionCategory | 'all', afterDoc?: QueryDocumentSnapshot | null) => {
      const constraints = [];
      if (cat !== 'all') {
        constraints.push(where('category', '==', cat));
      }
      constraints.push(orderBy('isPinned', 'desc'));
      constraints.push(orderBy('lastRepliedAt', 'desc'));
      constraints.push(limit(PAGE_SIZE + 1));
      if (afterDoc) {
        constraints.push(startAfter(afterDoc));
      }

      const q = query(collection(db, 'discussions'), ...constraints);
      const snap = await getDocs(q);
      const docs = snap.docs.slice(0, PAGE_SIZE);
      const items = docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Discussion,
      );

      return {
        items,
        lastDoc: docs[docs.length - 1] || null,
        hasMore: snap.docs.length > PAGE_SIZE,
      };
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDiscussions(category).then((result) => {
      if (cancelled) return;
      setDiscussions(result.items);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [category, fetchDiscussions]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const result = await fetchDiscussions(category, lastDoc);
      setDiscussions((prev) => [...prev, ...result.items]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCategoryChange = (cat: DiscussionCategory | 'all') => {
    setCategory(cat);
    setLastDoc(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: 'ディスカッション' }]} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">ディスカッション</Typography>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/discussions/new"
          >
            新規スレッド
          </Button>
        )}
      </Box>

      <CategoryTabs value={category} onChange={handleCategoryChange} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : discussions.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 8 }}>
          まだスレッドがありません
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {discussions.map((d) => (
            <DiscussionCard key={d.id} discussion={d} />
          ))}
          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button onClick={handleLoadMore} disabled={loadingMore} variant="outlined">
                {loadingMore ? '読み込み中...' : 'もっと見る'}
              </Button>
            </Box>
          )}
        </Box>
      )}
    </Container>
  );
}
