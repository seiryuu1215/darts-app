interface MonthlyReportData {
  year: number;
  month: number;
  playDays: number;
  totalGames: number;
  avgRating: number | null;
  bestRating: number | null;
  avgPpd: number | null;
  bestPpd: number | null;
  avgMpr: number | null;
  bestMpr: number | null;
  avgHighOff: number | null;
  bestHighOff: number | null;
  cricketBestScore: number | null;
  totalDBull: number;
  totalSBull: number;
  avgBullRate: number | null;
  totalTon80: number;
  totalLowTon: number;
  totalHighTon: number;
  totalHatTrick: number;
  totalThreeInABed: number;
  totalThreeInABlack: number;
  totalWhiteHorse: number;
  avgCondition: number | null;
}

export function renderPdfHtml(data: MonthlyReportData): string {
  const fmt = (v: number | null, digits = 2) => (v != null ? v.toFixed(digits) : '-');

  const awardRow = (label: string, count: number, highlight = false) => `
    <div style="display:flex;justify-content:space-between;padding:4px 8px;${highlight && count > 0 ? 'background:#fff8e1;border-radius:4px;' : ''}">
      <span>${label}</span>
      <span style="font-weight:bold;${highlight && count > 0 ? 'color:#f57c00;' : ''}">${count}</span>
    </div>`;

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 2px solid #1976d2; }
  .header h1 { font-size: 24px; color: #1976d2; margin-bottom: 4px; }
  .header .period { font-size: 14px; color: #666; }
  .section { margin-bottom: 24px; }
  .section h2 { font-size: 16px; color: #1976d2; margin-bottom: 12px; padding-bottom: 4px; border-bottom: 1px solid #e0e0e0; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .grid2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .stat-card { background: #f5f5f5; border-radius: 8px; padding: 12px; text-align: center; }
  .stat-card .label { font-size: 11px; color: #666; margin-bottom: 4px; }
  .stat-card .value { font-size: 20px; font-weight: bold; }
  .stat-card .sub { font-size: 11px; color: #999; margin-top: 2px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .summary-item { background: #e3f2fd; border-radius: 8px; padding: 12px; text-align: center; }
  .summary-item .label { font-size: 11px; color: #1565c0; }
  .summary-item .value { font-size: 22px; font-weight: bold; color: #1565c0; }
  .awards-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; }
  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <h1>Darts Lab Monthly Report</h1>
    <div class="period">${data.year}年${data.month}月</div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <div class="label">プレイ日数</div>
      <div class="value">${data.playDays}</div>
    </div>
    <div class="summary-item">
      <div class="label">総ゲーム数</div>
      <div class="value">${data.totalGames}</div>
    </div>
    <div class="summary-item">
      <div class="label">平均Rating</div>
      <div class="value">${fmt(data.avgRating)}</div>
    </div>
    <div class="summary-item">
      <div class="label">平均コンディション</div>
      <div class="value">${fmt(data.avgCondition, 1)}</div>
    </div>
  </div>

  <div class="section">
    <h2>01 スタッツ</h2>
    <div class="grid">
      <div class="stat-card">
        <div class="label">平均PPD</div>
        <div class="value">${fmt(data.avgPpd)}</div>
        <div class="sub">Best: ${fmt(data.bestPpd)}</div>
      </div>
      <div class="stat-card">
        <div class="label">平均ハイオフ</div>
        <div class="value">${fmt(data.avgHighOff, 0)}</div>
        <div class="sub">Best: ${fmt(data.bestHighOff, 0)}</div>
      </div>
      <div class="stat-card">
        <div class="label">ベストRating</div>
        <div class="value">${fmt(data.bestRating)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Cricket スタッツ</h2>
    <div class="grid2">
      <div class="stat-card">
        <div class="label">平均MPR</div>
        <div class="value">${fmt(data.avgMpr)}</div>
      </div>
      <div class="stat-card">
        <div class="label">ベストスコア</div>
        <div class="value">${fmt(data.cricketBestScore, 0)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>ブルスタッツ</h2>
    <div class="grid">
      <div class="stat-card">
        <div class="label">D-BULL</div>
        <div class="value">${data.totalDBull}</div>
      </div>
      <div class="stat-card">
        <div class="label">S-BULL</div>
        <div class="value">${data.totalSBull}</div>
      </div>
      <div class="stat-card">
        <div class="label">平均ブル率</div>
        <div class="value">${fmt(data.avgBullRate, 1)}%</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>アワード</h2>
    <div class="awards-list">
      ${awardRow('ロートン', data.totalLowTon)}
      ${awardRow('ハイトン', data.totalHighTon)}
      ${awardRow('TON80', data.totalTon80, true)}
      ${awardRow('ハットトリック', data.totalHatTrick)}
      ${awardRow('3 in a Bed', data.totalThreeInABed)}
      ${awardRow('3 in the Black', data.totalThreeInABlack, true)}
      ${awardRow('ホワイトホース', data.totalWhiteHorse, true)}
    </div>
  </div>

  <div class="footer">
    Generated by Darts Lab &mdash; ${new Date().toLocaleDateString('ja-JP')}
  </div>
</body>
</html>`;
}
