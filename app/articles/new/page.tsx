'use client';

import { useState } from 'react';
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
  FormControlLabel,
  Switch,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import MarkdownContent from '@/components/articles/MarkdownContent';

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'admin';

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [previewTab, setPreviewTab] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'loading') return null;
  if (!isAdmin) {
    router.replace('/articles');
    return null;
  }

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManual) {
      setSlug(toSlug(value));
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('画像は5MB以下にしてください');
      return;
    }
    setCoverImage(file);
    setError('');
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!session?.user?.id) return;
    if (!title.trim() || !slug.trim()) {
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
      const articleId = doc(collection(db, 'articles')).id;

      let coverImageUrl: string | null = null;
      if (coverImage) {
        const storageRef = ref(storage, `images/articles/${articleId}/cover`);
        await uploadBytes(storageRef, coverImage);
        coverImageUrl = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'articles', articleId), {
        slug,
        title,
        content,
        coverImageUrl,
        tags,
        isDraft,
        isFeatured,
        userId: session.user.id,
        userName: session.user.name || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push(isDraft ? '/articles' : `/articles/${slug}`);
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        新規記事
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TextField
        label="タイトル"
        value={title}
        onChange={(e) => handleTitleChange(e.target.value)}
        fullWidth
        required
        sx={{ mb: 2 }}
      />

      <TextField
        label="スラッグ（URL）"
        value={slug}
        onChange={(e) => {
          setSlug(e.target.value);
          setSlugManual(true);
        }}
        fullWidth
        required
        helperText={`/articles/${slug || '...'}`}
        sx={{ mb: 2 }}
      />

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

      <FormControlLabel
        control={<Switch checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />}
        label="トップページにおすすめ表示"
        sx={{ mb: 2, display: 'block' }}
      />

      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        カバー画像
      </Typography>
      {coverImage ? (
        <Box sx={{ position: 'relative', mb: 2, display: 'inline-block' }}>
          <img
            src={URL.createObjectURL(coverImage)}
            alt="カバー"
            style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
          />
          <IconButton
            size="small"
            onClick={() => setCoverImage(null)}
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
