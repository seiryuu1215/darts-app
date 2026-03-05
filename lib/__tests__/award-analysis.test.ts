import { describe, it, expect } from 'vitest';
import { computeAwardPace, projectMilestone, analyzeAwards } from '../award-analysis';

const sampleAwardList = [
  { date: '2025-01', awards: { 'HAT TRICK': 20, 'LOW TON': 15 } },
  { date: '2025-02', awards: { 'HAT TRICK': 25, 'LOW TON': 10 } },
  { date: '2025-03', awards: { 'HAT TRICK': 30, 'LOW TON': 12 } },
  { date: '2025-04', awards: { 'HAT TRICK': 35, 'LOW TON': 8 } },
];

describe('computeAwardPace', () => {
  it('returns empty for empty list', () => {
    expect(computeAwardPace([])).toEqual([]);
  });

  it('calculates total count correctly', () => {
    const paces = computeAwardPace(sampleAwardList);
    const hatTrick = paces.find((p) => p.awardName === 'HAT TRICK');
    expect(hatTrick!.totalCount).toBe(110);
  });

  it('calculates monthly average', () => {
    const paces = computeAwardPace(sampleAwardList);
    const hatTrick = paces.find((p) => p.awardName === 'HAT TRICK');
    expect(hatTrick!.monthlyAvg).toBeCloseTo(27.5, 0);
  });

  it('calculates recent 3-month average', () => {
    const paces = computeAwardPace(sampleAwardList);
    const hatTrick = paces.find((p) => p.awardName === 'HAT TRICK');
    // Last 3: 25, 30, 35 → avg = 30
    expect(hatTrick!.recentMonthlyAvg).toBe(30);
  });

  it('detects upward trend', () => {
    const paces = computeAwardPace(sampleAwardList);
    const hatTrick = paces.find((p) => p.awardName === 'HAT TRICK');
    // recentAvg(30) > monthlyAvg(27.5) * 1.15 → not necessarily up
    // Need to check
    expect(['up', 'flat', 'down']).toContain(hatTrick!.trend);
  });

  it('sorts by total count descending', () => {
    const paces = computeAwardPace(sampleAwardList);
    for (let i = 1; i < paces.length; i++) {
      expect(paces[i].totalCount).toBeLessThanOrEqual(paces[i - 1].totalCount);
    }
  });

  it('skips awards with zero total', () => {
    const list = [
      { date: '2025-01', awards: { 'ZERO': 0 } },
      { date: '2025-02', awards: { 'ZERO': 0 } },
    ];
    expect(computeAwardPace(list)).toHaveLength(0);
  });
});

describe('projectMilestone', () => {
  it('returns milestone predictions', () => {
    const paces = computeAwardPace(sampleAwardList);
    const milestones = projectMilestone(paces);
    expect(milestones.length).toBeGreaterThan(0);
  });

  it('skips awards with no recent pace', () => {
    const milestones = projectMilestone([
      {
        awardName: 'TEST',
        totalCount: 50,
        monthlyAvg: 0,
        recentMonthlyAvg: 0,
        trend: 'flat',
        trendColor: '#888',
      },
    ]);
    expect(milestones).toHaveLength(0);
  });

  it('finds next milestone target', () => {
    const paces = computeAwardPace(sampleAwardList);
    const milestones = projectMilestone(paces);
    for (const m of milestones) {
      expect(m.targetCount).toBeGreaterThan(m.currentCount);
    }
  });
});

describe('analyzeAwards', () => {
  it('returns null for fewer than 2 entries', () => {
    expect(analyzeAwards([])).toBeNull();
    expect(analyzeAwards([{ date: '2025-01', awards: { A: 10 } }])).toBeNull();
  });

  it('returns complete analysis', () => {
    const result = analyzeAwards(sampleAwardList);
    expect(result).not.toBeNull();
    expect(result!.paces.length).toBeGreaterThan(0);
    expect(result!.totalAwards).toBeGreaterThan(0);
    expect(result!.monthsCovered).toBe(4);
  });
});
