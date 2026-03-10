import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/api-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * アフィリエイトクリック記録 — 認証不要（未ログインユーザーも追跡）。
 * POST { shop, barrelBrand?, barrelName? }
 */
const MAX_FIELD_LENGTH = 200;

function sanitizeString(val: unknown, maxLen: number): string | null {
  if (!val || typeof val !== 'string') return null;
  return val.slice(0, maxLen);
}

async function handlePost(req: NextRequest) {
  const body = await req.json();
  const { shop, barrelBrand, barrelName } = body;

  if (!shop || typeof shop !== 'string') {
    return NextResponse.json({ error: 'shop is required' }, { status: 400 });
  }

  await adminDb.collection('affiliateClicks').add({
    shop: shop.slice(0, MAX_FIELD_LENGTH),
    barrelBrand: sanitizeString(barrelBrand, MAX_FIELD_LENGTH),
    barrelName: sanitizeString(barrelName, MAX_FIELD_LENGTH),
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(handlePost, 'affiliate-track:POST');
