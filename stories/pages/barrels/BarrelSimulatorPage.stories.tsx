import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { MOCK_BARREL_PRODUCTS } from '../../mocks/barrels';

interface BarrelSimulatorPageStoryProps {
  variant: 'default' | 'comparing';
}

function BarrelSimulatorPageStory({ variant }: BarrelSimulatorPageStoryProps) {
  const selected = variant === 'comparing' ? MOCK_BARREL_PRODUCTS.slice(0, 2) : [];

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs
          items={[{ label: 'バレルDB', href: '/barrels' }, { label: 'シルエット比較' }]}
        />
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
          シルエット比較
        </Typography>

        {/* Simulator Area */}
        <Paper
          variant="outlined"
          sx={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            bgcolor: 'background.default',
          }}
        >
          {selected.length === 0 ? (
            <Typography color="text.secondary">
              バレルを選択するとシルエットが表示されます
            </Typography>
          ) : (
            <Typography color="text.secondary">
              {selected.map((b) => b.name).join(' vs ')} のシルエット比較
            </Typography>
          )}
        </Paper>

        {/* Spec comparison table */}
        {selected.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>バレル</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    重量
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    最大径
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    全長
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>カット</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selected.map((bp) => (
                  <TableRow key={bp.id}>
                    <TableCell>
                      {bp.brand} {bp.name}
                    </TableCell>
                    <TableCell align="right">{bp.weight}g</TableCell>
                    <TableCell align="right">
                      {bp.maxDiameter ? `${bp.maxDiameter}mm` : '-'}
                    </TableCell>
                    <TableCell align="right">{bp.length ? `${bp.length}mm` : '-'}</TableCell>
                    <TableCell>{bp.cut || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Barrel Selection */}
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          バレルを選択（最大2つ）
        </Typography>
        <TextField
          size="small"
          placeholder="バレル名で検索..."
          fullWidth
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />

        <Grid container spacing={1}>
          {MOCK_BARREL_PRODUCTS.slice(0, 6).map((bp) => {
            const isSelected = selected.some((s) => s.id === bp.id);
            return (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={bp.id}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: 'pointer',
                    opacity: selected.length >= 2 && !isSelected ? 0.5 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    borderWidth: isSelected ? 2 : 1,
                  }}
                >
                  <CardMedia component="img" height="80" image={bp.imageUrl ?? ''} />
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="caption" fontWeight="bold" noWrap>
                      {bp.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {bp.weight}g
                    </Typography>
                    {isSelected && (
                      <Chip label="選択中" size="small" color="primary" sx={{ mt: 0.5 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Barrels/BarrelSimulatorPage',
  component: BarrelSimulatorPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BarrelSimulatorPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: 'default' },
};

export const Comparing: Story = {
  args: { variant: 'comparing' },
};
