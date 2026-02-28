import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { decrypt } from '@/lib/crypto';
import { withAdmin, withErrorHandler } from '@/lib/api-middleware';
import { pxSync } from '@/lib/phoenix-api';

export const maxDuration = 60;

export const POST = withErrorHandler(
  withAdmin(async (_req: NextRequest, ctx) => {
    const userId = ctx.userId;

    // PX認証情報を取得・復号
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data();
    if (!userData?.pxCredentialsEncrypted?.email || !userData?.pxCredentialsEncrypted?.password) {
      return NextResponse.json({ error: 'PHOENIX認証情報が保存されていません' }, { status: 400 });
    }

    const pxEmail = decrypt(userData.pxCredentialsEncrypted.email);
    const pxPassword = decrypt(userData.pxCredentialsEncrypted.password);

    let stats;
    try {
      stats = await pxSync(pxEmail, pxPassword);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[PX-SYNC] エラー:', msg);
      if (msg.includes('PX_LOGIN_FAILED')) {
        return NextResponse.json(
          { error: `PHOENIXログインに失敗しました。認証情報を確認してください。(${msg})` },
          { status: 401 },
        );
      }
      throw err;
    }

    // Firestore書き込み — phoenixCache/latest
    await adminDb.doc(`users/${userId}/phoenixCache/latest`).set({
      rating: stats.rating,
      ppd: stats.ppd,
      mpr: stats.mpr,
      className: stats.className,
      countUpAvg: stats.countUpAvg,
      isPayed: stats.isPayed,
      syncAt: FieldValue.serverTimestamp(),
    });

    console.log(
      `[PX-SYNC] 完了: rating=${stats.rating}, ppd=${stats.ppd}, mpr=${stats.mpr}, class=${stats.className}`,
    );

    return NextResponse.json({
      success: true,
      stats: {
        rating: stats.rating,
        ppd: stats.ppd,
        mpr: stats.mpr,
        className: stats.className,
        countUpAvg: stats.countUpAvg,
      },
    });
  }),
  'PHOENIX同期エラー',
);
