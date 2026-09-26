import type { Metadata } from 'next';
import { Company } from '@/components/atlas/company';
export const metadata: Metadata = { title: 'Atlas · Parallax Pay', description: 'Hiring velocity, open roles, loop intelligence and members hired.' };
export function generateStaticParams() { return [{ slug: 'parallax-pay' }]; }
export default function Page() { return <Company />; }
