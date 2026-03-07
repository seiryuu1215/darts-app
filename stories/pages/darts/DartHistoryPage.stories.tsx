import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { SettingHistory } from '@/types';
import { daysAgo, placeholderImage } from '../../mocks/factories';

type MockHistory = Omit<SettingHistory, 'createdAt' | 'startedAt' | 'endedAt'> & {
  id: string;
  createdAt: ReturnType<typeof daysAgo>;
  startedAt: ReturnType<typeof daysAgo>;
  endedAt: ReturnType<typeof daysAgo> | null;
};

const MOCK_SOFT_HISTORY: MockHistory[] = [
  {
    id: 'h_001',
    dartId: 'dart_001',
    dartType: 'soft',
    dartTitle: 'メインセッティング 2025',
    barrel: {
      name: 'RISING SUN 6.0 No.5',
      brand: 'TARGET',
      weight: 20,
      maxDiameter: 6.35,
      length: 44,
      cut: 'リングカット',
    },
    tip: { name: 'Premium Lippoint No.5', type: 'soft', lengthMm: 25, weightG: 0.3 },
    shaft: { name: 'L-Shaft Silent Slim 260', lengthMm: 26, weightG: 0.9 },
    flight: { name: 'L-Flight PRO Kite', shape: 'カイト', weightG: 0.2 },
    imageUrl: placeholderImage(200, 150),
    startedAt: daysAgo(30),
    endedAt: null,
    changeType: 'barrel',
    changedParts: ['バレル', 'チップ'],
    memo: 'RISING SUN 6.0に乗り換え。投げやすい。',
    createdAt: daysAgo(30),
  },
  {
    id: 'h_002',
    dartId: 'dart_003',
    dartType: 'soft',
    dartTitle: '旧メインセッティング',
    barrel: {
      name: 'Solo G3',
      brand: 'TRiNiDAD',
      weight: 18,
      maxDiameter: 7.0,
      length: 42,
      cut: 'シャークカット',
    },
    tip: { name: 'Condor Tip', type: 'soft', lengthMm: 25, weightG: 0.35 },
    shaft: { name: 'L-Shaft 260', lengthMm: 26, weightG: 0.9 },
    flight: { name: 'L-Flight Standard', shape: 'スタンダード', weightG: 0.2 },
    imageUrl: null,
    startedAt: daysAgo(120),
    endedAt: daysAgo(30),
    changeType: 'initial',
    changedParts: [],
    memo: '初めてのマイダーツ',
    createdAt: daysAgo(120),
  },
];

const MOCK_STEEL_HISTORY: MockHistory[] = [
  {
    id: 'h_003',
    dartId: 'dart_002',
    dartType: 'steel',
    dartTitle: 'ハードダーツ用',
    barrel: {
      name: 'Solus 23g',
      brand: 'Unicorn',
      weight: 23,
      maxDiameter: 6.8,
      length: 50,
      cut: 'ナーリング',
    },
    tip: { name: 'Storm Point', type: 'steel', lengthMm: 26, weightG: 1.5 },
    shaft: { name: 'Cosmo Fit Carbon Slim', lengthMm: 31, weightG: 0.86 },
    flight: { name: 'Fit Flight Standard', shape: 'スタンダード', weightG: 0.3 },
    imageUrl: placeholderImage(200, 150),
    startedAt: daysAgo(60),
    endedAt: null,
    changeType: 'initial',
    changedParts: [],
    memo: '',
    createdAt: daysAgo(60),
  },
];

interface DartHistoryPageStoryProps {
  dartType: 'soft' | 'steel';
  history: MockHistory[];
}

function DartHistoryPageStory({ dartType, history }: DartHistoryPageStoryProps) {
  const changeTypeLabels: Record<string, string> = {
    initial: '初期設定',
    barrel: 'バレル変更',
    minor: 'パーツ微調整',
  };
  const changeTypeColors: Record<string, 'success' | 'primary' | 'default'> = {
    initial: 'success',
    barrel: 'primary',
    minor: 'default',
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs
          items={[{ label: 'ダーツ一覧', href: '/darts' }, { label: 'セッティング履歴' }]}
        />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          セッティング履歴
        </Typography>

        <ToggleButtonGroup value={dartType} exclusive size="small" sx={{ mb: 3 }}>
          <ToggleButton value="soft">ソフト</ToggleButton>
          <ToggleButton value="steel">スティール</ToggleButton>
        </ToggleButtonGroup>

        {history.length === 0 ? (
          <Paper sx={{ textAlign: 'center', py: 6, bgcolor: 'background.default' }}>
            <Typography color="text.secondary">セッティング履歴がありません</Typography>
          </Paper>
        ) : (
          <Box sx={{ position: 'relative', pl: 3 }}>
            {/* Vertical line */}
            <Box
              sx={{
                position: 'absolute',
                left: 10,
                top: 0,
                bottom: 0,
                width: 2,
                bgcolor: 'divider',
              }}
            />
            {history.map((entry) => {
              const startDate = entry.startedAt?.toDate?.()?.toLocaleDateString('ja-JP') ?? '';
              const endDate = entry.endedAt?.toDate?.()?.toLocaleDateString('ja-JP') ?? '現在';
              return (
                <Box key={entry.id} sx={{ position: 'relative', mb: 3 }}>
                  {/* Dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -23,
                      top: 8,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: entry.endedAt ? 'text.secondary' : 'success.main',
                      border: 2,
                      borderColor: 'background.paper',
                    }}
                  />
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2">{entry.dartTitle}</Typography>
                      <Chip
                        label={changeTypeLabels[entry.changeType]}
                        size="small"
                        color={changeTypeColors[entry.changeType]}
                        sx={{ height: 22, fontSize: 11 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {startDate} 〜 {endDate}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {entry.barrel.brand} {entry.barrel.name} ({entry.barrel.weight}g)
                    </Typography>
                    {entry.changedParts.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                        {entry.changedParts.map((part) => (
                          <Chip key={part} label={part} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}
                    {entry.memo && (
                      <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                        {entry.memo}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Darts/DartHistoryPage',
  component: DartHistoryPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DartHistoryPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SoftDarts: Story = {
  args: {
    dartType: 'soft',
    history: MOCK_SOFT_HISTORY as unknown as MockHistory[],
  },
};

export const SteelDarts: Story = {
  args: {
    dartType: 'steel',
    history: MOCK_STEEL_HISTORY as unknown as MockHistory[],
  },
};

export const Empty: Story = {
  args: { dartType: 'soft', history: [] },
};
