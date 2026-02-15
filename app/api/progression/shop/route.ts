import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAuth, withErrorHandler } from '@/lib/api-middleware';
import { SHOP_ITEMS, getShopItem } from '@/lib/progression/shop';
import { MILESTONES } from '@/lib/progression/milestones';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * GET /api/progression/shop — ショップアイテム一覧 + ユーザーインベントリ
 */
export const GET = withErrorHandler(
  withAuth(async (_req: NextRequest, { userId }) => {
    const userDoc = await adminDb.doc(`users/${userId}`).get();
    const userData = userDoc.data() || {};
    const inventory = userData.inventory || {};
    const xp = userData.xp ?? 0;
    const milestones = userData.milestones || [];

    const items = Object.values(SHOP_ITEMS).map((item) => ({
      ...item,
      owned: inventory[item.id] || 0,
    }));

    return NextResponse.json({
      items,
      xp,
      inventory,
      milestones,
    });
  }),
  'Shop GET error',
);

/**
 * POST /api/progression/shop — アイテム購入
 * Body: { itemId: string }
 */
export const POST = withErrorHandler(
  withAuth(async (req: NextRequest, { userId }) => {
    const body = await req.json();
    const { itemId } = body as { itemId: string };

    const item = getShopItem(itemId);
    if (!item) {
      return NextResponse.json({ error: '不明なアイテムです' }, { status: 400 });
    }

    const userRef = adminDb.doc(`users/${userId}`);
    const userDoc = await userRef.get();
    const userData = userDoc.data() || {};
    const xp = userData.xp ?? 0;
    const inventory = userData.inventory || {};

    // XP不足チェック
    if (xp < item.cost) {
      return NextResponse.json({ error: 'XPが不足しています' }, { status: 400 });
    }

    // 所持上限チェック
    const currentQty = inventory[itemId] || 0;
    if (currentQty >= item.maxOwned) {
      return NextResponse.json({ error: '所持上限に達しています' }, { status: 400 });
    }

    // XP消費 + インベントリ更新
    await userRef.update({
      xp: FieldValue.increment(-item.cost),
      [`inventory.${itemId}`]: FieldValue.increment(1),
    });

    // XP履歴記録
    await adminDb.collection(`users/${userId}/xpHistory`).add({
      action: 'shop_purchase',
      xp: -item.cost,
      detail: `${item.label}を購入`,
      createdAt: FieldValue.serverTimestamp(),
    });

    // マイルストーンチェック（購入後のXPで）
    const newXp = xp - item.cost;
    await checkMilestones(userRef, userId, userData, newXp);

    return NextResponse.json({
      success: true,
      newXp,
      inventory: {
        ...inventory,
        [itemId]: currentQty + 1,
      },
    });
  }),
  'Shop POST error',
);

/**
 * マイルストーン到達チェック → 報酬自動付与
 */
async function checkMilestones(
  userRef: FirebaseFirestore.DocumentReference,
  userId: string,
  userData: FirebaseFirestore.DocumentData,
  totalXp: number,
) {
  const existingMilestones: string[] = userData.milestones || [];

  for (const milestone of MILESTONES) {
    if (totalXp >= milestone.xp && !existingMilestones.includes(milestone.id)) {
      // マイルストーン達成
      await userRef.update({
        milestones: FieldValue.arrayUnion(milestone.id),
      });

      // 報酬をインベントリに追加
      if (milestone.rewards) {
        const updates: Record<string, FirebaseFirestore.FieldValue> = {};
        for (const reward of milestone.rewards) {
          updates[`inventory.${reward.itemId}`] = FieldValue.increment(reward.quantity);
        }
        await userRef.update(updates);
      }

      // XP履歴
      await adminDb.collection(`users/${userId}/xpHistory`).add({
        action: 'milestone',
        xp: 0,
        detail: `マイルストーン達成: ${milestone.label}`,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }
}
