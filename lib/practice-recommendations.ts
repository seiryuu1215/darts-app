/**
 * AI練習レコメンデーション（ルールベース）
 * 全データを統合し、優先度付きの練習推奨を生成
 */

export type RecommendationCategory =
  | 'bull'
  | 'arrange'
  | 'cricket'
  | 'consistency'
  | 'form'
  | 'session'
  | 'mental';

export type Urgency = 'high' | 'medium' | 'low';

export interface PracticeRecommendation {
  id: string;
  category: RecommendationCategory;
  urgency: Urgency;
  title: string;
  description: string;
  drill: string;
  expectedEffect: string;
  priority: number; // 0-100 高い方が優先
}

export interface RecommendationInput {
  // 01
  ppd: number | null;
  bullRate: number | null;
  arrangeRate: number | null;
  avgBust: number | null;
  // Cricket
  mpr: number | null;
  tripleRate: number | null;
  openCloseRate: number | null;
  // COUNT-UP
  countupAvg: number | null;
  countupConsistency: number | null; // 安定度スコア 0-100
  // ミス方向
  primaryMissDirection: string | null;
  directionStrength: number | null;
  // DL3
  avgRadius: number | null;
  radiusImprovement: number | null;
  avgSpeed: number | null;
  // セッション
  optimalSessionLength: number | null;
  peakGameNumber: number | null;
  // ラウンド
  roundPattern: string | null;
  worstRound: number | null;
}

/** ルールベースでレコメンデーションを生成 */
export function generateRecommendations(input: RecommendationInput): PracticeRecommendation[] {
  const recs: PracticeRecommendation[] = [];

  // Bull率が低い → ブル練習
  if (input.bullRate != null && input.bullRate < 20) {
    const urgency: Urgency = input.bullRate < 12 ? 'high' : 'medium';
    recs.push({
      id: 'bull-practice',
      category: 'bull',
      urgency,
      title: 'ブル精度の向上',
      description: `現在のBull率${input.bullRate}%は改善の余地があります。ブルへの精度を上げることで01のスタッツが大幅に向上します。`,
      drill: 'COUNT-UP練習でブル狙い集中。目標: 1セッション50本以上をBULLエリアに。20分×週3回。',
      expectedEffect: `Bull率を${Math.min(input.bullRate + 5, 25)}%まで上げると、01 Avgが3-5PPD向上する可能性`,
      priority: urgency === 'high' ? 90 : 70,
    });
  }

  // アレンジ率が低い → フィニッシュ練習
  if (input.arrangeRate != null && input.arrangeRate < 20) {
    const urgency: Urgency = input.arrangeRate < 12 ? 'high' : 'medium';
    recs.push({
      id: 'arrange-practice',
      category: 'arrange',
      urgency,
      title: 'フィニッシュ力の強化',
      description: `アレンジ成功率${input.arrangeRate}%。40-60残りのフィニッシュパターンを身につけることで勝率が直接向上します。`,
      drill: '01練習で残り40, 32, 36, 50からのフィニッシュを反復。各パターン20回×3日。',
      expectedEffect: 'アレンジ率5%向上ごとに01勝率が約3%改善',
      priority: urgency === 'high' ? 85 : 65,
    });
  }

  // バスト率が高い
  if (input.avgBust != null && input.avgBust > 3) {
    recs.push({
      id: 'bust-reduction',
      category: 'arrange',
      urgency: 'medium',
      title: 'バスト率の低減',
      description: `平均バスト${input.avgBust.toFixed(1)}回は多め。残り数字に応じたアレンジ判断を改善しましょう。`,
      drill: '残り数字表を暗記。特に残り60以下のダブルアウトルートを確認。',
      expectedEffect: 'バストを1回減らすだけで01の効率が大幅改善',
      priority: 60,
    });
  }

  // Cricket: トリプル率が低い
  if (input.tripleRate != null && input.tripleRate < 20) {
    recs.push({
      id: 'triple-practice',
      category: 'cricket',
      urgency: input.tripleRate < 12 ? 'high' : 'medium',
      title: 'トリプル精度の向上',
      description: `トリプル率${input.tripleRate}%。Cricketの攻撃力に直結するスキルです。`,
      drill: 'Cricket Count-Upで各ナンバーのトリプル狙い練習。20,19,18を重点的に。',
      expectedEffect: 'トリプル率5%向上でMPRが0.2-0.3改善',
      priority: input.tripleRate < 12 ? 75 : 55,
    });
  }

  // Cricket: Open-Close率が低い
  if (input.openCloseRate != null && input.openCloseRate < 25) {
    recs.push({
      id: 'openclose-strategy',
      category: 'cricket',
      urgency: 'medium',
      title: 'Open-Close戦略の改善',
      description: `Open-Close率${input.openCloseRate}%。攻守のバランスを改善することでCricketの勝率がアップします。`,
      drill: '対戦でオープン→相手ナンバーのクローズ判断を意識。3本目の使い方を戦略的に。',
      expectedEffect: 'Cricket勝率5-10%向上の可能性',
      priority: 50,
    });
  }

  // ミス方向の偏り
  if (
    input.directionStrength != null &&
    input.directionStrength > 0.15 &&
    input.primaryMissDirection
  ) {
    recs.push({
      id: 'miss-direction-fix',
      category: 'form',
      urgency: 'medium',
      title: 'ミス方向の偏り修正',
      description: `${input.primaryMissDirection}方向へのミスが集中しています（偏り強度: ${(input.directionStrength * 100).toFixed(0)}%）。`,
      drill: `スタンスやリリースポイントを微調整。${input.primaryMissDirection}方向のミスを意識して矯正練習。`,
      expectedEffect: 'グルーピング改善とBull率向上',
      priority: 55,
    });
  }

  // グルーピング（radius）が大きい
  if (input.avgRadius != null && input.avgRadius > 40) {
    recs.push({
      id: 'grouping-improvement',
      category: 'form',
      urgency: input.avgRadius > 55 ? 'high' : 'medium',
      title: 'グルーピングの改善',
      description: `平均グルーピング半径${input.avgRadius.toFixed(1)}mm。投げのばらつきを減らすことで全般的に改善します。`,
      drill: 'ブル狙い20本連続投げ。グルーピング意識。同じフォーム・リズムで投げる練習。',
      expectedEffect: 'グルーピング5mm改善でスコアが10-15%向上',
      priority: input.avgRadius > 55 ? 80 : 60,
    });
  }

  // 安定性が低い（COUNT-UP）
  if (input.countupConsistency != null && input.countupConsistency < 60) {
    recs.push({
      id: 'consistency-improvement',
      category: 'consistency',
      urgency: input.countupConsistency < 40 ? 'high' : 'medium',
      title: 'スコア安定性の向上',
      description: `COUNT-UP安定度${input.countupConsistency}点。スコアのばらつきが大きい状態です。`,
      drill: '各セッションで「平均±50」のスコアを目標。極端な低スコアを減らす意識で。',
      expectedEffect: '安定性向上でトーナメントでの実力発揮率が改善',
      priority: input.countupConsistency < 40 ? 70 : 50,
    });
  }

  // セッション疲労
  if (input.optimalSessionLength != null && input.peakGameNumber != null) {
    if (input.peakGameNumber <= 3) {
      recs.push({
        id: 'warmup-strategy',
        category: 'session',
        urgency: 'low',
        title: 'ウォームアップの効率化',
        description: `ピークが${input.peakGameNumber}G目と早い。ウォームアップ方法を見直しましょう。`,
        drill: '投げ始め前にストレッチ+素振り。最初の3Gは力みすぎずリズム重視で。',
        expectedEffect: 'セッション序盤の安定感向上',
        priority: 35,
      });
    }
  }

  // ラウンドパターン
  if (input.roundPattern === 'cold_start' && input.worstRound != null) {
    recs.push({
      id: 'round-warmup',
      category: 'session',
      urgency: 'low',
      title: 'COUNT-UP序盤の改善',
      description: `R${input.worstRound}のスコアが低い傾向。ゲーム開始時の集中を高めましょう。`,
      drill: '最初の3投を特に集中。ルーティンを確立し、1投目から本気で。',
      expectedEffect: 'COUNT-UP平均スコア10-20点向上の可能性',
      priority: 40,
    });
  } else if (input.roundPattern === 'fade_out') {
    recs.push({
      id: 'round-endurance',
      category: 'mental',
      urgency: 'medium',
      title: 'COUNT-UP終盤の集中力維持',
      description: '終盤でスコアが落ちる傾向。集中力の持続が課題です。',
      drill: '8R目を「最後の3投」として特別に集中。深呼吸→投げのルーティンを。',
      expectedEffect: '終盤R平均10-15点アップの可能性',
      priority: 45,
    });
  }

  // 優先度でソートし、上位5件を返す
  return recs.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
