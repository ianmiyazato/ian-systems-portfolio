-- Generated from @portfolio/mocks (counterBoard + liveOrder 1-6). Regenerate: WRITE_SEED=1 pnpm --filter @portfolio/mocks test
insert into public.orders (id, lane, customer_alias, item_count, status, cutoff_at, created_at) values
  ('MR-904121', 'delivery', 'Nina', 2, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T18:30:00.000Z'),
  ('MR-904120', 'pickup', 'Otávio', 1, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T18:27:00.000Z'),
  ('MR-904124', 'delivery', 'Helena', 3, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T18:24:00.000Z'),
  ('MR-904117', 'pickup', 'Rafael', 3, 'picking', '2026-09-26T20:00:00Z', '2026-09-26T18:21:00.000Z'),
  ('MR-904115', 'delivery', 'Luiza', 4, 'picking', '2026-09-26T20:00:00Z', '2026-09-26T18:18:00.000Z'),
  ('MR-904112', 'ready', 'Rafael M.', 2, 'ready', '2026-09-26T20:00:00Z', '2026-09-26T18:15:00.000Z'),
  ('MR-904103', 'ready', 'Caio', 1, 'ready', '2026-09-26T20:00:00Z', '2026-09-26T18:12:00.000Z'),
  ('MR-904096', 'handed-over', 'Marina', 2, 'handed-over', '2026-09-26T20:00:00Z', '2026-09-26T18:09:00.000Z'),
  ('MR-904090', 'handed-over', 'Diego', 1, 'handed-over', '2026-09-26T20:00:00Z', '2026-09-26T18:06:00.000Z'),
  ('MR-904201', 'pickup', 'Lara', 3, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T18:03:00.000Z'),
  ('MR-904202', 'pickup', 'Otávio', 3, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T18:00:00.000Z'),
  ('MR-904203', 'delivery', 'Lara', 3, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T17:57:00.000Z'),
  ('MR-904204', 'pickup', 'Tainá', 2, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T17:54:00.000Z'),
  ('MR-904205', 'delivery', 'Lara', 3, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T17:51:00.000Z'),
  ('MR-904206', 'pickup', 'Thiago', 1, 'to-pick', '2026-09-26T20:00:00Z', '2026-09-26T17:48:00.000Z')
on conflict (id) do update set lane = excluded.lane, customer_alias = excluded.customer_alias, item_count = excluded.item_count, status = excluded.status, cutoff_at = excluded.cutoff_at, created_at = excluded.created_at;
