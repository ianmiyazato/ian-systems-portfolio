import { Experience } from '@/components/experience';

type PageProps = { params: Promise<{ slug?: string[] }> };

export default async function Page({ params }: PageProps) {
  const { slug = [] } = await params;
  return <Experience path={`/${slug.join('/')}`} />;
}

