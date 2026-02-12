'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Link as MuiLink,
  Chip,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface ShaftEntry {
  product: string;
  size: string;
  weight: number;
}

interface ShaftBrand {
  brand: string;
  entries: ShaftEntry[];
}

const shaftData: ShaftBrand[] = [
  {
    brand: 'L-Shaft',
    entries: [
      { product: 'Regular', size: '19.0mm', weight: 0.74 },
      { product: 'Regular', size: '22.5mm', weight: 0.84 },
      { product: 'Regular', size: '26.0mm', weight: 0.93 },
      { product: 'Regular', size: '29.5mm', weight: 1.04 },
      { product: 'Regular', size: '33.0mm', weight: 1.07 },
      { product: 'Slim', size: '19.0mm', weight: 0.72 },
      { product: 'Slim', size: '22.5mm', weight: 0.82 },
      { product: 'Slim', size: '26.0mm', weight: 0.9 },
      { product: 'Slim', size: '29.5mm', weight: 1.02 },
      { product: 'Slim', size: '33.0mm', weight: 1.07 },
    ],
  },
  {
    brand: 'LARO / L-Style Carbon',
    entries: [
      { product: 'LARO', size: '130', weight: 0.63 },
      { product: 'LARO', size: '190', weight: 0.76 },
      { product: 'LARO', size: '260', weight: 1.04 },
      { product: 'LARO', size: '330', weight: 1.2 },
      { product: 'LARO Carbon', size: '130', weight: 0.7 },
      { product: 'LARO Carbon', size: '190', weight: 0.86 },
      { product: 'LARO Carbon', size: '260', weight: 0.92 },
      { product: 'LARO Carbon', size: '330', weight: 1.06 },
      { product: 'L-Style Carbon', size: '190', weight: 0.88 },
      { product: 'L-Style Carbon', size: '260', weight: 1.04 },
      { product: 'L-Style Carbon', size: '330', weight: 1.2 },
    ],
  },
  {
    brand: 'Fit Flight',
    entries: [
      { product: 'ロック', size: '130', weight: 0.58 },
      { product: 'ロック', size: '190', weight: 0.72 },
      { product: 'ロック', size: '300', weight: 0.7 },
      { product: 'サイレント', size: '130', weight: 0.62 },
      { product: 'サイレント', size: '190', weight: 0.98 },
      { product: 'サイレント', size: '300', weight: 0.78 },
      { product: 'ストレート', size: '130', weight: 0.53 },
      { product: 'ストレート', size: '300', weight: 0.78 },
      { product: 'ストレートグラデーション', size: '130', weight: 0.55 },
      { product: 'ストレートグラデーション', size: '300', weight: 0.8 },
      { product: 'スリム', size: '190', weight: 0.73 },
      { product: 'スリム', size: '260', weight: 0.87 },
      { product: 'スリム', size: '370', weight: 0.78 },
      { product: 'カーボンストレート', size: '190', weight: 0.78 },
      { product: 'カーボンストレート', size: '225', weight: 1.06 },
      { product: 'カーボンストレート', size: '370', weight: 0.86 },
      { product: 'カーボンスリム', size: '190', weight: 0.67 },
      { product: 'カーボンスリム', size: '370', weight: 0.86 },
      { product: 'プレミアムカーボン', size: '190', weight: 0.68 },
      { product: 'プレミアムカーボン', size: '370', weight: 0.86 },
    ],
  },
  {
    brand: 'PRO GRIP',
    entries: [
      { product: 'Aluminum', size: 'S', weight: 0.78 },
      { product: 'Aluminum', size: 'I', weight: 0.92 },
      { product: 'Aluminum', size: 'M', weight: 1.05 },
      { product: 'Aluminum', size: 'SP', weight: 0.97 },
      { product: 'TI Carbon', size: 'S', weight: 0.77 },
      { product: 'TI Carbon', size: 'I', weight: 0.93 },
      { product: 'TI Carbon', size: 'M', weight: 1.06 },
      { product: 'Titanium', size: 'T', weight: 0.38 },
    ],
  },
  {
    brand: 'MONSTER',
    entries: [
      { product: 'Dragster', size: '13mm', weight: 0.62 },
      { product: 'Dragster', size: '21mm', weight: 0.8 },
      { product: 'Dragster', size: '25mm', weight: 0.88 },
      { product: 'Dragster', size: '34mm', weight: 1.15 },
      { product: 'PC Shaft', size: '20mm', weight: 1.03 },
      { product: 'PC Shaft', size: '25mm', weight: 1.12 },
      { product: 'PC Shaft', size: '30mm', weight: 1.26 },
      { product: 'PC Shaft', size: '35mm', weight: 1.4 },
    ],
  },
  {
    brand: 'Master Shaft',
    entries: [
      { product: 'Master Shaft', size: 'S', weight: 0.35 },
      { product: 'Master Shaft', size: 'I', weight: 0.39 },
      { product: 'Master Shaft', size: 'M', weight: 0.42 },
      { product: 'Master Shaft Plus', size: 'S', weight: 0.31 },
      { product: 'Master Shaft Plus', size: 'I', weight: 0.34 },
      { product: 'Master Shaft Plus', size: 'M', weight: 0.4 },
      { product: 'Duralumin', size: 'S', weight: 1.23 },
      { product: 'Duralumin', size: 'I', weight: 1.44 },
      { product: 'Duralumin', size: 'M', weight: 1.69 },
      { product: 'Duralumin', size: 'ML', weight: 1.82 },
    ],
  },
  {
    brand: 'JOKER DRIVER (零-ZERO-)',
    entries: [
      { product: 'ラロ', size: '130', weight: 0.63 },
      { product: 'ラロ', size: '190', weight: 0.86 },
      { product: 'ラロ', size: '260', weight: 1.04 },
      { product: 'ラロ', size: '330', weight: 1.2 },
      { product: 'ラロ カーボン', size: '130', weight: 0.7 },
      { product: 'ラロ カーボン', size: '190', weight: 0.76 },
      { product: 'ラロ カーボン', size: '260', weight: 0.92 },
      { product: 'ラロ カーボン', size: '330', weight: 1.06 },
      { product: 'エルスタイルカーボン', size: '190', weight: 0.88 },
      { product: 'エルスタイルカーボン', size: '260', weight: 1.04 },
      { product: 'エルスタイルカーボン', size: '330', weight: 1.2 },
    ],
  },
  {
    brand: 'Clic',
    entries: [
      { product: 'Standard', size: 'S', weight: 0.8 },
      { product: 'Standard', size: 'I', weight: 1.0 },
      { product: 'Standard', size: 'M', weight: 1.15 },
      { product: 'Slim', size: 'S', weight: 0.55 },
      { product: 'Slim', size: 'I', weight: 0.6 },
      { product: 'Slim', size: 'M', weight: 0.65 },
    ],
  },
  {
    brand: '8 Flight',
    entries: [
      { product: 'ロック・スピン', size: '260', weight: 1.14 },
      { product: 'ロック・スピン', size: '330', weight: 1.34 },
    ],
  },
];

function getWeightColor(weight: number): 'success' | 'warning' | 'error' {
  if (weight < 0.7) return 'success';
  if (weight < 1.0) return 'warning';
  return 'error';
}

function getWeightLabel(weight: number): string {
  if (weight < 0.7) return '軽量';
  if (weight < 1.0) return '標準';
  return '重め';
}

export default function ReferencePage() {
  const [tabIndex, setTabIndex] = useState(0);
  const current = shaftData[tabIndex];

  const products = [...new Set(current.entries.map((e) => e.product))];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        シャフト重量 早見表
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        各ブランドのシャフト重量を一覧で比較できます
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          icon={
            <Box
              sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', ml: 1 }}
            />
          }
          label="軽量（〜0.7g）"
          size="small"
          variant="outlined"
        />
        <Chip
          icon={
            <Box
              sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', ml: 1 }}
            />
          }
          label="標準（0.7〜1.0g）"
          size="small"
          variant="outlined"
        />
        <Chip
          icon={
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', ml: 1 }} />
          }
          label="重め（1.0g〜）"
          size="small"
          variant="outlined"
        />
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {shaftData.map((brand, i) => (
            <Tab key={i} label={brand.brand} sx={{ minWidth: 'auto', px: 2 }} />
          ))}
        </Tabs>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>製品</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>サイズ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">
                  重量
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  区分
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {current.entries.map((entry, i) => {
                const isFirstOfProduct =
                  i === 0 || current.entries[i - 1].product !== entry.product;
                const productRowCount = current.entries.filter(
                  (e) => e.product === entry.product,
                ).length;
                return (
                  <TableRow
                    key={`${entry.product}-${entry.size}`}
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    {isFirstOfProduct && (
                      <TableCell
                        rowSpan={productRowCount}
                        sx={{
                          fontWeight: 'bold',
                          borderRight: 1,
                          borderColor: 'divider',
                          verticalAlign: 'top',
                        }}
                      >
                        {entry.product}
                      </TableCell>
                    )}
                    <TableCell>{entry.size}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                      {entry.weight.toFixed(2)}g
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={getWeightLabel(entry.weight)}
                        size="small"
                        color={getWeightColor(entry.weight)}
                        sx={{ height: 22, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          データ参照元:
        </Typography>
        <MuiLink
          href="https://gigaplus.makeshop.jp/sdarts/project/shaft170917/shaftweight.html"
          target="_blank"
          rel="noopener noreferrer"
          variant="caption"
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          エスダーツ シャフト重量早見表
          <OpenInNewIcon sx={{ fontSize: 12 }} />
        </MuiLink>
      </Box>
    </Container>
  );
}
