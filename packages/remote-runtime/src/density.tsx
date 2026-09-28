import { useState } from 'preact/hooks';

export type Density = 'comfortable' | 'compact';

/** Per-remote density, remembered per viewer (a convenience, so localStorage is fine). */
export function useDensity(key: string): [Density, (density: Density) => void] {
  const storageKey = `density:${key}`;
  const [density, setDensity] = useState<Density>(() => {
    try { return localStorage.getItem(storageKey) === 'compact' ? 'compact' : 'comfortable'; } catch { return 'comfortable'; }
  });
  const set = (next: Density) => {
    setDensity(next);
    try { localStorage.setItem(storageKey, next); } catch { /* storage optional */ }
  };
  return [density, set];
}

export function DensityToggle({ value, onChange }: { value: Density; onChange: (density: Density) => void }) {
  return (
    <div class="density-toggle" role="group" aria-label="Row density" data-anchor="density-toggle">
      {(['comfortable', 'compact'] as const).map((option) => (
        <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)}>{option === 'comfortable' ? 'Comfortable' : 'Compact'}</button>
      ))}
    </div>
  );
}
