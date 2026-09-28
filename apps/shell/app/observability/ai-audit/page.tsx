import type { Metadata } from 'next';
import { AiAudit } from '@/components/tidewatch/audit';

export const metadata: Metadata = { title: 'Tidewatch · AI audit', description: 'Every approved AI suggestion across the portfolio: who approved it, which model version, and the outcome measured later.' };

export default function AiAuditPage() {
  return <AiAudit />;
}
