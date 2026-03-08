export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatMinutesToHM(minutes: number | null): string {
  if (minutes === null) return '--';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m > 0 ? `${m}m` : ''}`;
}

export function getTrend(
  current: number | null,
  previous: number | null,
): 'up' | 'down' | 'flat' | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  const pct = Math.abs(diff / previous) * 100;
  if (pct < 2) return 'flat';
  return diff > 0 ? 'up' : 'down';
}
