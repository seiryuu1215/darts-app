import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  Rating,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Breadcrumbs from '@/components/layout/Breadcrumbs';

interface CalendarRecord {
  date: string;
  condition: number;
  rating?: number;
  ppd?: number;
  memo?: string;
}

const MOCK_CALENDAR_RECORDS: CalendarRecord[] = [
  { date: '2025-03-01', condition: 3, rating: 8.0, ppd: 41.2 },
  { date: '2025-03-03', condition: 2, rating: 7.8, ppd: 38.5, memo: '調子悪め' },
  { date: '2025-03-05', condition: 4, rating: 8.2, ppd: 44.0 },
  { date: '2025-03-07', condition: 5, rating: 8.5, ppd: 46.8, memo: '絶好調！' },
  { date: '2025-03-10', condition: 3, rating: 8.0, ppd: 40.0 },
  { date: '2025-03-12', condition: 4, rating: 8.3, ppd: 43.5 },
  { date: '2025-03-15', condition: 5, rating: 8.5, ppd: 47.0, memo: '自己ベスト更新' },
  { date: '2025-03-18', condition: 3, rating: 8.1, ppd: 42.0 },
  { date: '2025-03-20', condition: 4, rating: 8.4, ppd: 45.0 },
  { date: '2025-03-22', condition: 2, rating: 7.9, ppd: 39.0 },
  { date: '2025-03-25', condition: 3, rating: 8.0, ppd: 41.0 },
];

const conditionColors: Record<number, string> = {
  1: '#f44336',
  2: '#ff9800',
  3: '#ffc107',
  4: '#4caf50',
  5: '#2196f3',
};

interface StatsCalendarPageStoryProps {
  records: CalendarRecord[];
  selectedDate: string | null;
}

function StatsCalendarPageStory({
  records,
  selectedDate: initialDate,
}: StatsCalendarPageStoryProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);
  const year = 2025;
  const month = 3;
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];

  const selectedRecord = records.find((r) => r.date === selectedDate);

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        <Breadcrumbs items={[{ label: 'Stats', href: '/stats' }, { label: 'カレンダー' }]} />

        {/* Month Navigator */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
          <IconButton size="small">
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2, fontWeight: 'bold' }}>
            {year}年{month}月
          </Typography>
          <IconButton size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Calendar Grid */}
        <Paper variant="outlined" sx={{ p: 1 }}>
          <Grid container columns={7}>
            {dayLabels.map((d) => (
              <Grid size={1} key={d}>
                <Box sx={{ textAlign: 'center', py: 0.5 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary">
                    {d}
                  </Typography>
                </Box>
              </Grid>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <Grid size={1} key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const record = records.find((r) => r.date === dateStr);
              const isSelected = dateStr === selectedDate;
              const isToday = day === 7;

              return (
                <Grid size={1} key={day}>
                  <Box
                    onClick={() => setSelectedDate(dateStr)}
                    sx={{
                      textAlign: 'center',
                      py: 1,
                      cursor: 'pointer',
                      borderRadius: 1,
                      bgcolor: isSelected ? 'primary.main' : 'transparent',
                      color: isSelected ? 'primary.contrastText' : 'text.primary',
                      border: isToday ? 1 : 0,
                      borderColor: 'primary.main',
                      '&:hover': { bgcolor: isSelected ? 'primary.dark' : 'action.hover' },
                    }}
                  >
                    <Typography variant="body2">{day}</Typography>
                    {record && (
                      <Box
                        sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: conditionColors[record.condition],
                          mx: 'auto',
                          mt: 0.3,
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 1.5, mt: 1, justifyContent: 'center' }}>
          {[
            { label: '悪い', color: conditionColors[1] },
            { label: '普通', color: conditionColors[3] },
            { label: '絶好調', color: conditionColors[5] },
          ].map(({ label, color }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Day Detail Dialog */}
        <Dialog
          open={!!selectedRecord}
          onClose={() => setSelectedDate(null)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{selectedDate}</DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2">調子:</Typography>
                  <Rating value={selectedRecord.condition} readOnly max={5} size="small" />
                </Box>
                {selectedRecord.rating != null && (
                  <Typography variant="body2">Rating: {selectedRecord.rating}</Typography>
                )}
                {selectedRecord.ppd != null && (
                  <Typography variant="body2">PPD: {selectedRecord.ppd}</Typography>
                )}
                {selectedRecord.memo && (
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    {selectedRecord.memo}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Stats/StatsCalendarPage',
  component: StatsCalendarPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof StatsCalendarPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FullMonth: Story = {
  args: { records: MOCK_CALENDAR_RECORDS, selectedDate: null },
};

export const EmptyMonth: Story = {
  args: { records: [], selectedDate: null },
};

export const WithSelectedDay: Story = {
  args: { records: MOCK_CALENDAR_RECORDS, selectedDate: '2025-03-07' },
};
