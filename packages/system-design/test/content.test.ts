import { describe, expect, it } from 'vitest';
import { findJargon, lintPlain, renderDiagram } from '@portfolio/story-diagram';
import { deck, presentationSequence, screensOn } from '../src/deck';
import { stories } from '../src/stories';

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;
const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean).length;

describe('stories', () => {
  for (const [id, diagram] of Object.entries(stories)) {
    it(`${id} validates, passes the plain-language lint and renders`, () => {
      expect(lintPlain(diagram)).toEqual([]);
      expect(() => renderDiagram(diagram)).not.toThrow();
    });
  }

  it('Problem A follows the five approved steps', () => {
    expect(stories['metrics-flow'].steps.map((step) => step.title)).toEqual(['A file arrives', 'We check it', 'We store it', 'We compare to normal', 'We explain it']);
    expect(stories['metrics-flow'].accent).toBe('a');
  });

  it('Problem B follows the four approved steps', () => {
    expect(stories['personal-flow'].steps.map((step) => step.title)).toEqual(['Signals', 'Your taste', 'Only what you can get', 'Try it on']);
    expect(stories['personal-flow'].accent).toBe('b');
  });

  it('plain captions average 12–20 words', () => {
    const captions = [stories['metrics-flow'], stories['personal-flow']].flatMap((diagram) => diagram.steps.map((step) => step.caption));
    const average = captions.reduce((sum, caption) => sum + words(caption), 0) / captions.length;
    expect(average).toBeGreaterThanOrEqual(12);
    expect(average).toBeLessThanOrEqual(20);
  });
});

describe('deck', () => {
  it('plays the eight approved screens in order', () => {
    expect(deck.screens.map((screen) => screen.board)).toEqual(['SD-00', 'SD-A1', 'SD-A2', 'SD-A3', 'SD-B1', 'SD-B2', 'SD-B3', 'SD-99']);
    expect(presentationSequence().map((page) => page.href)).toEqual([
      '/system-design',
      '/system-design/metrics-to-decisions',
      '/system-design/metrics-to-decisions/build-or-buy',
      '/system-design/personal-and-instant',
      '/system-design/personal-and-instant/build-or-buy',
      '/system-design/build-vs-buy'
    ]);
  });

  it('counts a page as the sum of its screens', () => {
    expect(screensOn('/system-design/metrics-to-decisions').map((screen) => screen.id)).toEqual(['a-flow', 'a-report']);
    const page = presentationSequence().find((item) => item.href === '/system-design/metrics-to-decisions')!;
    expect(page.steps).toBe(stories['metrics-flow'].steps.length + deck.screens.find((screen) => screen.id === 'a-report')!.steps.length);
  });

  it('gives every step a title, a spoken note of 1–2 sentences and a timing', () => {
    for (const screen of deck.screens) {
      expect(screen.steps.length, screen.id).toBeGreaterThan(0);
      for (const step of screen.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(sentences(step.presenterNote), `${screen.id}: ${step.presenterNote}`).toBeLessThanOrEqual(2);
        expect(step.seconds).toBeGreaterThanOrEqual(15);
      }
    }
  });

  it('keeps presenter notes and plain captions free of jargon', () => {
    for (const screen of deck.screens) for (const step of screen.steps) {
      expect(findJargon(step.presenterNote), `${screen.id} · ${step.title}`).toEqual([]);
      expect(findJargon(step.caption ?? ''), `${screen.id} · ${step.title}`).toEqual([]);
    }
  });

  it('fits a 15–20 minute call with room for questions', () => {
    const seconds = deck.screens.flatMap((screen) => screen.steps).reduce((sum, step) => sum + step.seconds, 0) + deck.bridge.seconds;
    expect(seconds / 60).toBeGreaterThanOrEqual(12);
    expect(seconds / 60).toBeLessThanOrEqual(16);
  });

  it('marks every timing and volume as an illustrative target', () => {
    expect(deck.chips.label).toBe('Illustrative targets');
    expect(deck.chips.items.map((chip) => chip.text)).toEqual(['1,440 files a day, per system', '< 2 min from a problem to an alert', '1 page morning report', '0 numbers written by the AI itself']);
    expect(deck.race.label).toBe('Illustrative targets');
  });

  it('never names a real company in the talk track', () => {
    const text = JSON.stringify(deck);
    for (const name of ['ORIGIN', 'Origin', 'Netflix', 'Spotify', 'Amazon', 'Google', 'Stripe']) expect(text).not.toContain(name);
  });
});
