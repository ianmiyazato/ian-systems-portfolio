import type { Metadata } from 'next';
import { LiveMatch } from '@/components/atlas/mentors';
export const metadata: Metadata = { title: 'Atlas · Live mock', description: 'Match with an online mentor for a live mock interview, with an ETA and a progress sheet.' };
export default function Page() { return <LiveMatch />; }
