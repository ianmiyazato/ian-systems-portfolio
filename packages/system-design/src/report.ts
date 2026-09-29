/**
 * Synthetic data behind the morning report chart: revenue from São Paulo stores in 10-minute
 * buckets on a Monday, the normal range for a Monday (8-week baseline ± band) and today's line,
 * which falls 12% below normal from 14:00. Deterministic, so the sentence and the chart agree.
 */
export type ReportSeries = { times: string[]; normal: number[]; low: number[]; high: number[]; today: number[]; breakIndex: number };

const START_MIN = 8 * 60;
const STEP_MIN = 10;
const POINTS = 61; // 08:00 → 18:00
const BAND = 0.08;

const clock = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function reportSeries(): ReportSeries {
  const times: string[] = [];
  const normal: number[] = [];
  const today: number[] = [];
  const breakIndex = (14 * 60 - START_MIN) / STEP_MIN;
  for (let index = 0; index < POINTS; index += 1) {
    const minutes = START_MIN + index * STEP_MIN;
    const hour = minutes / 60;
    // A Monday in R$ thousands per 10 minutes: morning ramp, lunch peak, afternoon plateau.
    const value = 14 + 30 * Math.exp(-((hour - 12.6) ** 2) / (2 * 2.2 ** 2)) + 9 * Math.exp(-((hour - 17) ** 2) / (2 * 1.4 ** 2));
    const wobble = 1 + 0.025 * Math.sin(index * 1.7) * Math.cos(index * 0.6);
    const drop = index < breakIndex ? 1 : index === breakIndex ? 0.95 : 0.88 + 0.012 * Math.sin(index * 2.3);
    times.push(clock(minutes));
    normal.push(Math.round(value * 100) / 100);
    today.push(Math.round(value * wobble * drop * 100) / 100);
  }
  return { times, normal, low: normal.map((value) => value * (1 - BAND)), high: normal.map((value) => value * (1 + BAND)), today, breakIndex };
}
