import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { renderPdfHtml } from '@/lib/pdf-template';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const GET = withErrorHandler(
  withAuth(async (request: NextRequest, { userId }) => {
    const monthParam = request.nextUrl.searchParams.get('month');
    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json({ error: 'month パラメータが必要です (YYYY-MM)' }, { status: 400 });
    }

    const [yearStr, monthStr] = monthParam.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    // JST基準で月の start/end
    const start = new Date(Date.UTC(year, month - 1, 1, -9, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, -9, 0, 0, 0));

    const colRef = adminDb.collection(`users/${userId}/dartsLiveStats`);
    const snapshot = await colRef
      .orderBy('date', 'asc')
      .where('date', '>=', start)
      .where('date', '<', end)
      .get();

    // 集計
    const playDaysSet = new Set<string>();
    let totalGames = 0;
    let ratingSum = 0;
    let ratingCount = 0;
    let bestRating: number | null = null;
    let ppdSum = 0;
    let ppdCount = 0;
    let bestPpd: number | null = null;
    let mprSum = 0;
    let mprCount = 0;
    let highOffSum = 0;
    let highOffCount = 0;
    let bestHighOff: number | null = null;
    let cricketBestScore: number | null = null;
    let totalDBull = 0;
    let totalSBull = 0;
    let bullRateSum = 0;
    let bullRateCount = 0;
    let totalTon80 = 0;
    let totalLowTon = 0;
    let totalHighTon = 0;
    let totalHatTrick = 0;
    let totalThreeInABed = 0;
    let totalThreeInABlack = 0;
    let totalWhiteHorse = 0;
    let conditionSum = 0;
    let conditionCount = 0;

    snapshot.forEach((doc) => {
      const d = doc.data();
      const dateVal = d.date?.toDate?.() ?? (d.date ? new Date(d.date) : null);
      if (dateVal) {
        const jst = new Date(dateVal.getTime() + 9 * 60 * 60 * 1000);
        playDaysSet.add(jst.toISOString().split('T')[0]);
      }

      totalGames += d.gamesPlayed ?? 0;

      const rating = d.rating != null ? parseFloat(String(d.rating)) : null;
      if (rating != null) {
        ratingSum += rating;
        ratingCount++;
        if (bestRating == null || rating > bestRating) bestRating = rating;
      }

      const ppd = d.zeroOneStats?.ppd;
      if (ppd != null) {
        ppdSum += ppd;
        ppdCount++;
        if (bestPpd == null || ppd > bestPpd) bestPpd = ppd;
      }

      const mpr = d.cricketStats?.mpr;
      if (mpr != null) {
        mprSum += mpr;
        mprCount++;
      }

      const highOff = d.zeroOneStats?.highOff;
      if (highOff != null) {
        highOffSum += highOff;
        highOffCount++;
        if (bestHighOff == null || highOff > bestHighOff) bestHighOff = highOff;
      }

      const chs = d.cricketStats?.highScore;
      if (chs != null && (cricketBestScore == null || chs > cricketBestScore)) {
        cricketBestScore = chs;
      }

      totalDBull += d.bullStats?.dBull ?? 0;
      totalSBull += d.bullStats?.sBull ?? 0;

      const br = d.bullRate;
      if (br != null) {
        bullRateSum += br;
        bullRateCount++;
      }

      totalTon80 += d.ton80 ?? 0;
      totalLowTon += d.lowTon ?? 0;
      totalHighTon += d.highTon ?? 0;
      totalHatTrick += d.hatTricks ?? 0;
      totalThreeInABed += d.threeInABed ?? 0;
      totalThreeInABlack += d.threeInABlack ?? 0;
      totalWhiteHorse += d.whiteHorse ?? 0;

      const cond = d.condition;
      if (cond != null) {
        conditionSum += cond;
        conditionCount++;
      }
    });

    const reportData = {
      year,
      month,
      playDays: playDaysSet.size,
      totalGames,
      avgRating: ratingCount > 0 ? ratingSum / ratingCount : null,
      bestRating,
      avgPpd: ppdCount > 0 ? ppdSum / ppdCount : null,
      bestPpd,
      avgMpr: mprCount > 0 ? mprSum / mprCount : null,
      bestMpr: null,
      avgHighOff: highOffCount > 0 ? highOffSum / highOffCount : null,
      bestHighOff,
      cricketBestScore,
      totalDBull,
      totalSBull,
      avgBullRate: bullRateCount > 0 ? bullRateSum / bullRateCount : null,
      totalTon80,
      totalLowTon,
      totalHighTon,
      totalHatTrick,
      totalThreeInABed,
      totalThreeInABlack,
      totalWhiteHorse,
      avgCondition: conditionCount > 0 ? conditionSum / conditionCount : null,
    };

    const html = renderPdfHtml(reportData);

    // Puppeteer で PDF 生成
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });

      const fileName = `darts-lab-report-${year}-${String(month).padStart(2, '0')}.pdf`;

      return new NextResponse(Buffer.from(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } finally {
      await browser.close();
    }
  }),
  'PDF export error',
);
