import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findJargon } from '@portfolio/story-diagram';
import { caseScreenById, caseSequence, cases, expectedLoss } from '../src/cases';
import { caseTalkSeconds, renderCaseScript } from '../src/call-script';
import { deck } from '../src/deck';
import { stories } from '../src/stories';

const mare = cases.mare;
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean).length;
// The only numbers the pages may state as facts (AGENTS.md §1).
const realMetrics = ['450 → ~200 ms', '1.8% → 0.5–0.7%', '99.5 → 99.9%', '2–3 h → 30–45 min'];

describe('Maré case', () => {
  it('runs hub → Black Friday → storefront as one presentation', () => {
    expect(caseSequence('mare').map((page) => page.href)).toEqual(['/system-design/mare', '/system-design/mare/black-friday', '/system-design/mare/storefront']);
    expect(mare.screens.map((screen) => screen.board)).toEqual(['SD-M0', 'SD-M1', 'SD-M2', 'SD-M3', 'SD-M4', 'SD-M5', 'SD-M6']);
    const bf = caseSequence('mare')[1]!;
    expect(bf.steps).toBe(stories['mare-black-friday'].steps.length + 4 + 4);
  });

  it('has one backend and one frontend problem, each with a page', () => {
    expect(mare.problems.map((problem) => [problem.id, problem.accent])).toEqual([['backend', 'a'], ['frontend', 'b']]);
    for (const problem of mare.problems) expect(caseSequence('mare').some((page) => page.href === problem.href)).toBe(true);
  });

  it('answers the five decision questions for both problems', () => {
    for (const side of ['backend', 'frontend'] as const) {
      const item = mare.decisions[side];
      expect(item.decision.length).toBeGreaterThan(20);
      expect(item.why.length).toBeGreaterThan(20);
      expect(item.changes.length).toBeGreaterThanOrEqual(3);
      expect(item.giveUp.length).toBeGreaterThanOrEqual(3);
      expect(item.wrong.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps every plain string on the page free of jargon', () => {
    const plain = [
      mare.title, mare.lede, ...mare.context.map((item) => item.text),
      ...mare.problems.flatMap((problem) => [problem.title, problem.question, ...problem.bullets]),
      ...mare.ladder.levels.flatMap((level) => [level.name, level.off, level.notice]),
      ...(['backend', 'frontend'] as const).flatMap((side) => { const d = mare.decisions[side]; return [d.decision, d.alternative, d.why, ...d.changes, ...d.giveUp, ...d.wrong]; }),
      ...mare.screens.flatMap((screen) => screen.steps.flatMap((step) => [step.title, step.caption ?? '', step.presenterNote]))
    ];
    for (const text of plain) expect(findJargon(text), text).toEqual([]);
  });

  it('gives every step a spoken note of 1–2 sentences and a timing', () => {
    for (const screen of mare.screens) for (const step of screen.steps) {
      expect(sentences(step.presenterNote), `${screen.id}: ${step.presenterNote}`).toBeLessThanOrEqual(2);
      expect(step.seconds).toBeGreaterThanOrEqual(15);
    }
    // A 15-minute slot: the case alone, with a little room for questions.
    expect(caseTalkSeconds('mare') / 60).toBeGreaterThanOrEqual(10);
    expect(caseTalkSeconds('mare') / 60).toBeLessThanOrEqual(15);
  });

  it('states only real metrics as facts and labels everything else illustrative', () => {
    expect(mare.metrics.map((metric) => metric.value)).toEqual(realMetrics);
    expect(mare.ladder.label).toBe('Illustrative triggers');
    expect(mare.worth.label).toBe('Illustrative inputs');
    expect(JSON.stringify(mare)).not.toContain('[value]');
  });

  it('never names a real company', () => {
    const text = JSON.stringify(mare) + JSON.stringify(stories['mare-black-friday']) + JSON.stringify(stories['mare-storefront']);
    for (const name of ['Netflix', 'Spotify', 'Amazon', 'AWS', 'Google', 'Stripe', 'Shopify', 'Vercel', 'Cloudflare']) expect(text).not.toContain(name);
  });

  it('keeps screen ids unique across the v0.3 deck and the cases', () => {
    const ids = [...deck.screens, ...mare.screens].map((screen) => screen.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(caseScreenById('mare-sf-demo')?.board).toBe('SD-M5');
  });
});

describe('is it worth it', () => {
  it('compares expected lost sales with the cost of readiness', () => {
    const { perMinute, minutes, without, cost } = mare.worth;
    const result = expectedLoss({ perMinute: perMinute.value, minutes: minutes.value, without: without.value, with: mare.worth.with, cost: cost.value });
    // 30% × 20 min × R$150,000 = R$900,000; 5% × 20 × 150,000 = R$150,000.
    expect(result).toEqual({ without: 900_000, with: 150_000, avoided: 750_000, cost: 400_000, worth: true });
  });

  it('says no when readiness costs more than it saves', () => {
    expect(expectedLoss({ perMinute: 50_000, minutes: 5, without: 10, with: 5, cost: 1_000_000 }).worth).toBe(false);
  });

  it('never lets readiness make things worse', () => {
    expect(expectedLoss({ perMinute: 100_000, minutes: 10, without: 5, with: 5, cost: 1 }).avoided).toBe(0);
  });
});

describe('Maré call script', () => {
  const file = resolve(__dirname, '../../../docs/CALL-SCRIPT-MARE.md');
  const script = renderCaseScript('mare');

  it('is generated from the presenter notes and up to date (WRITE_CALL_SCRIPT=1 rewrites it)', () => {
    if (process.env.WRITE_CALL_SCRIPT) writeFileSync(file, script);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe(script);
  });

  it('walks every screen and note, then the bridge', () => {
    for (const screen of mare.screens) for (const step of screen.steps) expect(script).toContain(step.presenterNote);
    expect(script).toContain('/system-design/mare?present=1');
    expect(script.indexOf(mare.bridge.points[0]!)).toBeGreaterThan(script.indexOf(mare.screens.at(-1)!.steps.at(-1)!.presenterNote));
  });
});
