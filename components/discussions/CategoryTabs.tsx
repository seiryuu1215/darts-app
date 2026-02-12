'use client';

import { Tabs, Tab } from '@mui/material';
import { DISCUSSION_CATEGORIES, CATEGORY_LABELS } from '@/types';
import type { DiscussionCategory } from '@/types';

interface CategoryTabsProps {
  value: DiscussionCategory | 'all';
  onChange: (value: DiscussionCategory | 'all') => void;
}

export default function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  return (
    <Tabs
      value={value}
      onChange={(_, v) => onChange(v)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ mb: 2 }}
    >
      <Tab label="すべて" value="all" />
      {DISCUSSION_CATEGORIES.map((cat) => (
        <Tab key={cat} label={CATEGORY_LABELS[cat]} value={cat} />
      ))}
    </Tabs>
  );
}
