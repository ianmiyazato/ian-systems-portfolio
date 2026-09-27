// The registry lives in @portfolio/routes (routes.manifest.ts); chrome re-exports it so every
// zone that already imports @portfolio/chrome gets the same source of truth.
export * from '@portfolio/routes';
