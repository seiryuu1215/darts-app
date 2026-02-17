import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase-admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://darts-app-lime.vercel.app';

  const staticPages = [
    '',
    '/barrels',
    '/barrels/recommend',
    '/barrels/quiz',
    '/barrels/simulator',
    '/articles',
    '/discussions',
    '/darts',
    '/pricing',
    '/about',
    '/login',
    '/register',
    '/terms',
    '/privacy',
    '/reference',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1.0 : 0.7,
  }));

  // Published articles
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const articlesSnap = await adminDb
      .collection('articles')
      .where('status', '==', 'published')
      .get();
    articlePages = articlesSnap.docs.map((doc) => ({
      url: `${baseUrl}/articles/${doc.data().slug || doc.id}`,
      lastModified: doc.data().updatedAt?.toDate?.() ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    // ignore — articles collection may not exist yet
  }

  // Public darts settings
  let dartsPages: MetadataRoute.Sitemap = [];
  try {
    const dartsSnap = await adminDb
      .collection('darts')
      .where('visibility', '==', 'public')
      .get();
    dartsPages = dartsSnap.docs.map((doc) => ({
      url: `${baseUrl}/darts/${doc.id}`,
      lastModified: doc.data().updatedAt?.toDate?.() ?? new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  } catch {
    // ignore — darts collection may not exist yet
  }

  return [...staticPages, ...articlePages, ...dartsPages];
}
