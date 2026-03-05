import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * アフィリエイトクリック記録 — 認証不要（未ログインユーザーも追跡）。
 * POST { shop, barrelBrand?, barrelName? }
 */
async function handlePost(req: NextRequest) {
  const body = await req.json();
  const { shop, barrelBrand, barrelName } = body;

  if (!shop || typeof shop !== 'string') {
    return NextResponse.json({ error: 'shop is required' }, { status: 400 });
  }

  await adminDb.collection('affiliateClicks').add({
    shop,
    barrelBrand: barrelBrand || null,
    barrelName: barrelName || null,
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(handlePost, 'affiliate-track:POST');
