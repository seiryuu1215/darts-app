'use client';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList';
import MapIcon from '@mui/icons-material/Map';

interface ShopViewToggleProps {
  viewMode: 'list' | 'map';
  onChange: (mode: 'list' | 'map') => void;
}

export default function ShopViewToggle({ viewMode, onChange }: ShopViewToggleProps) {
  return (
    <ToggleButtonGroup
      value={viewMode}
      exclusive
      onChange={(_, val) => val && onChange(val)}
      size="small"
    >
      <ToggleButton value="list">
        <ViewListIcon sx={{ fontSize: 18, mr: 0.5 }} />
        リスト
      </ToggleButton>
      <ToggleButton value="map">
        <MapIcon sx={{ fontSize: 18, mr: 0.5 }} />
        地図
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
