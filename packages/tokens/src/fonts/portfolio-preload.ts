import bricolageLatin from '@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2?url';
import geistLatin from '@fontsource-variable/geist/files/geist-latin-wght-normal.woff2?url';
import geistMonoLatin from '@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2?url';

/** Latin subsets of the portfolio faces, preloaded so headlines and diagrams paint once, in their final font. */
export const portfolioFontPreloads = [bricolageLatin, geistLatin, geistMonoLatin] as const;
