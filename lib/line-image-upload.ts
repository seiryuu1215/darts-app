import { adminStorage } from './firebase-admin';

/**
 * 画像バッファを Firebase Storage にアップロードし、公開URLを返す
 */
export async function uploadLineImage(buffer: Buffer, filePath: string): Promise<string> {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;
  const bucket = adminStorage.bucket(bucketName);
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}
