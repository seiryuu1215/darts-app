'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  Chip,
  Autocomplete,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MarkdownContent from '@/components/articles/MarkdownContent';
import type { Article, ArticleType } from '@/types';
import { canEditArticle, isAdmin } from '@/lib/permissions';

export default function EditArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const userRole = session?.user?.role;

  const [article, setArticle] = useState<Article | null>(null);
  const [articleId, setArticleId] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [articleType, setArticleType] = useState<ArticleType>('article');
  const [isFeatured, setIsFeatured] = useState(false);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewTab, setPreviewTab] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        // 管理者は下書きも取得できるよう isDraft フィルタなしで slug 検索
        const q = query(
          collection(db, 'articles'),
          where('slug', '==', slug)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const d = snapshot.docs[0];
          const data = { id: d.id, ...d.data() } as Article;
          setArticle(data);
          setArticleId(d.id);
          setTitle(data.title);
          setNewSlug(data.slug);
          setContent(data.content);
          setTags(data.tags || []);
          setArticleType(data.articleType || 'article');
          setIsFeatured(data.isFeatured || false);
          setExistingCoverUrl(data.coverImageUrl || null);
        }
      } catch (err) {
        console.error('記事取得エラー:', err);
      } finally {
        setFetchLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (status === 'loading' || fetchLoading) {
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
      </Container>
    );
  }

  if (!session?.user?.id || !canEditArticle(userRole, article.userId, session.user.id)) {
    router.replace('/articles');
    return null;
  }

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('画像は5MB以下にしてください');
      return;
    }
    setCoverImage(file);
    setExistingCoverUrl(null);
    setError('');
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!session?.user?.id) return;
    if (!title.trim() || !newSlug.trim()) {
      setError('タイトルとスラッグは必須です');
      return;
    }
    if (!isDraft && !content.trim()) {
      setError('公開するには本文が必要です');
      return;
    }

    setError('');
    setLoading(true);

    try {
      let coverImageUrl = existingCoverUrl;
      if (coverImage) {
        const storageRef = ref(storage, `images/articles/${articleId}/cover`);
        await uploadBytes(storageRef, coverImage);
        coverImageUrl = await getDownloadURL(storageRef);
      }

      await updateDoc(doc(db, 'articles', articleId), {
        slug: newSlug,
        title,
        content,
        coverImageUrl,
        tags,
        isDraft,
        isFeatured,
        articleType,
        updatedAt: serverTimestamp(),
      });

      if (articleType === 'page') {
        router.push(`/articles/${newSlug}/edit`);
      } else {
        router.push(isDraft ? '/articles' : `/articles/${newSlug}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('保存に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  };

  const coverPreviewUrl = coverImage
    ? URL.createObjectURL(coverImage)
    : existingCoverUrl;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {articleType === 'page' ? '固定ページ編集' : '記事編集'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        label="タイトル"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        required
        sx={{ mb: 2 }}
      />

      <TextField
        label="スラッグ（URL）"
        value={newSlug}
        onChange={(e) => setNewSlug(e.target.value)}
        fullWidth
        required
        helperText={articleType === 'page' ? `固定ページ: /${newSlug || '...'}` : `/articles/${newSlug || '...'}`}
        sx={{ mb: 2 }}
      />

      {articleType === 'article' && (
        <Autocomplete
          multiple
          freeSolo
          options={['ダーツ', '技術', 'メンタル', 'セッティング', '練習', '大会', '初心者']}
          value={tags}
          onChange={(_, v) => setTags(v)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
            ))
          }
          renderInput={(params) => <TextField {...params} label="タグ" placeholder="タグを追加" />}
          sx={{ mb: 2 }}
        />
      )}

      {isAdmin(userRole) && articleType === 'article' && (
        <FormControlLabel
          control={<Switch checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />}
          label="トップページにおすすめ表示"
          sx={{ mb: 2, display: 'block' }}
        />
      )}

      {articleType === 'article' && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            カバー画像
          </Typography>
          {coverPreviewUrl ? (
            <Box sx={{ position: 'relative', mb: 2, display: 'inline-block' }}>
              <img
                src={coverPreviewUrl}
                alt="カバー"
                style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  setCoverImage(null);
                  setExistingCoverUrl(null);
                }}
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              sx={{ mb: 2 }}
            >
              画像を選択
              <input type="file" hidden accept="image/*" onChange={handleCoverSelect} />
            </Button>
          )}
        </>
      )}

      <Box sx={{ mb: 2 }}>
        <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)}>
          <Tab label="編集" />
          <Tab label="プレビュー" />
        </Tabs>
      </Box>

      {previewTab === 0 ? (
        <TextField
          label="本文（マークダウン）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          multiline
          minRows={15}
          sx={{ mb: 3, '& .MuiInputBase-root': { fontFamily: 'monospace' } }}
        />
      ) : (
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 3,
            mb: 3,
            minHeight: 300,
          }}
        >
          {content ? (
            <MarkdownContent content={content} />
          ) : (
            <Typography color="text.secondary">プレビューする内容がありません</Typography>
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => handleSubmit(true)}
          disabled={loading}
          size="large"
        >
          {loading ? '保存中...' : '下書き保存'}
        </Button>
        <Button
          variant="contained"
          onClick={() => handleSubmit(false)}
          disabled={loading}
          size="large"
        >
          {loading ? '保存中...' : '公開'}
        </Button>
      </Box>
    </Container>
  );
}
