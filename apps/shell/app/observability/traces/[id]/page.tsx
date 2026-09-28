import type { Metadata } from 'next';
import { Traces } from '@/components/tidewatch/traces';

type Props = { params: Promise<{ id: string }> };

/** Static: the canonical incident trace, and "live" which reads ?id= for traces made in the browser. */
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ id: '9f3a2c' }, { id: 'live' }];
}

export const metadata: Metadata = { title: 'Tidewatch · Trace', description: 'A trace waterfall with span attributes, correlated logs and an AI note on why it is slow.' };

export default async function TracePage({ params }: Props) {
  return <Traces initialId={(await params).id} />;
}
