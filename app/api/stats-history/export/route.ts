import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { canExportCsv } from '@/lib/permissions';
import { withPermission, withErrorHandler } from '@/lib/api-middleware';

export const GET = withErrorHandler(
  withPermission(canExportCsv, 'PROプラン以上で利用できます', async (_req, { userId }) => {
    const colRef = adminDb.collection(`users/${userId}/dartsLiveStats`);
    const snapshot = await colRef.orderBy('date', 'asc').get();

    const header = '日付,Rating,PPD,MPR,ゲーム数,コンディション,D-BULL,S-BULL,メモ';
    const rows: string[] = [header];

    snapshot.forEach((doc) => {
      const d = doc.data();
      const dateVal = d.date?.toDate?.() ?? (d.date ? new Date(d.date) : null);
      const dateStr = dateVal ? dateVal.toISOString().slice(0, 10) : '';
      const rating = d.rating ?? '';
      const ppd = d.zeroOneStats?.ppd ?? '';
      const mpr = d.cricketStats?.mpr ?? '';
      const games = d.gamesPlayed ?? '';
      const condition = d.condition ?? '';
      const dBull = d.bullStats?.dBull ?? '';
      const sBull = d.bullStats?.sBull ?? '';
      let memo = (d.memo ?? '').replace(/"/g, '""');
      // CSV injection防止: 先頭が =, +, -, @, \t, \r の場合はシングルクォートで無害化
      if (/^[=+\-@\t\r]/.test(memo)) memo = `'${memo}`;

      rows.push(`${dateStr},${rating},${ppd},${mpr},${games},${condition},${dBull},${sBull},"${memo}"`);
    });

    const csv = rows.join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dartslive-stats.csv"',
      },
    });
  }),
  'CSV export error',
);
