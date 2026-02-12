'use client';

import { Suspense, useEffect, useState, useMemo, Fragment } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import type { Dart } from '@/types';
import { calcDartTotals, hasCompleteSpecs } from '@/lib/calc-totals';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { getDiffColors } from '@/lib/comparison';

function CompareContent() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const [darts, setDarts] = useState<Dart[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const leftParam = searchParams.get('left');
  const rightParam = searchParams.get('right');

  // Firestore からユーザのダーツを取得
  useEffect(() => {
    if (!session?.user?.id) {
      if (sessionStatus !== 'loading') setLoading(false);
      return;
    }
    const fetchDarts = async () => {
      try {
        const q = query(collection(db, 'darts'), where('userId', '==', session.user.id));
        const snapshot = await getDocs(q);
        const all = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Dart[];
        setDarts(all);
      } catch (err) {
        console.error('ダーツ取得エラー:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDarts();
  }, [session, sessionStatus]);

  // スペック完全なダーツのみ
  const completeDarts = useMemo(
    () =>
      darts.filter(hasCompleteSpecs).sort((a, b) => {
        if (a.createdAt && b.createdAt) return b.createdAt.seconds - a.createdAt.seconds;
        return 0;
      }),
    [darts],
  );

  // クエリパラメータから事前選択（初回のみ）
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (initialized || completeDarts.length === 0) return;
    if (leftParam && rightParam) {
      const hasLeft = completeDarts.some((d) => d.id === leftParam);
      const hasRight = completeDarts.some((d) => d.id === rightParam);
      if (hasLeft && hasRight) {
        setSelectedIds([leftParam, rightParam]);
      }
    } else if (leftParam) {
      const hasLeft = completeDarts.some((d) => d.id === leftParam);
      if (hasLeft) {
        setSelectedIds([leftParam]);
      }
    }
    setInitialized(true);
  }, [initialized, completeDarts, leftParam, rightParam]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const isComparing = selectedIds.length === 2;
  const dartA = completeDarts.find((d) => d.id === selectedIds[0]);
  const dartB = completeDarts.find((d) => d.id === selectedIds[1]);

  if (loading || sessionStatus === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography textAlign="center" color="text.secondary">
          ログインが必要です
        </Typography>
      </Container>
    );
  }

  if (completeDarts.length < 2) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          セッティング比較
        </Typography>
        <Typography color="text.secondary">
          スペックが完全なセッティングが2つ以上必要です
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          登録済み: {darts.length}件 / うちスペック完全: {completeDarts.length}件
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          チップ・シャフト・フライトの長さ・重量がすべて入力されているセッティングのみが比較対象です。
          セッティング編集から各パーツのスペックを入力してください。
        </Typography>
      </Container>
    );
  }

  // 比較テーブル表示
  if (isComparing && dartA && dartB) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Breadcrumbs items={[{ label: 'セッティング', href: '/darts' }, { label: '比較' }]} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedIds([])}>
            選び直す
          </Button>
          <Typography variant="h5">セッティング比較</Typography>
        </Box>
        <ComparisonTable dartA={dartA} dartB={dartB} />
      </Container>
    );
  }

  // 選択フェーズ
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs items={[{ label: 'セッティング', href: '/darts' }, { label: '比較' }]} />
      <Typography variant="h5" gutterBottom>
        セッティング比較
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        比較するセッティングを2つ選んでください（{selectedIds.length}/2）
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
        }}
      >
        {completeDarts.map((dart) => {
          const isSelected = selectedIds.includes(dart.id!);
          return (
            <Card
              key={dart.id}
              onClick={() => toggleSelect(dart.id!)}
              sx={{
                cursor: 'pointer',
                border: isSelected ? '2px solid' : '2px solid transparent',
                borderColor: isSelected ? 'primary.main' : 'transparent',
                position: 'relative',
                '&:hover': { boxShadow: 4 },
              }}
            >
              {isSelected && (
                <CheckCircleIcon
                  color="primary"
                  sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                />
              )}
              {dart.imageUrls.length > 0 ? (
                <CardMedia
                  component="img"
                  height="140"
                  image={dart.imageUrls[0]}
                  alt={dart.title}
                  sx={{ objectFit: 'cover' }}
                />
              ) : (
                <Box
                  component="img"
                  src="/dart-placeholder.svg"
                  alt="No Image"
                  sx={{ height: 140, width: '100%', objectFit: 'cover' }}
                />
              )}
              <CardContent>
                <Typography variant="subtitle1" noWrap>
                  {dart.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {dart.barrel.brand} {dart.barrel.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dart.barrel.weight}g
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Container>
  );
}

// ─── 比較テーブル ────────────────────────────────────────────────

interface ComparisonTableProps {
  dartA: Dart;
  dartB: Dart;
}

interface SpecRow {
  label: string;
  valueA: number | null | undefined;
  valueB: number | null | undefined;
  unit: string;
}

interface NameRow {
  label: string;
  nameA: string;
  nameB: string;
}

type TableSection = {
  section: string;
  names: NameRow[];
  specs: SpecRow[];
};

// 区切り線のスタイル
const dividerBorder = '2px solid';
const labelCell = { borderRight: dividerBorder, borderColor: 'divider' };
const leftCell = { borderRight: dividerBorder, borderColor: 'divider' };

function formatDiff(
  valueA: number | null | undefined,
  valueB: number | null | undefined,
  unit: string,
): string | null {
  if (valueA == null || valueB == null) return null;
  const diff = Math.round((valueB - valueA) * 100) / 100;
  if (diff === 0) return null;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff}${unit}`;
}

function ComparisonTable({ dartA, dartB }: ComparisonTableProps) {
  const totalsA = calcDartTotals(dartA);
  const totalsB = calcDartTotals(dartB);

  const shaftLengthA = dartA.flight.isCondorAxe
    ? dartA.flight.condorAxeShaftLengthMm
    : dartA.shaft.lengthMm;
  const shaftLengthB = dartB.flight.isCondorAxe
    ? dartB.flight.condorAxeShaftLengthMm
    : dartB.shaft.lengthMm;

  const mainSections: TableSection[] = [
    {
      section: 'トータル',
      names: [],
      specs: [
        { label: '全長', valueA: totalsA.totalLength, valueB: totalsB.totalLength, unit: 'mm' },
        { label: '総重量', valueA: totalsA.totalWeight, valueB: totalsB.totalWeight, unit: 'g' },
      ],
    },
    {
      section: 'バレル',
      names: [
        {
          label: '名前',
          nameA: `${dartA.barrel.brand} ${dartA.barrel.name}`,
          nameB: `${dartB.barrel.brand} ${dartB.barrel.name}`,
        },
      ],
      specs: [
        { label: '重量', valueA: dartA.barrel.weight, valueB: dartB.barrel.weight, unit: 'g' },
        {
          label: '最大径',
          valueA: dartA.barrel.maxDiameter,
          valueB: dartB.barrel.maxDiameter,
          unit: 'mm',
        },
        { label: '全長', valueA: dartA.barrel.length, valueB: dartB.barrel.length, unit: 'mm' },
      ],
    },
  ];

  const detailSections: TableSection[] = [
    {
      section: 'チップ',
      names: [{ label: '名前', nameA: dartA.tip.name, nameB: dartB.tip.name }],
      specs: [
        { label: '長さ', valueA: dartA.tip.lengthMm, valueB: dartB.tip.lengthMm, unit: 'mm' },
        { label: '重量', valueA: dartA.tip.weightG, valueB: dartB.tip.weightG, unit: 'g' },
      ],
    },
    {
      section: 'シャフト',
      names: [
        {
          label: '名前',
          nameA: dartA.flight.isCondorAxe ? `${dartA.flight.name}（CONDOR AXE）` : dartA.shaft.name,
          nameB: dartB.flight.isCondorAxe ? `${dartB.flight.name}（CONDOR AXE）` : dartB.shaft.name,
        },
      ],
      specs: [
        { label: '長さ', valueA: shaftLengthA, valueB: shaftLengthB, unit: 'mm' },
        { label: '重量', valueA: dartA.shaft.weightG, valueB: dartB.shaft.weightG, unit: 'g' },
      ],
    },
    {
      section: 'フライト',
      names: [{ label: '名前', nameA: dartA.flight.name, nameB: dartB.flight.name }],
      specs: [
        { label: '重量', valueA: dartA.flight.weightG, valueB: dartB.flight.weightG, unit: 'g' },
      ],
    },
  ];

  const renderImage = (dart: Dart) =>
    dart.imageUrls.length > 0 ? (
      <Box
        component="img"
        src={dart.imageUrls[0]}
        alt={dart.title}
        sx={{
          width: '100%',
          aspectRatio: '4/3',
          objectFit: 'cover',
          borderRadius: 1,
          display: 'block',
        }}
      />
    ) : (
      <Box
        component="img"
        src="/dart-placeholder.svg"
        alt="No Image"
        sx={{
          width: '100%',
          aspectRatio: '4/3',
          objectFit: 'cover',
          borderRadius: 1,
          display: 'block',
        }}
      />
    );

  const renderRows = (sections: TableSection[]) =>
    sections.map((sec) => (
      <Fragment key={sec.section}>
        <TableRow>
          <TableCell
            sx={{ ...labelCell, bgcolor: 'action.hover', fontWeight: 700, fontSize: '0.85rem' }}
          >
            {sec.section}
          </TableCell>
          <TableCell sx={{ ...leftCell, bgcolor: 'action.hover' }} />
          <TableCell sx={{ bgcolor: 'action.hover' }} />
        </TableRow>
        {sec.names.map((row) => (
          <TableRow key={`${sec.section}-name-${row.label}`}>
            <TableCell sx={{ ...labelCell, color: 'text.secondary', whiteSpace: 'nowrap' }}>
              {row.label}
            </TableCell>
            <TableCell sx={{ ...leftCell, fontSize: '0.8rem' }}>{row.nameA}</TableCell>
            <TableCell sx={{ fontSize: '0.8rem' }}>{row.nameB}</TableCell>
          </TableRow>
        ))}
        {sec.specs.map((row) => {
          const { colorA, colorB } = getDiffColors(row.valueA, row.valueB);
          const diff = formatDiff(row.valueA, row.valueB, row.unit);
          return (
            <TableRow key={`${sec.section}-spec-${row.label}`}>
              <TableCell sx={{ ...labelCell, color: 'text.secondary', whiteSpace: 'nowrap' }}>
                {row.label}
              </TableCell>
              <TableCell
                sx={{ ...leftCell, color: colorA, fontWeight: colorA !== 'inherit' ? 700 : 400 }}
              >
                {row.valueA != null ? `${row.valueA}${row.unit}` : '-'}
              </TableCell>
              <TableCell sx={{ color: colorB, fontWeight: colorB !== 'inherit' ? 700 : 400 }}>
                {row.valueB != null ? `${row.valueB}${row.unit}` : '-'}
                {diff && (
                  <Typography
                    component="span"
                    sx={{ ml: 0.5, fontSize: '0.75rem', color: 'text.secondary', fontWeight: 400 }}
                  >
                    ({diff})
                  </Typography>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </Fragment>
    ));

  return (
    <Paper variant="outlined">
      <Table size="small" sx={{ tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '20%' }} />
          <col style={{ width: '40%' }} />
          <col style={{ width: '40%' }} />
        </colgroup>
        <TableBody>
          {/* ヘッダー: タイトル */}
          <TableRow>
            <TableCell sx={labelCell} />
            <TableCell sx={{ ...leftCell, fontWeight: 700, textAlign: 'center', py: 1.5 }}>
              {dartA.title}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, textAlign: 'center', py: 1.5 }}>
              {dartB.title}
            </TableCell>
          </TableRow>
          {/* 画像 */}
          <TableRow>
            <TableCell sx={{ ...labelCell, verticalAlign: 'middle', color: 'text.secondary' }}>
              画像
            </TableCell>
            <TableCell sx={{ ...leftCell, p: 1 }}>{renderImage(dartA)}</TableCell>
            <TableCell sx={{ p: 1 }}>{renderImage(dartB)}</TableCell>
          </TableRow>
          {/* メイン: トータル + バレル */}
          {renderRows(mainSections)}
        </TableBody>
      </Table>

      {/* 折りたたみ: パーツ詳細 */}
      <Accordion disableGutters elevation={0} sx={{ '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'action.hover' }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            パーツ詳細（チップ・シャフト・フライト）
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Table size="small" sx={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '40%' }} />
              <col style={{ width: '40%' }} />
            </colgroup>
            <TableBody>{renderRows(detailSections)}</TableBody>
          </Table>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
}

// ─── ページエクスポート（Suspense必須: useSearchParams使用） ──────

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
