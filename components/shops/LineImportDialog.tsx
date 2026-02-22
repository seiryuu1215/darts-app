'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Chip,
} from '@mui/material';
import TrainIcon from '@mui/icons-material/Train';
import { LINE_CATEGORIES, LINE_COLORS } from '@/lib/line-stations';
import type { ImportResult } from '@/lib/shop-import';

interface LineImportDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  favoriteLines?: string[];
  onSaveFavoriteLines?: (lines: string[]) => void;
}

export default function LineImportDialog({
  open,
  onClose,
  onComplete,
  favoriteLines,
  onSaveFavoriteLines,
}: LineImportDialogProps) {
  const [selectedLines, setSelectedLines] = useState<Set<string>>(new Set());
  const [saveFavorites, setSaveFavorites] = useState(false);
  const [importing, setImporting] = useState(false);
  const [currentLine, setCurrentLine] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [done, setDone] = useState(false);

  const handleOpen = () => {
    if (favoriteLines && favoriteLines.length > 0) {
      setSelectedLines(new Set(favoriteLines));
      setSaveFavorites(true);
    } else {
      setSelectedLines(new Set());
      setSaveFavorites(false);
    }
    setImporting(false);
    setCurrentLine(null);
    setProgress(0);
    setResults([]);
    setDone(false);
  };

  const toggleLine = (line: string) => {
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(line)) {
        next.delete(line);
      } else {
        next.add(line);
      }
      return next;
    });
  };

  const toggleCategory = (category: string) => {
    const lines = LINE_CATEGORIES[category] ?? [];
    const allSelected = lines.every((l) => selectedLines.has(l));
    setSelectedLines((prev) => {
      const next = new Set(prev);
      for (const l of lines) {
        if (allSelected) {
          next.delete(l);
        } else {
          next.add(l);
        }
      }
      return next;
    });
  };

  const handleImport = async () => {
    const lines = [...selectedLines];
    if (lines.length === 0) return;

    if (saveFavorites && onSaveFavoriteLines) {
      onSaveFavoriteLines(lines);
    }

    setImporting(true);
    setTotalLines(lines.length);
    setProgress(0);
    setResults([]);
    setDone(false);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      setCurrentLine(line);
      setProgress(i);

      try {
        const res = await fetch('/api/shops/import-by-line', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineName: line }),
        });
        if (res.ok) {
          const result: ImportResult = await res.json();
          setResults((prev) => [...prev, result]);
        } else {
          const err = await res.json().catch(() => ({ error: '不明なエラー' }));
          setResults((prev) => [
            ...prev,
            {
              lineName: line,
              stationsSearched: 0,
              shopsFound: 0,
              shopsSaved: 0,
              shopsSkipped: 0,
              errors: 1,
            },
          ]);
          if (res.status === 403) {
            // 権限エラーの場合は中断
            break;
          }
          console.error(`インポートエラー (${line}):`, err);
        }
      } catch {
        setResults((prev) => [
          ...prev,
          {
            lineName: line,
            stationsSearched: 0,
            shopsFound: 0,
            shopsSaved: 0,
            shopsSkipped: 0,
            errors: 1,
          },
        ]);
      }
    }

    setProgress(lines.length);
    setCurrentLine(null);
    setDone(true);
    onComplete();
  };

  const handleClose = () => {
    if (importing && !done) return;
    onClose();
  };

  const totalSaved = results.reduce((sum, r) => sum + r.shopsSaved, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionProps={{ onEnter: handleOpen }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrainIcon />
          路線からショップを取り込む
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {!importing ? (
          <>
            {Object.entries(LINE_CATEGORIES).map(([category, lines]) => {
              const allSelected = lines.every((l) => selectedLines.has(l));
              const someSelected = lines.some((l) => selectedLines.has(l));
              return (
                <Box key={category} sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected && !allSelected}
                        onChange={() => toggleCategory(category)}
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {category}
                      </Typography>
                    }
                  />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 3 }}>
                    {lines.map((line) => (
                      <Chip
                        key={line}
                        label={line}
                        size="small"
                        variant={selectedLines.has(line) ? 'filled' : 'outlined'}
                        onClick={() => toggleLine(line)}
                        sx={{
                          height: 28,
                          fontSize: '0.75rem',
                          ...(selectedLines.has(line) && {
                            bgcolor: LINE_COLORS[line] ?? 'primary.main',
                            color: '#fff',
                          }),
                          ...(!selectedLines.has(line) && {
                            borderColor: LINE_COLORS[line] ?? 'divider',
                          }),
                        }}
                        icon={
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: LINE_COLORS[line] ?? 'text.secondary',
                              ml: 0.5,
                            }}
                          />
                        }
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}

            <FormControlLabel
              control={
                <Checkbox
                  checked={saveFavorites}
                  onChange={(e) => setSaveFavorites(e.target.checked)}
                  size="small"
                />
              }
              label="お気に入り路線として保存"
              sx={{ mt: 1 }}
            />
          </>
        ) : (
          <Box>
            {currentLine && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                処理中: <strong>{currentLine}</strong>
              </Typography>
            )}
            <LinearProgress
              variant="determinate"
              value={totalLines > 0 ? (progress / totalLines) * 100 : 0}
              sx={{ mb: 2, height: 8, borderRadius: 1 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {progress} / {totalLines} 路線完了
            </Typography>

            {results.map((r) => (
              <Box
                key={r.lineName}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 0.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2">{r.lineName}</Typography>
                <Typography variant="body2" color={r.errors > 0 ? 'error' : 'text.secondary'}>
                  {r.shopsSaved}件保存 / {r.shopsFound}件発見
                  {r.errors > 0 && ` (${r.errors}エラー)`}
                </Typography>
              </Box>
            ))}

            {done && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  完了: {totalSaved}件保存
                  {totalErrors > 0 && ` / ${totalErrors}件エラー`}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!importing ? (
          <>
            <Button onClick={onClose}>キャンセル</Button>
            <Button
              onClick={handleImport}
              variant="contained"
              disabled={selectedLines.size === 0}
              startIcon={<TrainIcon />}
            >
              取り込み開始（{selectedLines.size}路線）
            </Button>
          </>
        ) : (
          <Button onClick={handleClose} disabled={!done} variant="contained">
            閉じる
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
