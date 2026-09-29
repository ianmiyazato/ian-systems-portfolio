# Call script · Maré system design

A talk track for a 14-minute walkthrough of the Maré case: one backend problem and one frontend problem, each ending in a business decision. 13:25 of talking. Generated from the presenter notes in `packages/system-design/data/cases/mare.json` and the story files; don't edit it by hand (`WRITE_CALL_SCRIPT=1 pnpm --filter @portfolio/system-design test`).

**Open** https://ian-portfolio-shell.vercel.app/system-design/mare?present=1 (local: http://127.0.0.1:3000/system-design/mare?present=1).

**Keys:** → or Space next · ← back · N presenter notes · E engineering layer · P pause motion · F full screen · Esc leave presentation.

**The full case** (component tables, trade-offs, decision chains): https://github.com/ianmiyazato/ian-systems-portfolio/blob/main/docs/system-design-cases/mare.md

## SD-M0 · Maré: the biggest week of the year

`/system-design/mare`

| Time | Step | Say |
|---|---|---|
| 00:00 | One retailer, one week | Maré sells fashion online and in 38 stores, and one week decides its quarter. Everything here is fictitious, but the problems are real. |
| 00:30 | Behind the scenes | The first problem is behind the scenes: how do we keep selling at midnight on Black Friday without paying for that capacity all year? |
| 00:55 | On the screen | The second is on the screen: the store is fast because it's ready-made, so how do we keep that and still tell the truth about stock? |

## SD-M1 · Black Friday without losing a sale

`/system-design/mare/black-friday`

| Time | Step | Say |
|---|---|---|
| 01:20 | Ready before midnight | The biggest spike of the night is the one we send ourselves, so we stagger the notifications and prepare every page before midnight. |
| 01:50 | A fair line, not a crash | Past a certain point, letting more people in makes checkout slower for everyone. A short line sells more than an error page. |
| 02:20 | Your dress is really yours | Selling the same dress twice means refunds and angry customers for weeks, so we'd rather sell the last few a few seconds later. |
| 02:50 | Two ways to pay | On the night, a payment problem is the most expensive failure there is, so there's always a second way to take the money. |
| 03:15 | Checkout does four things | Anything checkout waits for can break it, so it waits for four things and everything else catches up afterwards. |
| 03:45 | Extras switch off first | We decide what to give up while we're calm, not at midnight, and we rehearse it before the night. |
| 04:10 | Sales per minute, live | The number everyone watches is sales per minute, because that's what an outage actually costs. |

## SD-M2 · The plan for a bad night

`/system-design/mare/black-friday`

| Time | Step | Say |
|---|---|---|
| 04:35 | Level 1 · Lean | Level one happens on its own. Suggestions become bestsellers and most shoppers never notice. |
| 04:55 | Level 2 · Focused | Level two pauses what can wait until Monday, like new store-card applications and office exports. |
| 05:15 | Level 3 · Line | Level three is the waiting line. The promise is simple: your bag is safe while you wait. |
| 05:35 | Level 4 · Checkout only | Level four is the last resort: we stop everything except taking orders, and we've rehearsed it. |

## SD-M3 · The decision: pay for the peak, on purpose

`/system-design/mare/black-friday`

| Time | Step | Say |
|---|---|---|
| 05:55 | The decision | The decision isn't technical: it's whether to pay for the peak, and how much, and what we agree to give up. |
| 06:20 | What changes | These are the numbers it moves, and sales per minute at the peak is the one that matters most. |
| 06:40 | Is it worth it? | This is the whole argument in one line: keep spending while every R$1 of readiness removes more than R$1 of expected loss. |
| 07:15 | What we give up | And this is the price, said out loud, so nobody is surprised on the night. |

## SD-M4 · Live truth on a ready-made storefront

`/system-design/mare/storefront`

| Time | Step | Say |
|---|---|---|
| 07:35 | Keep what works | The current storefront is fast because it's ready-made. The job is to keep that and fix only what it can't do. |
| 08:00 | Only a small part is live | Only the parts that change every second are live, and one shared answer serves everyone looking at the same deal. |
| 08:30 | Honest stock | A precise number that's often wrong is worse than a simple one that's always right. |
| 08:55 | Add to bag, safely | Instant feels great until it's wrong, so the page is instant only when it's safe to be. |
| 09:20 | Busy mode is designed | Every extra on the page has a calm, simpler twin ready, so a busy night looks simpler, not broken. |
| 09:45 | The buy path stays light | The path to paying is the one place where nothing is allowed to slow us down. |
| 10:05 | Speed measured in reais | Speed only matters when it costs sales, so we measure it in reais, not milliseconds. |

## SD-M5 · Try it: one deal on Black Friday night

`/system-design/mare/storefront`

| Time | Step | Say |
|---|---|---|
| 10:25 | Watch the stock | Press the button a few times: the stock drops, the band changes, and nothing on the page moves. |
| 10:55 | Add to bag | Now add it to the bag, first with plenty in stock and then with only a few left. |
| 11:20 | Turn up the pressure | Finally, turn up the pressure: the page gets simpler, and buying still works at every level. |

## SD-M6 · The decision: keep what works, make the truth live

`/system-design/mare/storefront`

| Time | Step | Say |
|---|---|---|
| 11:50 | The decision | The frontend decision is mostly about what we don't do: we don't rebuild a storefront that already works. |
| 12:15 | What changes | The numbers it moves are about trust at the moment of paying. |
| 12:35 | What we give up | And the price is honest too: less precise scarcity, fewer extras at the peak, and less tracking on checkout. |

## Bridge · 12:55

- Both decisions protect the same number: sales per minute at the peak.
- The backend decides what to protect and what to give up; the frontend makes giving up look calm instead of broken.
- Atlas and Pulse follow the same pattern: one decision behind the scenes, one on the screen.

**End of talk track · 13:25.** Triggers, volumes and the inputs of the "is it worth it" math are illustrative, not production measurements.
