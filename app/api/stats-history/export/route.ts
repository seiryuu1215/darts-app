import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { canExportCsv } from '@/lib/permissions';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: '未ログインです' }, { status: 401 });
  }
  if (!canExportCsv(session.user.role)) {
    return NextResponse.json({ error: 'PROプラン以上で利用できます' }, { status: 403 });
  }

  try {
    const colRef = adminDb.collection(`users/${session.user.id}/dartsLiveStats`);
    const snapshot = await colRef.orderBy('date', 'asc').get();

    const header = '日付,Rating,PPD,MPR,ゲーム数,コンディション,メモ';
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
      const memo = (d.memo ?? '').replace(/"/g, '""');

      rows.push(`${dateStr},${rating},${ppd},${mpr},${games},${condition},"${memo}"`);
    });

    const csv = rows.join('\n');
    const bom = '\uFEFF'; // UTF-8 BOM for Excel

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="dartslive-stats.csv"',
      },
    });
  } catch (err) {
    console.error('CSV export error:', err);
    return NextResponse.json({ error: 'エクスポートエラー' }, { status: 500 });
  }
}
