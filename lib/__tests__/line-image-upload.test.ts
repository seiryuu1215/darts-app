import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSave, mockMakePublic, mockFile, mockBucket } = vi.hoisted(() => {
  const mockSave = vi.fn().mockResolvedValue(undefined);
  const mockMakePublic = vi.fn().mockResolvedValue(undefined);
  const mockFile = vi.fn().mockReturnValue({ save: mockSave, makePublic: mockMakePublic });
  const mockBucket = vi.fn().mockReturnValue({ file: mockFile });
  return { mockSave, mockMakePublic, mockFile, mockBucket };
});

vi.mock('../firebase-admin', () => ({
  adminStorage: {
    bucket: mockBucket,
  },
}));

import { uploadLineImage } from '../line-image-upload';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'test-bucket.appspot.com');
  mockSave.mockClear();
  mockMakePublic.mockClear();
  mockFile.mockClear();
  mockBucket.mockClear();
  mockBucket.mockReturnValue({ file: mockFile });
  mockFile.mockReturnValue({ save: mockSave, makePublic: mockMakePublic });
});

describe('uploadLineImage', () => {
  it('バッファをStorageにアップロードし公開URLを返す', async () => {
    const buffer = Buffer.from('test-png-data');
    const url = await uploadLineImage(buffer, 'images/line-session/user1/2025-03-05.png');

    expect(mockBucket).toHaveBeenCalledWith('test-bucket.appspot.com');
    expect(mockFile).toHaveBeenCalledWith('images/line-session/user1/2025-03-05.png');
    expect(mockSave).toHaveBeenCalledWith(buffer, {
      metadata: {
        contentType: 'image/png',
        cacheControl: 'public, max-age=31536000',
      },
    });
    expect(mockMakePublic).toHaveBeenCalled();
    expect(url).toBe(
      'https://storage.googleapis.com/test-bucket.appspot.com/images/line-session/user1/2025-03-05.png',
    );
  });

  it('Storageエラー時に例外をスローする', async () => {
    mockSave.mockRejectedValueOnce(new Error('Storage error'));
    const buffer = Buffer.from('test-png-data');
    await expect(uploadLineImage(buffer, 'test/path.png')).rejects.toThrow('Storage error');
  });
});
