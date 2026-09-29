import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deck } from '../src/deck';
import { renderCallScript, talkSeconds } from '../src/call-script';

const file = resolve(__dirname, '../../../docs/CALL-SCRIPT-SYSTEM-DESIGN.md');

describe('call script', () => {
  const script = renderCallScript();

  it('is generated from the presenter notes and up to date (WRITE_CALL_SCRIPT=1 rewrites it)', () => {
    if (process.env.WRITE_CALL_SCRIPT) writeFileSync(file, script);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe(script);
  });

  it('walks all eight screens and every presenter note, with timings', () => {
    for (const screen of deck.screens) {
      expect(script).toContain(screen.title);
      for (const step of screen.steps) expect(script).toContain(step.presenterNote);
    }
    expect(script).toMatch(/\| 00:00 \|/);
  });

  it('fits a 15–20 minute call and closes with the bridge', () => {
    const minutes = talkSeconds() / 60;
    expect(minutes).toBeGreaterThanOrEqual(12);
    expect(minutes).toBeLessThanOrEqual(16);
    for (const point of deck.bridge.points) expect(script).toContain(point);
    expect(script.indexOf(deck.bridge.points[0]!)).toBeGreaterThan(script.indexOf(deck.screens.at(-1)!.steps.at(-1)!.presenterNote));
  });

  it('opens with the presentation link and the keys', () => {
    expect(script).toContain('/system-design?present=1');
    for (const key of ['→', '←', 'N', 'E', 'P', 'F']) expect(script).toContain(key);
  });
});
