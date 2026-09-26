create extension if not exists pgcrypto;

create table public.orders (
  id text primary key,
  lane text not null check (lane in ('pickup', 'delivery', 'ready', 'handed-over')),
  customer_alias text not null,
  item_count integer not null check (item_count > 0),
  status text not null,
  cutoff_at timestamptz not null,
  synthetic boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.campaign_posts (
  id text primary key,
  market text not null,
  language text not null check (language in ('EN', 'KR', 'JP')),
  artist text not null,
  moment text not null,
  score numeric(4, 2) not null check (score between 0 and 1),
  published_at timestamptz not null
);

create table public.eval_runs (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  scenario text not null,
  faithfulness numeric(4, 2) not null check (faithfulness between 0 and 1),
  citations numeric(4, 2) not null check (citations between 0 and 1),
  relevance numeric(4, 2) not null check (relevance between 0 and 1),
  status text not null check (status in ('pass', 'fail', 'review')),
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.integration_events (
  id uuid primary key default gen_random_uuid(),
  partner text not null,
  event_type text not null,
  status text not null check (status in ('healthy', 'degraded', 'dlq', 'replayed')),
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.events enable row level security;
alter table public.campaign_posts enable row level security;
alter table public.eval_runs enable row level security;
alter table public.integration_events enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.orders, public.events, public.campaign_posts, public.eval_runs, public.integration_events to anon, authenticated;

create policy "Synthetic orders are publicly readable"
  on public.orders for select to anon, authenticated using (synthetic = true);
create policy "Synthetic events are publicly readable"
  on public.events for select to anon, authenticated using (true);
create policy "Synthetic campaign posts are publicly readable"
  on public.campaign_posts for select to anon, authenticated using (true);
create policy "Synthetic eval runs are publicly readable"
  on public.eval_runs for select to anon, authenticated using (true);
create policy "Synthetic integration events are publicly readable"
  on public.integration_events for select to anon, authenticated using (true);

insert into public.orders (id, lane, customer_alias, item_count, status, cutoff_at, created_at) values
  ('MR-904117', 'pickup', 'Rafael', 2, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T18:24:00Z'),
  ('MR-904112', 'delivery', 'Luiza', 4, 'picking', '2026-09-26T20:00:00Z', '2026-09-26T18:18:00Z'),
  ('MR-904103', 'ready', 'Caio', 1, 'ready', '2026-09-26T21:00:00Z', '2026-09-26T18:02:00Z'),
  ('MR-904096', 'handed-over', 'Marina', 3, 'complete', '2026-09-26T19:00:00Z', '2026-09-26T17:41:00Z');

insert into public.events (id, topic, kind, payload, occurred_at) values
  ('20000000-0000-4000-8000-000000000001', 'balcao-order-lanes', 'order.moved', '{"order_id":"MR-904112","from":"to-pick","to":"picking"}', '2026-09-26T18:22:00Z'),
  ('20000000-0000-4000-8000-000000000002', 'mesh-log-stream', 'partner.degraded', '{"partner":"Ligeiro Log","p95_ms":884}', '2026-09-26T18:23:00Z'),
  ('20000000-0000-4000-8000-000000000003', 'pulse-posting-feed', 'campaign.published', '{"market":"Seoul","artist":"AERA"}', '2026-09-26T18:25:00Z');

insert into public.campaign_posts (id, market, language, artist, moment, score, published_at) values
  ('POST-SEOUL-001', 'Seoul', 'KR', 'AERA', 'chorus lift · 00:42', 0.91, '2026-09-26T18:20:00Z'),
  ('POST-TOKYO-001', 'Tokyo', 'JP', 'NAMI', 'bridge replay · 01:18', 0.86, '2026-09-26T18:21:00Z'),
  ('POST-LA-001', 'LA', 'EN', 'Lumen', 'hook share · 00:19', 0.82, '2026-09-26T18:22:00Z');

insert into public.eval_runs (id, model, scenario, faithfulness, citations, relevance, status, sources, created_at) values
  ('30000000-0000-4000-8000-000000000001', 'ft-analyst-v2', 'moment-detection', 0.94, 0.98, 0.92, 'pass', '["signal snapshot", "entity graph", "campaign policy"]', '2026-09-26T18:26:00Z');

insert into public.integration_events (id, partner, event_type, status, idempotency_key, payload, occurred_at) values
  ('40000000-0000-4000-8000-000000000001', 'Ligeiro Log', 'tracking.updated', 'degraded', 'demo-ligeiro-0001', '{"raw_status":"X9","suggested_mapping":"delivery_exception"}', '2026-09-26T18:23:00Z'),
  ('40000000-0000-4000-8000-000000000002', 'Rota Sul', 'invoice.accepted', 'healthy', 'demo-rota-0001', '{"invoice":"MR-904117","attempt":1}', '2026-09-26T18:24:00Z');

comment on table public.orders is 'Deterministic synthetic portfolio data. No real customer information.';
comment on table public.events is 'Deterministic synthetic portfolio event history.';
comment on table public.campaign_posts is 'Deterministic synthetic Pulse campaign posts.';
comment on table public.eval_runs is 'Deterministic simulated-AI evaluation results.';
comment on table public.integration_events is 'Deterministic synthetic integration events.';
