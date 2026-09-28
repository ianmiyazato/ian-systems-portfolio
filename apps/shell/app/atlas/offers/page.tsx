import type { Metadata } from 'next';
import { OfferWallet } from '@/components/atlas/offers';
export const metadata: Metadata = { title: 'Atlas · Offers', description: 'Offer wallet: net pay per month in reais, private by default, with an FX scenario and a guided accept.' };
export default function Page() { return <OfferWallet />; }
