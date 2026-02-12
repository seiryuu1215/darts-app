import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    const doc = await adminDb.collection('darts').doc(id).get();
    if (!doc.exists) {
      return { title: 'セッティング | Darts Lab' };
    }

    const data = doc.data()!;
    const title = `${data.title} | Darts Lab`;
    const barrelInfo = data.barrel
      ? `${data.barrel.brand} ${data.barrel.name} (${data.barrel.weight}g)`
      : '';
    const description = barrelInfo
      ? `${data.userName || ''}のセッティング — ${barrelInfo}`
      : `${data.userName || ''}のダーツセッティング`;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://darts-app-lime.vercel.app';

    const ogParams = new URLSearchParams({
      title: data.title || '',
      barrel: barrelInfo,
      weight: data.barrel?.weight?.toString() || '',
      user: data.userName || '',
      ...(data.imageUrls?.[0] && { image: data.imageUrls[0] }),
    });
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
    return { title: 'セッティング | Darts Lab' };
  }
}

export default function DartDetailLayout({ children }: Props) {
  return <>{children}</>;
}
