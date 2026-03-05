import { describe, it, expect } from 'vitest';
import { parseN01Csv, aggregateByDate } from '../n01-parser';

describe('parseN01Csv', () => {
  it('returns error for empty input', () => {
    const result = parseN01Csv('');
    expect(result.sessions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('returns error for header-only input', () => {
    const result = parseN01Csv('Date,Game,Round,Score');
    expect(result.sessions).toHaveLength(0);
    expect(result.errors[0]).toContain('行数不足');
  });

  it('parses comma-separated CSV', () => {
    const csv = `Date,Game,Round,Score
2025-01-15,501,15,450
2025-01-16,Cricket,10,300`;
    const result = parseN01Csv(csv);
    expect(result.sessions).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.sessions[0].date).toBe('2025-01-15');
    expect(result.sessions[0].gameType).toBe('501');
    expect(result.sessions[0].rounds).toBe(15);
    expect(result.sessions[0].totalScore).toBe(450);
    expect(result.sessions[0].avgPerRound).toBe(30);
  });

  it('parses tab-separated CSV', () => {
    const csv = `Date\tGame\tRound\tScore\n2025-01-15\t501\t10\t200`;
    const result = parseN01Csv(csv);
    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].date).toBe('2025-01-15');
  });

  it('handles US date format (MM/DD/YYYY)', () => {
    const csv = `Date,Game,Round,Score\n01/15/2025,501,10,200`;
    const result = parseN01Csv(csv);
    expect(result.sessions[0].date).toBe('2025-01-15');
  });

  it('handles EU date format (DD.MM.YYYY)', () => {
    const csv = `Date,Game,Round,Score\n15.01.2025,501,10,200`;
    const result = parseN01Csv(csv);
    expect(result.sessions[0].date).toBe('2025-01-15');
  });

  it('handles YYYY/MM/DD format', () => {
    const csv = `Date,Game,Round,Score\n2025/1/5,501,10,200`;
    const result = parseN01Csv(csv);
    expect(result.sessions[0].date).toBe('2025-01-05');
  });

  it('records errors for unparseable dates', () => {
    const csv = `Date,Game,Round,Score\ninvalid-date,501,10,200`;
    const result = parseN01Csv(csv);
    expect(result.sessions).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
  });

  it('returns error when date column is missing', () => {
    const csv = `Game,Round,Score\n501,10,200`;
    const result = parseN01Csv(csv);
    expect(result.errors[0]).toContain('日付カラム');
  });

  it('handles Japanese header names', () => {
    const csv = `日付,ゲーム,ラウンド,スコア\n2025-01-15,501,10,200`;
    const result = parseN01Csv(csv);
    expect(result.sessions).toHaveLength(1);
  });

  it('handles Windows line endings', () => {
    const csv = `Date,Game,Round,Score\r\n2025-01-15,501,10,200\r\n2025-01-16,501,12,250`;
    const result = parseN01Csv(csv);
    expect(result.sessions).toHaveLength(2);
  });
});

describe('aggregateByDate', () => {
  it('groups sessions by date', () => {
    const sessions = [
      { date: '2025-01-15', gameType: '501', rounds: 10, totalScore: 200, avgPerRound: 20 },
      { date: '2025-01-15', gameType: '501', rounds: 12, totalScore: 300, avgPerRound: 25 },
      { date: '2025-01-16', gameType: '501', rounds: 8, totalScore: 150, avgPerRound: 18.75 },
    ];
    const result = aggregateByDate(sessions);
    expect(result.size).toBe(2);
    const jan15 = result.get('2025-01-15');
    expect(jan15!.count).toBe(2);
    expect(jan15!.totalScore).toBe(500);
    expect(jan15!.avgScore).toBe(250);
  });

  it('handles empty sessions', () => {
    expect(aggregateByDate([]).size).toBe(0);
  });
});
