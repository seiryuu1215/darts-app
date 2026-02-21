'use client';

import { useState, useRef } from 'react';
import { Paper, Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ImportResult {
  imported: number;
  errors: string[];
}

export default function N01ImportCard() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック
    if (file.size > 1_000_000) {
      setError('ファイルサイズが大きすぎます（1MB上限）');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const csvText = await file.text();
      const res = await fetch('/api/n01-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'インポートに失敗しました');
        if (json.errors?.length) {
          setError(`${json.error}\n${json.errors.join('\n')}`);
        }
        return;
      }

      setResult({
        imported: json.imported,
        errors: json.errors ?? [],
      });
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Box>
          <Typography variant="subtitle2">n01 データ取り込み</Typography>
          <Typography variant="caption" color="text.secondary">
            n01のCSVエクスポートファイルをインポート
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
          disabled={loading}
          onClick={() => fileRef.current?.click()}
        >
          {loading ? '処理中...' : 'CSVを選択'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.tsv"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 1 }}>
          {result.imported}セッションをインポートしました (+5 XP)
          {result.errors.length > 0 && (
            <Typography variant="caption" component="p" sx={{ mt: 0.5 }}>
              {result.errors.length}件のエラーをスキップしました
            </Typography>
          )}
        </Alert>
      )}
    </Paper>
  );
}
