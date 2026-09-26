import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderSeed } from './seed';

const file = resolve(__dirname, '../../../supabase/seed.sql');

describe('supabase seed', () => {
  it('is generated from the mocks and up to date', () => {
    if (process.env.WRITE_SEED) writeFileSync(file, renderSeed());
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file, 'utf8')).toBe(renderSeed());
  });

  it('includes the artboard orders', () => {
    expect(renderSeed()).toContain("'MR-904117'");
    expect(renderSeed()).toContain("'MR-904112'");
  });
});
