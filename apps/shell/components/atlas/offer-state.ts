'use client';

import { useEffect, useState } from 'react';
import { OFFER_CHANNEL, OFFER_KEY, type Application } from '@/lib/atlas';

/** Accepted offer shared by every Atlas tab (localStorage + BroadcastChannel), like the plan. */
export function useAcceptedOffer(): [string | null, (id: string | null) => void] {
  const [accepted, setAccepted] = useState<string | null>(null);
  useEffect(() => {
    try { setAccepted(localStorage.getItem(OFFER_KEY)); } catch { /* storage optional */ }
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(OFFER_CHANNEL) : null;
    if (channel) channel.onmessage = (event: MessageEvent<string | null>) => setAccepted(event.data);
    return () => channel?.close();
  }, []);
  const set = (id: string | null) => {
    setAccepted(id);
    try { if (id) localStorage.setItem(OFFER_KEY, id); else localStorage.removeItem(OFFER_KEY); } catch { /* storage optional */ }
    if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel(OFFER_CHANNEL); channel.postMessage(id); channel.close(); }
  };
  return [accepted, set];
}

/** Accepting moves the offer's card and archives every other active process. */
export function withAcceptedOffer(apps: Application[], accepted: string | null) {
  if (!accepted) return { apps, archived: [] as Application[] };
  const archived = apps.filter((app) => app.id !== accepted && ['applied', 'screen', 'onsite'].includes(app.stage));
  return {
    apps: apps.filter((app) => !archived.includes(app)).map((app) => (app.id === accepted ? { ...app, next: 'Accepted · contract review Mon 10:00' } : app)),
    archived
  };
}
