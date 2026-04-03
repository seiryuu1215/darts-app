import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withErrorHandler } from '@/lib/api-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const TrackSchema = z.object({
  shop: z.string().min(1).max(200),
  barrelBrand: z.string().max(200).optional(),
  barrelName: z.string().max(200).optional(),
});

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
  const parsed = TrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'リクエストデータが不正です' }, { status: 400 });
  }

  await adminDb.collection('affiliateClicks').add({
    shop: parsed.data.shop,
    barrelBrand: sanitizeString(parsed.data.barrelBrand, MAX_FIELD_LENGTH),
    barrelName: sanitizeString(parsed.data.barrelName, MAX_FIELD_LENGTH),
    timestamp: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}

export const POST = withErrorHandler(handlePost, 'affiliate-track:POST');
