export type Lang = 'EN' | 'KR' | 'JP';

const dict = {
  intelligence: { EN: 'Intelligence', KR: '인텔리전스', JP: 'インテリジェンス' },
  distribution: { EN: 'Distribution', KR: '배포', JP: 'ディストリビューション' },
  harness: { EN: 'AI harness', KR: 'AI 하네스', JP: 'AIハーネス' },
  headline: { EN: 'Performance intelligence', KR: '퍼포먼스 인텔리전스', JP: 'パフォーマンス・インテリジェンス' },
  sub: { EN: 'Market signals, distribution and the model release share one evidence trail across LA, Seoul and Tokyo.', KR: 'LA·서울·도쿄의 시장 신호, 배포, 모델 릴리스가 하나의 근거 흐름을 공유합니다.', JP: 'LA・ソウル・東京の市場シグナル、配信、モデルリリースが一つのエビデンスでつながります。' },
  reach: { EN: 'Cross-market reach', KR: '교차 시장 도달', JP: 'クロスマーケット到達' },
  moment: { EN: 'Moment score', KR: '모먼트 점수', JP: 'モーメントスコア' },
  pages: { EN: 'Matched pages', KR: '매칭된 페이지', JP: 'マッチしたページ' },
  gate: { EN: 'Eval gate', KR: '평가 게이트', JP: '評価ゲート' },
  pass: { EN: 'Pass', KR: '통과', JP: '合格' },
  chart: { EN: 'Completion rate · 24 h · short-form', KR: '완주율 · 24시간 · 숏폼', JP: '完了率 · 24時間 · ショート動画' },
  leaderboard: { EN: 'Merged talent leaderboard', KR: '통합 아티스트 리더보드', JP: '統合タレントランキング' },
  ask: { EN: 'Ask Pulse', KR: 'Pulse에게 질문', JP: 'Pulseに質問' },
  askPlaceholder: { EN: 'Ask about a market, artist or moment…', KR: '시장, 아티스트, 모먼트에 대해 질문하세요…', JP: '市場・アーティスト・モーメントについて質問…' },
  send: { EN: 'Ask', KR: '질문', JP: '質問' },
  trace: { EN: 'Show trace', KR: '트레이스 보기', JP: 'トレースを見る' },
  detected: { EN: 'Moment detected', KR: '모먼트 감지', JP: 'モーメント検出' },
  build: { EN: 'Build campaign', KR: '캠페인 만들기', JP: 'キャンペーン作成' },
  schedule: { EN: 'Schedule · drag slots between time zones', KR: '스케줄 · 시간대 사이로 슬롯을 드래그', JP: 'スケジュール · スロットをタイムゾーン間でドラッグ' },
  matched: { EN: 'Matched pages', KR: '매칭된 페이지', JP: 'マッチしたページ' },
  projected: { EN: 'Projected reach', KR: '예상 도달', JP: '予測リーチ' },
  feed: { EN: 'Live posting feed', KR: '실시간 게시 피드', JP: 'ライブ投稿フィード' },
  pipeline: { EN: 'RAG trace', KR: 'RAG 트레이스', JP: 'RAGトレース' },
  chunks: { EN: 'Top 5 retrieved chunks', KR: '상위 5개 검색 청크', JP: '上位5件の検索チャンク' },
  runs: { EN: 'Run comparison', KR: '실행 비교', JP: '実行比較' },
  running: { EN: 'Running eval', KR: '평가 실행 중', JP: '評価実行中' },
  finetune: { EN: 'Fine-tuning', KR: '파인튜닝', JP: 'ファインチューニング' },
  failures: { EN: 'Failures to review', KR: '검토할 실패', JP: 'レビュー対象の失敗' }
} as const;

export type Key = keyof typeof dict;

class I18n {
  lang = $state<Lang>('EN');
  t = (key: Key) => dict[key][this.lang];
  set(next: Lang) {
    this.lang = next;
    document.documentElement.lang = next === 'KR' ? 'ko' : next === 'JP' ? 'ja' : 'en';
    try { localStorage.setItem('pulse-lang', next); } catch { /* storage optional */ }
    const url = new URL(location.href);
    if (next === 'EN') url.searchParams.delete('lang'); else url.searchParams.set('lang', next);
    history.replaceState(history.state, '', url);
    if (next !== 'EN') void import('@portfolio/tokens/fonts/pulse-cjk');
  }
  init() {
    const fromUrl = new URLSearchParams(location.search).get('lang');
    let stored: string | null = null;
    try { stored = localStorage.getItem('pulse-lang'); } catch { /* storage optional */ }
    const next = (fromUrl ?? stored ?? 'EN').toUpperCase();
    if (next === 'KR' || next === 'JP') this.set(next);
  }
}

export const i18n = new I18n();
