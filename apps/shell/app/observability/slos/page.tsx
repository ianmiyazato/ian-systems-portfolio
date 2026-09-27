import type { Metadata } from 'next';
import { Slos } from '@/components/tidewatch/slos';

export const metadata: Metadata = { title: 'Tidewatch · SLOs', description: 'SLO cards with error-budget burn-rate alerts.' };

export default function SlosPage() {
  return <Slos />;
}
