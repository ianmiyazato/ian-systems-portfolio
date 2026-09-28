import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { easings, themeMotion } from './index';

const themes = JSON.parse(readFileSync(new URL('../../tokens/src/themes.json', import.meta.url), 'utf8')) as Record<string, { motion: Record<string, string> }>;
const css = readFileSync(new URL('./motion.css', import.meta.url), 'utf8');

describe('motion personalities', () => {
  it('covers every theme, and themes.json follows the motion package', () => {
    expect(Object.keys(themeMotion).sort()).toEqual(Object.keys(themes).sort());
    for (const [theme, motion] of Object.entries(themeMotion)) {
      expect(themes[theme]!.motion, theme).toEqual({ ...motion });
    }
  });

  it('defines an entrance keyframe for every personality and only animates transform and opacity', () => {
    for (const personality of Object.keys(easings)) expect(css).toContain(`@keyframes m-${personality}`);
    const properties = [...css.matchAll(/@keyframes[^{]+\{([\s\S]*?\})\s*\}/g)].flatMap((match) => [...match[1]!.matchAll(/([a-z-]+)\s*:/g)].map((property) => property[1]));
    expect(new Set(properties)).toEqual(new Set(['opacity', 'transform']));
  });

  it('turns motion off under prefers-reduced-motion', () => {
    expect(css).toMatch(/prefers-reduced-motion: reduce[\s\S]*@view-transition \{ navigation: none; \}/);
  });
});
