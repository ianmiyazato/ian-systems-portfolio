import { AiSurface, Banner, Layer, LiveControl, Tween, closeLayers, openLayer, useDemoState, useLocation, useSimNow, useWorldEvents } from '@portfolio/remote-runtime';
import { brl, brlCompact, catalogBySku, garmentPaths, seedOf } from '@portfolio/mocks';
import { DEFAULT_START } from '@portfolio/world';
import { useState } from 'preact/hooks';
import { codedCreator, roster } from './roster';

type Post = { id: string; type: 'Reel' | 'Story' | 'Post'; creator: string; sku: string; views: number; sales: number; hook: string };

/** The drop's best posts so far; views keep rolling while the page is open. */
const posts: Post[] = [
  { id: 'P-301', type: 'Reel', creator: 'NINA10', sku: 'MR-18511', views: 182_400, sales: 41, hook: 'Try-on, 3 ways' },
  { id: 'P-298', type: 'Reel', creator: 'MARI15', sku: 'MR-18285', views: 146_900, sales: 33, hook: 'Pleats in the wind' },
  { id: 'P-296', type: 'Story', creator: 'DUDA10', sku: 'MR-18401', views: 58_300, sales: 18, hook: 'Code reminder · 20:00' },
  { id: 'P-293', type: 'Post', creator: 'JOAO12', sku: 'MR-18455', views: 61_200, sales: 12, hook: 'Street fit, beach day' },
  { id: 'P-291', type: 'Reel', creator: 'BIA10', sku: 'MR-18256', views: 94_700, sales: 21, hook: 'Sun hat, 3 faces' },
  { id: 'P-288', type: 'Story', creator: 'TOMAS8', sku: 'MR-18111', views: 22_800, sales: 4, hook: 'Unboxing' },
  { id: 'P-284', type: 'Post', creator: 'THEO10', sku: 'MR-18140', views: 31_500, sales: 6, hook: 'Scarf knots' },
  { id: 'P-280', type: 'Reel', creator: 'ANAK10', sku: 'MR-17921', views: 77_100, sales: 15, hook: 'What fits in the tote' }
];

const DAY = 86_400_000;
const launch = DEFAULT_START - 3 * DAY - 7 * 3600_000;
const length = 14;

export function Campaigns() {
  const state = useDemoState();
  const { params } = useLocation();
  const now = useSimNow(1000);
  const scheduled = state === 'scheduled';
  const [sales, setSales] = useState<Record<string, number>>({});
  const [lastSale, setLastSale] = useState<string | null>(null);

  // Coded orders land on the creator's newest post in the drop.
  useWorldEvents(['orders.placed'], (event) => {
    const creator = codedCreator(event.payload.orderId);
    const post = creator && posts.find((item) => item.creator === creator.code);
    if (!post) return;
    setSales((current) => ({ ...current, [post.id]: (current[post.id] ?? 0) + 1 }));
    setLastSale(post.id);
  });

  // Views roll with the sim clock: each post gains views at its own steady rate.
  const elapsed = Math.max(0, (now - DEFAULT_START) / 1000);
  const live = posts.map((post) => ({ ...post, views: Math.round(post.views + elapsed * ((seedOf(post.id) % 7) + 2) * (post.type === 'Reel' ? 1.6 : 0.6)), sales: post.sales + (sales[post.id] ?? 0) }));
  const views = live.reduce((sum, post) => sum + post.views, 2_014_000);
  const coded = live.reduce((sum, post) => sum + post.sales, 1_120);
  const day = Math.min(length, Math.floor((now - launch) / DAY) + 1);
  const selected = params.get('drawer') === 'post' ? live.find((post) => post.id === params.get('post')) : undefined;

  return (
    <main class="cc-main" id="circle-campaigns">
      <section class="cc-campaign-head" data-anchor="cc-campaign-head">
        <span class="cc-sticker big" aria-hidden="true">{scheduled ? 'starts Oct 1 ✺' : 'live ✺'}</span>
        <h1>Summer swim drop</h1>
        <ul class="cc-campaign-meta">
          <li class={scheduled ? '' : 'live'}>{scheduled ? 'Scheduled · starts Oct 1' : `Live · day ${day} of ${length}`}</li>
          <li>38 creators</li>
          <li>10% commission</li>
          <li>code suffix SWIM</li>
        </ul>
        <div class="cc-days" aria-hidden="true">{Array.from({ length }, (_, index) => <i key={index} class={!scheduled && index < day ? 'done' : ''} style={{ '--i': index }} />)}</div>
        <LiveControl anchor="cc-campaign-live" />
      </section>

      {scheduled ? (
        <section class="cc-first" data-anchor="cc-campaign-scheduled">
          <span class="cc-avatar ring" style={{ '--hue': 1 }}>38</span>
          <div>
            <strong>Briefed and ready · 31 of 38 creators confirmed</strong>
            <p>Codes activate at 08:00 on Oct 1. Posts appear here as creators publish them, with views and coded sales updating live.</p>
            <button type="button" class="cc-btn primary">Nudge the 7 who haven't confirmed</button>
          </div>
        </section>
      ) : (
        <>
          <div class="cc-tiles row" data-anchor="cc-campaign-kpis">
            <div><span>Views</span><strong><Tween value={views} format={(value) => `${(value / 1_000_000).toFixed(2)}M`} /></strong><small>across {live.length * 19} posts</small></div>
            <div><span>Coded sales</span><strong><Tween value={coded} /></strong><small>{lastSale ? `latest on ${lastSale}` : 'orders with a SWIM code'}</small></div>
            <div><span>Conversion</span><strong>{((coded / (views * 0.012)) * 100).toFixed(1)}%</strong><small>orders per link click</small></div>
            <div><span>Commission accrued</span><strong>{brlCompact(coded * 289 * 0.1)}</strong><small>confirms after 30 days</small></div>
          </div>

          <div class="cc-campaign-grid">
            <section class="cc-posts" aria-labelledby="posts-title" data-anchor="cc-post-grid">
              <header><h2 id="posts-title">Posts in the drop</h2><span>sorted by coded sales</span></header>
              <div class="cc-post-list">
                {[...live].sort((a, b) => b.sales - a.sales).map((post, index) => {
                  const creator = roster.find((item) => item.code === post.creator)!;
                  const item = catalogBySku(post.sku)!;
                  return (
                    <button type="button" key={post.id} class={`cc-post ${post.type.toLowerCase()} ${lastSale === post.id ? 'is-bumped' : ''}`} style={{ '--i': index }} onClick={() => openLayer({ drawer: 'post', post: post.id })} aria-label={`${post.type} by ${creator.name}: ${post.hook}, ${post.views} views, ${post.sales} sales`}>
                      <span class="cc-post-art" data-swatch={item.swatch} aria-hidden="true"><svg viewBox="0 0 240 230"><path d={garmentPaths[item.garment]} /></svg></span>
                      <span class={`cc-type ${post.type.toLowerCase()}`}>{post.type}</span>
                      <span class="cc-avatar ring small" style={{ '--hue': creator.hue }}>{creator.initials}</span>
                      <span class="cc-tag">{item.name} · {brl(item.price)}</span>
                      <span class="cc-scrim">
                        <b>{post.hook}</b>
                        <small><Tween value={post.views} format={(value) => `${Math.round(value / 100) / 10}k views`} /> · {post.sales} sales</small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <AiSurface title="What's working" meta="content model · 0.83" anchor="cc-whats-working" className="cc-ai"
              sources={[{ label: 'post analytics · this drop', score: 0.92 }, { label: 'coded orders · live', score: 0.95 }, { label: 'past drops · 6', score: 0.8 }]}>
              <p>Reels with a try-on in the first 2 seconds convert <b>2.3×</b> better than stories. Posts before the 20:00 peak get 40% more views.</p>
              <ul class="cc-next">
                <li><span class="cc-avatar small" style={{ '--hue': 0 }}>NC</span><div><b>Nina</b> · pin the try-on reel and add the SWIM code to the first frame</div><button type="button" class="cc-btn">Send brief</button></li>
                <li><span class="cc-avatar small" style={{ '--hue': 3 }}>TR</span><div><b>Tomas</b> · unboxing stories underperform; suggest a reel before 20:00</div><button type="button" class="cc-btn">Send brief</button></li>
                <li><span class="cc-avatar small" style={{ '--hue': 3 }}>TL</span><div><b>Theo</b> · scarf posts sell to his Curitiba audience; add a second look</div><button type="button" class="cc-btn">Send brief</button></li>
              </ul>
            </AiSurface>
          </div>
        </>
      )}
      {state === 'error' && <Banner tone="risk" icon="!" title="Social analytics delayed · views as of 15:40" anchor="cc-campaign-error">Coded sales are unaffected; they come from orders, not the social network.</Banner>}

      {selected && <PostDrawer post={selected} />}
    </main>
  );
}

function PostDrawer({ post }: { post: Post }) {
  const creator = roster.find((item) => item.code === post.creator)!;
  const item = catalogBySku(post.sku)!;
  const [boosted, setBoosted] = useState(false);
  return (
    <Layer kind="drawer" title={post.hook} eyebrow={`${post.type} · ${creator.name} · ${post.id}`} onClose={() => closeLayers(['drawer', 'post'])} width={480} anchor="cc-post-drawer"
      footer={<><button type="button" class="cc-btn">Send brief</button><button type="button" class="cc-btn primary" disabled={boosted} onClick={() => setBoosted(true)}>{boosted ? 'Boost scheduled' : 'Boost · 12% for 48 h'}</button></>}>
      <div class="cc-post-art big" data-swatch={item.swatch} aria-hidden="true"><svg viewBox="0 0 240 230"><path d={garmentPaths[item.garment]} /></svg></div>
      <div class="cc-drawer-stats">
        <div><span>Views</span><strong>{Math.round(post.views / 1000)}k</strong></div>
        <div><span>Coded sales</span><strong>{post.sales}</strong></div>
        <div><span>Product</span><strong>{brl(item.price)}</strong></div>
      </div>
      {boosted && <Banner tone="success" icon="✓" title="Boost scheduled · 12% commission until Monday 16:18">Only orders from this post's code get the higher rate; the rule builder shows it as a time-boxed rule.</Banner>}
      <p class="cc-note">Tagged product: {item.name} · {item.colorName}. Views come from the social network's API; sales come from Maré orders with the code, so they never double-count.</p>
    </Layer>
  );
}
