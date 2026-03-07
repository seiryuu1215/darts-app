import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import type { Dart } from '@/types';
import { MOCK_DART_COMPLETE, MOCK_DART_STEEL, MOCK_DARTS_LIST } from '../../mocks/darts';

interface DartComparePageStoryProps {
  variant: 'comparing' | 'selectDarts' | 'noDarts';
  darts: Dart[];
  dartA?: Dart | null;
  dartB?: Dart | null;
}

function DartComparePageStory({ variant, darts, dartA, dartB }: DartComparePageStoryProps) {
  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs
          items={[{ label: 'ダーツ一覧', href: '/darts' }, { label: 'セッティング比較' }]}
        />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          セッティング比較
        </Typography>

        {variant === 'noDarts' && (
          <Paper sx={{ textAlign: 'center', py: 8, bgcolor: 'background.default' }}>
            <Typography color="text.secondary">
              比較可能なセッティングがありません。全パーツの情報が入力されたセッティングが2つ以上必要です。
            </Typography>
          </Paper>
        )}

        {variant === 'selectDarts' && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              比較するセッティングを2つ選択してください
            </Typography>
            <Grid container spacing={2}>
              {darts.map((dart) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dart.id}>
                  <Card
                    variant="outlined"
                    sx={{ cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
                  >
                    {dart.imageUrls.length > 0 && (
                      <CardMedia component="img" height="120" image={dart.imageUrls[0]} />
                    )}
                    <CardContent>
                      <Typography variant="subtitle2">{dart.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dart.barrel.brand} {dart.barrel.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}

        {variant === 'comparing' && dartA && dartB && (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>項目</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{dartA.title}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{dartB.title}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>バレル</TableCell>
                  <TableCell>
                    {dartA.barrel.brand} {dartA.barrel.name}
                  </TableCell>
                  <TableCell>
                    {dartB.barrel.brand} {dartB.barrel.name}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>重量</TableCell>
                  <TableCell>{dartA.barrel.weight}g</TableCell>
                  <TableCell>
                    {dartB.barrel.weight}g
                    <Chip
                      label={`${dartB.barrel.weight - dartA.barrel.weight > 0 ? '+' : ''}${dartB.barrel.weight - dartA.barrel.weight}g`}
                      size="small"
                      color={dartB.barrel.weight > dartA.barrel.weight ? 'warning' : 'success'}
                      sx={{ ml: 1, height: 20, fontSize: 11 }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>最大径</TableCell>
                  <TableCell>{dartA.barrel.maxDiameter}mm</TableCell>
                  <TableCell>{dartB.barrel.maxDiameter}mm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>全長</TableCell>
                  <TableCell>{dartA.barrel.length}mm</TableCell>
                  <TableCell>{dartB.barrel.length}mm</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>カット</TableCell>
                  <TableCell>{dartA.barrel.cut}</TableCell>
                  <TableCell>{dartB.barrel.cut}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>チップ</TableCell>
                  <TableCell>{dartA.tip.name}</TableCell>
                  <TableCell>{dartB.tip.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>シャフト</TableCell>
                  <TableCell>{dartA.shaft.name}</TableCell>
                  <TableCell>{dartB.shaft.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>フライト</TableCell>
                  <TableCell>{dartA.flight.name}</TableCell>
                  <TableCell>{dartB.flight.name}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Darts/DartComparePage',
  component: DartComparePageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DartComparePageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Comparing: Story = {
  args: {
    variant: 'comparing',
    darts: [],
    dartA: MOCK_DART_COMPLETE as unknown as Dart,
    dartB: MOCK_DART_STEEL as unknown as Dart,
  },
};

export const SelectDarts: Story = {
  args: {
    variant: 'selectDarts',
    darts: MOCK_DARTS_LIST as unknown as Dart[],
  },
};

export const NoDarts: Story = {
  args: { variant: 'noDarts', darts: [] },
};
