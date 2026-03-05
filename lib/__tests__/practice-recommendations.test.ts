import { describe, it, expect } from 'vitest';
import { generateRecommendations, type RecommendationInput } from '../practice-recommendations';

function makeInput(overrides: Partial<RecommendationInput> = {}): RecommendationInput {
  return {
    ppd: null,
    bullRate: null,
    arrangeRate: null,
    avgBust: null,
    mpr: null,
    tripleRate: null,
    openCloseRate: null,
    countupAvg: null,
    countupConsistency: null,
    primaryMissDirection: null,
    directionStrength: null,
    avgRadius: null,
    radiusImprovement: null,
    avgSpeed: null,
    optimalSessionLength: null,
    peakGameNumber: null,
    roundPattern: null,
    worstRound: null,
    ...overrides,
  };
}

describe('generateRecommendations', () => {
  it('returns empty for all-null input', () => {
    expect(generateRecommendations(makeInput())).toHaveLength(0);
  });

  it('recommends bull practice when bullRate < 20', () => {
    const recs = generateRecommendations(makeInput({ bullRate: 10 }));
    expect(recs.some((r) => r.id === 'bull-practice')).toBe(true);
  });

  it('sets high urgency when bullRate < 12', () => {
    const recs = generateRecommendations(makeInput({ bullRate: 8 }));
    const bull = recs.find((r) => r.id === 'bull-practice');
    expect(bull!.urgency).toBe('high');
  });

  it('recommends arrange practice when arrangeRate < 20', () => {
    const recs = generateRecommendations(makeInput({ arrangeRate: 10 }));
    expect(recs.some((r) => r.id === 'arrange-practice')).toBe(true);
  });

  it('recommends bust reduction when avgBust > 3', () => {
    const recs = generateRecommendations(makeInput({ avgBust: 5 }));
    expect(recs.some((r) => r.id === 'bust-reduction')).toBe(true);
  });

  it('recommends triple practice when tripleRate < 20', () => {
    const recs = generateRecommendations(makeInput({ tripleRate: 10 }));
    expect(recs.some((r) => r.id === 'triple-practice')).toBe(true);
  });

  it('recommends open-close strategy when openCloseRate < 25', () => {
    const recs = generateRecommendations(makeInput({ openCloseRate: 15 }));
    expect(recs.some((r) => r.id === 'openclose-strategy')).toBe(true);
  });

  it('recommends miss direction fix when strength > 0.15', () => {
    const recs = generateRecommendations(
      makeInput({ directionStrength: 0.3, primaryMissDirection: '右' }),
    );
    expect(recs.some((r) => r.id === 'miss-direction-fix')).toBe(true);
  });

  it('recommends grouping improvement when avgRadius > 40', () => {
    const recs = generateRecommendations(makeInput({ avgRadius: 60 }));
    const rec = recs.find((r) => r.id === 'grouping-improvement');
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe('high');
  });

  it('recommends consistency improvement when countupConsistency < 60', () => {
    const recs = generateRecommendations(makeInput({ countupConsistency: 35 }));
    const rec = recs.find((r) => r.id === 'consistency-improvement');
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe('high');
  });

  it('recommends warmup strategy when peakGameNumber <= 3', () => {
    const recs = generateRecommendations(
      makeInput({ optimalSessionLength: 10, peakGameNumber: 2 }),
    );
    expect(recs.some((r) => r.id === 'warmup-strategy')).toBe(true);
  });

  it('recommends round warmup for cold_start pattern', () => {
    const recs = generateRecommendations(makeInput({ roundPattern: 'cold_start', worstRound: 1 }));
    expect(recs.some((r) => r.id === 'round-warmup')).toBe(true);
  });

  it('recommends endurance for fade_out pattern', () => {
    const recs = generateRecommendations(makeInput({ roundPattern: 'fade_out' }));
    expect(recs.some((r) => r.id === 'round-endurance')).toBe(true);
  });

  it('returns max 5 recommendations', () => {
    const recs = generateRecommendations(
      makeInput({
        bullRate: 5,
        arrangeRate: 5,
        avgBust: 10,
        tripleRate: 5,
        openCloseRate: 10,
        directionStrength: 0.5,
        primaryMissDirection: '右',
        avgRadius: 70,
        countupConsistency: 20,
      }),
    );
    expect(recs.length).toBeLessThanOrEqual(5);
  });

  it('sorts by priority descending', () => {
    const recs = generateRecommendations(
      makeInput({
        bullRate: 5,
        arrangeRate: 5,
        avgBust: 10,
      }),
    );
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i].priority).toBeLessThanOrEqual(recs[i - 1].priority);
    }
  });
});
