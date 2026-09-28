import type { Metadata } from 'next';
import { AcademyBrowse } from '@/components/atlas/browse';
export const metadata: Metadata = { title: 'Atlas · Academy', description: 'System design lessons and series, personalized to your weakest rubric area, with Arena drills after every episode.' };
export default function Page() { return <AcademyBrowse />; }
