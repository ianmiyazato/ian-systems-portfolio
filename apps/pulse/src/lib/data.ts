import { SimulatedProvider, type Chunk } from '@portfolio/ai-sim';
import { series } from '@portfolio/mocks';
import type { Lang } from './i18n.svelte';

export const markets = [
  { id: 'LA', zone: 'America/Los_Angeles', color: 'accent' },
  { id: 'Seoul', zone: 'Asia/Seoul', color: 'ai' },
  { id: 'Tokyo', zone: 'Asia/Tokyo', color: 'warn' }
] as const;

/** 24 hourly completion-rate points per market; Seoul lifts at the chorus moment (hour 14). */
export const completion = {
  LA: series(101, 24, 38, 2.2, 0.15),
  Seoul: series(202, 24, 36, 2.4, 0.1).map((value, hour) => (hour >= 14 ? value + 12 + (hour - 14) * 0.8 : value)),
  Tokyo: series(303, 24, 35, 2, 0.2).map((value, hour) => (hour >= 17 ? value + 6 : value))
};
export const MOMENT_HOUR = 14;

export const talent = [
  { rank: 1, name: 'AERA', local: '에아라 · エアラ', platforms: 7, momentum: 24, markets: 'Seoul · Tokyo · LA' },
  { rank: 2, name: 'NAMI', local: '나미 · ナミ', platforms: 6, momentum: 11, markets: 'Tokyo · Seoul' },
  { rank: 3, name: 'Lumen', local: '루멘 · ルーメン', platforms: 5, momentum: 8, markets: 'LA' },
  { rank: 4, name: 'SORA-9', local: '소라9 · ソラ9', platforms: 6, momentum: 5, markets: 'Tokyo' },
  { rank: 5, name: 'Velvet Coast', local: '벨벳 코스트 · ベルベット・コースト', platforms: 4, momentum: -3, markets: 'LA · Seoul' }
];

export const corpus: Chunk[] = [
  { id: 'seoul-chorus', text: 'Seoul short-form completion rose 24% after the AERA Tidal chorus clip (00:42-00:57) started trending at 22:10 KST.', score: 0, source: 'market signal · Seoul · 22:10' },
  { id: 'la-lag', text: 'LA audiences typically adopt Seoul-originated clips 9 to 14 hours later when fan pages repost with English captions.', score: 0, source: 'cross-market lag study · 90d' },
  { id: 'tokyo-bridge', text: 'Tokyo completion favors the bridge (01:18) over the chorus; JP fan pages cut longer clips.', score: 0, source: 'market signal · Tokyo' },
  { id: 'entity-merge', text: 'AERA, 에아라 and エアラ resolve to one canonical artist across seven platform identities.', score: 0, source: 'entity resolution · v12' },
  { id: 'posting-window', text: 'Engagement peaks at 19:00-22:00 local time in all three markets on weekdays.', score: 0, source: 'posting windows · 30d' },
  { id: 'caption-lang', text: 'Clips with native-language captions retain 31% more viewers past 3 seconds in Seoul and Tokyo.', score: 0, source: 'caption experiment · Aug' }
];

const localized: Record<Lang, [string, string]> = {
  EN: ['Why is Seoul moving before LA?', 'Which moment should we cut for Tokyo?'],
  KR: ['왜 서울이 LA보다 먼저 움직이나요?', '도쿄에는 어떤 모먼트를 잘라야 하나요?'],
  JP: ['なぜソウルがLAより先に動いているの?', '東京向けにはどのモーメントを切り出すべき?']
};
export const questionsFor = (lang: Lang) => localized[lang];
export const questions = localized.EN;

const answers: Record<Lang, Record<string, string>> = {
  EN: {
    [localized.EN[0]]: 'Seoul moved first because the AERA chorus clip started trending there at 22:10 KST [1]. LA usually follows 9–14 hours later, once fan pages repost with English captions [2]. Scheduling the LA post for 19:00 PT catches that wave instead of chasing it.',
    [localized.EN[1]]: 'Cut the bridge at 01:18 for Tokyo: JP completion favors it over the chorus [1], and native captions keep 31% more viewers past three seconds [2].'
  },
  KR: {
    [localized.KR[0]]: '에아라의 코러스 클립이 22:10 KST에 서울에서 먼저 트렌딩되었습니다 [1]. LA는 팬 페이지가 영어 자막으로 재게시한 뒤 보통 9–14시간 후에 따라옵니다 [2]. LA 게시를 태평양 시간 19:00으로 잡으면 그 흐름을 탈 수 있습니다.',
    [localized.KR[1]]: '도쿄에는 01:18의 브리지를 자르세요. 일본 완주율은 코러스보다 브리지가 높고 [1], 현지어 자막은 3초 이후 시청자를 31% 더 유지합니다 [2].'
  },
  JP: {
    [localized.JP[0]]: 'エアラのサビのクリップがソウルで22:10 KSTにトレンド入りしました [1]。LAはファンページが英語字幕で再投稿した後、通常9〜14時間遅れて追随します [2]。LAの投稿を太平洋時間19:00に設定すると、その波に乗れます。',
    [localized.JP[1]]: '東京向けには01:18のブリッジを切り出してください。日本ではサビよりブリッジの完了率が高く [1]、現地語字幕は3秒以降の視聴者を31%多く維持します [2]。'
  }
};

export const providerFor = (lang: Lang) => new SimulatedProvider(corpus, answers[lang]);

export const pages = [
  { handle: '@aera.daily', market: 'Seoul', lang: 'KR', fit: 0.94, followers: 1_280_000 },
  { handle: '@tidal_edits', market: 'Tokyo', lang: 'JP', fit: 0.88, followers: 640_000 },
  { handle: '@kwave.la', market: 'LA', lang: 'EN', fit: 0.83, followers: 910_000 },
  { handle: '@choruscuts', market: 'Seoul', lang: 'KR', fit: 0.79, followers: 420_000 },
  { handle: '@nightdrive.jp', market: 'Tokyo', lang: 'JP', fit: 0.71, followers: 310_000 },
  { handle: '@popradar.us', market: 'LA', lang: 'EN', fit: 0.64, followers: 1_050_000 }
];

export const feed = [
  { id: 'post-seoul-1', market: 'Seoul', text: '@aera.daily posted the chorus cut · KR captions', score: 0.91 },
  { id: 'post-tokyo-1', market: 'Tokyo', text: '@tidal_edits scheduled the bridge cut · 20:00 JST', score: 0.86 },
  { id: 'post-la-1', market: 'LA', text: '@kwave.la draft ready · EN captions · 19:00 PT', score: 0.82 },
  { id: 'post-seoul-2', market: 'Seoul', text: '@choruscuts reposted · 18k views in 20 min', score: 0.78 }
];

export const runs = [
  { model: 'base-8b', faithfulness: 0.87, citations: 0.9, relevance: 0.89, latency: 820, cost: 0.42 },
  { model: 'ft-analyst-v2', faithfulness: 0.94, citations: 0.98, relevance: 0.92, latency: 610, cost: 0.31 }
];

export const failuresToReview = [
  { id: 'eval-17', reason: 'Placed the Tokyo peak in PT instead of JST', metric: 'faithfulness 0.62' },
  { id: 'eval-29', reason: 'Answer cited a chunk that was reranked out', metric: 'citations 0.50' },
  { id: 'eval-33', reason: 'Merged two different artists named Sora', metric: 'relevance 0.71' }
];
