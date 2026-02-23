import { describe, expect, it } from 'vitest';
import { groupPlaysBySession, computeSessionCurve, analyzeSession } from './session-analysis';

// ヘルパー: 指定日時のプレイデータ生成
function play(time: string, score: number) {
  return { time, score, dl3Speed: 0 };
}

describe('groupPlaysBySession', () => {
  it('スペース区切りの日時を正しく日別にグルーピングする', () => {
    const plays = [
      play('2026-02-20 10:00:00', 500),
      play('2026-02-20 10:30:00', 520),
      play('2026-02-20 11:00:00', 480),
      play('2026-02-21 14:00:00', 510),
      play('2026-02-21 14:30:00', 530),
    ];
    const sessions = groupPlaysBySession(plays);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].date).toBe('2026-02-20');
    expect(sessions[0].gameCount).toBe(3);
    expect(sessions[1].date).toBe('2026-02-21');
    expect(sessions[1].gameCount).toBe(2);
  });

  it('ISO形式（T区切り）の日時も正しくグルーピングする', () => {
    const plays = [
      play('2026-02-20T10:00:00', 500),
      play('2026-02-20T11:00:00', 520),
      play('2026-02-21T14:00:00', 510),
    ];
    const sessions = groupPlaysBySession(plays);
    expect(sessions).toHaveLength(2);
    expect(sessions[0].date).toBe('2026-02-20');
    expect(sessions[1].date).toBe('2026-02-21');
  });
});

describe('computeSessionCurve', () => {
  it('各ゲーム番号で3セッション以上のデータがある場合にポイントを生成する', () => {
    const plays = [
      // 3日間 × 各3ゲーム
      play('2026-02-20 10:00:00', 500),
      play('2026-02-20 10:30:00', 520),
      play('2026-02-20 11:00:00', 480),
      play('2026-02-21 10:00:00', 510),
      play('2026-02-21 10:30:00', 530),
      play('2026-02-21 11:00:00', 490),
      play('2026-02-22 10:00:00', 505),
      play('2026-02-22 10:30:00', 515),
      play('2026-02-22 11:00:00', 525),
    ];
    const sessions = groupPlaysBySession(plays);
    const curve = computeSessionCurve(sessions);
    expect(curve.length).toBe(3); // 各ゲーム番号(1,2,3)で3セッション以上
    expect(curve[0].gameNumber).toBe(1);
    expect(curve[1].gameNumber).toBe(2);
    expect(curve[2].gameNumber).toBe(3);
  });
});

describe('analyzeSession', () => {
  it('スペース区切り日時のデータで正しくセッション分析ができる', () => {
    // 4日間 × 各3ゲーム = 12プレイ (>= 10)
    const plays = [
      play('2026-02-20 10:00:00', 500),
      play('2026-02-20 10:30:00', 520),
      play('2026-02-20 11:00:00', 480),
      play('2026-02-21 10:00:00', 510),
      play('2026-02-21 10:30:00', 530),
      play('2026-02-21 11:00:00', 490),
      play('2026-02-22 10:00:00', 505),
      play('2026-02-22 10:30:00', 515),
      play('2026-02-22 11:00:00', 525),
      play('2026-02-23 10:00:00', 540),
      play('2026-02-23 10:30:00', 510),
      play('2026-02-23 11:00:00', 500),
    ];
    const result = analyzeSession(plays);
    expect(result).not.toBeNull();
    expect(result!.totalSessions).toBe(4);
    expect(result!.sessionCurve.length).toBeGreaterThanOrEqual(3);
    expect(result!.avgSessionLength).toBe(3);
  });

  it('10件未満はnullを返す', () => {
    const plays = Array.from({ length: 9 }, (_, i) => play(`2026-02-20 ${10 + i}:00:00`, 500));
    expect(analyzeSession(plays)).toBeNull();
  });

  it('3セッション未満はnullを返す', () => {
    // 2日間だけ（セッション数 < 3）
    const plays = [
      ...Array.from({ length: 5 }, (_, i) => play(`2026-02-20 ${10 + i}:00:00`, 500)),
      ...Array.from({ length: 5 }, (_, i) => play(`2026-02-21 ${10 + i}:00:00`, 510)),
    ];
    expect(analyzeSession(plays)).toBeNull();
  });
});
