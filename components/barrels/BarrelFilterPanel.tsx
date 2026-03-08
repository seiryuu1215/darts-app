'use client';

import {
  Grid,
  Typography,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Collapse,
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

interface BarrelFilterPanelProps {
  open: boolean;
  statusFilter: 'all' | 'current' | 'discontinued';
  onStatusChange: (v: 'all' | 'current' | 'discontinued') => void;
  selectedType: string;
  onTypeChange: (v: string) => void;
  selectedBrand: string;
  onBrandChange: (v: string) => void;
  brands: string[];
  selectedCut: string;
  onCutChange: (v: string) => void;
  cuts: string[];
  weightRange: [number, number];
  onWeightChange: (v: [number, number]) => void;
  diameterRange: [number, number];
  onDiameterChange: (v: [number, number]) => void;
  lengthRange: [number, number];
  onLengthChange: (v: [number, number]) => void;
}

export default function BarrelFilterPanel({
  open,
  statusFilter,
  onStatusChange,
  selectedType,
  onTypeChange,
  selectedBrand,
  onBrandChange,
  brands,
  selectedCut,
  onCutChange,
  cuts,
  weightRange,
  onWeightChange,
  diameterRange,
  onDiameterChange,
  lengthRange,
  onLengthChange,
}: BarrelFilterPanelProps) {
  return (
    <Collapse in={open}>
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom>
            販売状態
          </Typography>
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_, v) => {
              if (v !== null) onStatusChange(v);
            }}
            size="small"
          >
            <ToggleButton value="all">すべて</ToggleButton>
            <ToggleButton value="current">現行品のみ</ToggleButton>
            <ToggleButton value="discontinued">廃盤のみ</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>タイプ</InputLabel>
              <Select
                value={selectedType}
                onChange={(e) => onTypeChange(e.target.value)}
                label="タイプ"
              >
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="soft">ソフト (2BA/4BA)</MenuItem>
                <MenuItem value="steel">スティール</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>ブランド</InputLabel>
              <Select
                value={selectedBrand}
                onChange={(e) => onBrandChange(e.target.value)}
                label="ブランド"
              >
                <MenuItem value="">すべて</MenuItem>
                {brands.map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>カット</InputLabel>
              <Select
                value={selectedCut}
                onChange={(e) => onCutChange(e.target.value)}
                label="カット"
              >
                <MenuItem value="">すべて</MenuItem>
                {cuts.map((cut) => (
                  <MenuItem key={cut} value={cut}>
                    {cut}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="body2" gutterBottom>
              重量: {weightRange[0]}g 〜 {weightRange[1]}g
            </Typography>
            <Slider
              value={weightRange}
              onChange={(_, v) => onWeightChange(v as [number, number])}
              min={10}
              max={30}
              step={0.5}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}g`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="body2" gutterBottom>
              最大径: {diameterRange[0]}mm 〜 {diameterRange[1]}mm
            </Typography>
            <Slider
              value={diameterRange}
              onChange={(_, v) => onDiameterChange(v as [number, number])}
              min={4}
              max={10}
              step={0.1}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}mm`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="body2" gutterBottom>
              全長: {lengthRange[0]}mm 〜 {lengthRange[1]}mm
            </Typography>
            <Slider
              value={lengthRange}
              onChange={(_, v) => onLengthChange(v as [number, number])}
              min={20}
              max={60}
              step={0.5}
              valueLabelDisplay="auto"
              valueLabelFormat={(v) => `${v}mm`}
            />
          </Grid>
        </Grid>
      </Paper>
    </Collapse>
  );
}
