import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const snapshot = await adminDb
      .collection('articles')
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { title: '記事 | Darts Lab' };
    }

    const data = snapshot.docs[0].data();
    const title = data.title || '記事';
    const description = data.excerpt || data.title || '';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://darts-app-lime.vercel.app';
    const ogParams = new URLSearchParams({ title });
    const ogImageUrl = `${siteUrl}/api/og?${ogParams.toString()}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: ogImageUrl, width: 1200, height: 630 }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch {
    return { title: '記事 | Darts Lab' };
  }
}

export default function ArticleSlugLayout({ children }: Props) {
  return <>{children}</>;
}
