'use client';

import { Box, Chip, Collapse } from '@mui/material';
import SmokeFreeIcon from '@mui/icons-material/SmokeFree';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import TrainIcon from '@mui/icons-material/Train';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SettingsIcon from '@mui/icons-material/Settings';

interface ShopFilterControlsProps {
  categoryNames: string[];
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
  selectedLine: string | null;
  onSelectLine: (line: string | null) => void;
  categoryLines: string[];
  availableLineSet: Set<string>;
  favoriteFilter: boolean;
  onToggleFavorite: () => void;
  noSmokingFilter: boolean;
  onToggleNoSmoking: () => void;
  visitFilter: 'all' | 'visited' | 'unvisited';
  onSetVisitFilter: (v: 'all' | 'visited' | 'unvisited') => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  filterTags: string[];
  showTagFilter: boolean;
  onToggleShowTagFilter: () => void;
  onClearChipFilters: () => void;
  onOpenTagManage: () => void;
}

export default function ShopFilterControls({
  categoryNames,
  selectedCategory,
  onSelectCategory,
  selectedLine,
  onSelectLine,
  categoryLines,
  availableLineSet,
  favoriteFilter,
  onToggleFavorite,
  noSmokingFilter,
  onToggleNoSmoking,
  visitFilter,
  onSetVisitFilter,
  selectedTags,
  onToggleTag,
  filterTags,
  showTagFilter,
  onToggleShowTagFilter,
  onClearChipFilters,
  onOpenTagManage,
}: ShopFilterControlsProps) {
  const showClearButton =
    selectedTags.length > 0 || noSmokingFilter || visitFilter !== 'all' || favoriteFilter;

  return (
    <>
      {availableLineSet.size > 0 && (
        <Box sx={{ mb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              overflowX: 'auto',
              pb: 0.5,
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'action.hover', borderRadius: 2 },
            }}
          >
            <Chip
              label="全路線"
              size="small"
              color={!selectedCategory && !selectedLine ? 'primary' : 'default'}
              variant={!selectedCategory && !selectedLine ? 'filled' : 'outlined'}
              onClick={() => {
                onSelectCategory(null);
                onSelectLine(null);
              }}
              sx={{ height: 24, fontSize: '0.7rem', flexShrink: 0 }}
            />
            {categoryNames.map((cat) => (
              <Chip
                key={cat}
                icon={<TrainIcon sx={{ fontSize: '14px !important' }} />}
                label={cat}
                size="small"
                color={selectedCategory === cat ? 'primary' : 'default'}
                variant={selectedCategory === cat ? 'filled' : 'outlined'}
                onClick={() => {
                  onSelectCategory(selectedCategory === cat ? null : cat);
                  onSelectLine(null);
                }}
                sx={{ height: 24, fontSize: '0.7rem', flexShrink: 0 }}
              />
            ))}
          </Box>

          {selectedCategory && categoryLines.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                overflowX: 'auto',
                pt: 0.5,
                pb: 0.5,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'action.hover', borderRadius: 2 },
              }}
            >
              {categoryLines.map((line) => (
                <Chip
                  key={line}
                  label={line}
                  size="small"
                  color={selectedLine === line ? 'secondary' : 'default'}
                  variant={selectedLine === line ? 'filled' : 'outlined'}
                  onClick={() => onSelectLine(selectedLine === line ? null : line)}
                  sx={{ height: 24, fontSize: '0.7rem', flexShrink: 0 }}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          flexWrap: 'wrap',
          mb: 0.5,
        }}
      >
        <Chip
          icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
          label="お気に入り"
          size="small"
          color={favoriteFilter ? 'warning' : 'default'}
          variant={favoriteFilter ? 'filled' : 'outlined'}
          onClick={onToggleFavorite}
          sx={{ height: 24, fontSize: '0.7rem' }}
        />
        <Chip
          icon={<SmokeFreeIcon sx={{ fontSize: '14px !important' }} />}
          label="禁煙・分煙のみ"
          size="small"
          color={noSmokingFilter ? 'info' : 'default'}
          variant={noSmokingFilter ? 'filled' : 'outlined'}
          onClick={onToggleNoSmoking}
          sx={{ height: 24, fontSize: '0.7rem' }}
        />
        <Chip
          icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
          label="訪問済み"
          size="small"
          color={visitFilter === 'visited' ? 'success' : 'default'}
          variant={visitFilter === 'visited' ? 'filled' : 'outlined'}
          onClick={() => onSetVisitFilter(visitFilter === 'visited' ? 'all' : 'visited')}
          sx={{ height: 24, fontSize: '0.7rem' }}
        />
        <Chip
          label="未訪問"
          size="small"
          color={visitFilter === 'unvisited' ? 'warning' : 'default'}
          variant={visitFilter === 'unvisited' ? 'filled' : 'outlined'}
          onClick={() => onSetVisitFilter(visitFilter === 'unvisited' ? 'all' : 'unvisited')}
          sx={{ height: 24, fontSize: '0.7rem' }}
        />
        {showClearButton && (
          <Chip
            label="クリア"
            size="small"
            variant="outlined"
            color="error"
            onClick={onClearChipFilters}
            sx={{ height: 24, fontSize: '0.7rem' }}
          />
        )}
      </Box>

      {filterTags.length > 0 && (
        <Box sx={{ mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Chip
              label={showTagFilter ? 'タグで絞る ▲' : 'タグで絞る ▼'}
              size="small"
              variant="outlined"
              icon={
                showTagFilter ? (
                  <ExpandLessIcon sx={{ fontSize: '14px !important' }} />
                ) : (
                  <ExpandMoreIcon sx={{ fontSize: '14px !important' }} />
                )
              }
              onClick={onToggleShowTagFilter}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
            <Chip
              icon={<SettingsIcon sx={{ fontSize: '14px !important' }} />}
              label="表示設定"
              size="small"
              variant="outlined"
              onClick={onOpenTagManage}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
          </Box>
          <Collapse in={showTagFilter}>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {filterTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  color={selectedTags.includes(tag) ? 'primary' : 'default'}
                  variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                  onClick={() => onToggleTag(tag)}
                  sx={{ height: 24, fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </Collapse>
        </Box>
      )}
    </>
  );
}
