# Call script · system design

A one-page talk track for a 15–20 minute conversation: 14:35 of talking, which leaves about 5 minutes for questions in a 20-minute call. Generated from the presenter notes in `packages/system-design/data`; don't edit it by hand (`WRITE_CALL_SCRIPT=1 pnpm --filter @portfolio/system-design test`).

**Open** https://ian-portfolio-shell.vercel.app/system-design?present=1 (local: http://127.0.0.1:3000/system-design?present=1).

**Keys:** → or Space next · ← back · N presenter notes · E engineering layer · P pause motion · F full screen · Esc leave presentation. The mouse brings the controls back.

**Rule for the whole call:** say the plain sentence first; press E only when someone asks how.

## SD-00 · Two problems, solved end to end

`/system-design`

| Time | Step | Say |
|---|---|---|
| 00:00 | Two problems | I want to show you two problems I'd expect to solve in the first months, end to end. Everything is in plain language, and the engineering is one key away. |
| 00:30 | Problem A | The first is about numbers: turning a flood of results files into one clear decision every morning. |
| 00:45 | Problem B | The second is about people: making the product feel personal without ever making it slow. |
| 01:00 | Build or buy | And across both, the real founding-engineer skill: deciding what to build, what to buy, and what we give up. |

## SD-A1 · From a file every minute to one clear decision

`/system-design/metrics-to-decisions`

| Time | Step | Say |
|---|---|---|
| 01:20 | A file arrives | It starts with something boring on purpose: a plain results file, every minute, from every system. Boring inputs are easy to trust. |
| 01:50 | We check it | Nothing reaches a person until it passes the checks. A bad file is set aside with a reason, so nobody decides anything on broken numbers. |
| 02:20 | We store it | We keep it in a shape made for totals, so a question like revenue by store since two o'clock comes back in seconds. |
| 02:45 | We compare to normal | The question is never whether revenue is down. It's whether it's down compared to a normal Monday at two o'clock, for this store. |
| 03:15 | We explain it | Only at the end does AI appear, and it only writes the sentence. The numbers come from the data, and a checker reads the text before anyone else does. |

## SD-A2 · What people see, and how we keep the AI honest

`/system-design/metrics-to-decisions`

| Time | Step | Say |
|---|---|---|
| 03:50 | The morning report | This is what a manager actually sees: one sentence, a chart with the normal range shaded, and the moment things changed. |
| 04:25 | Likely cause, suggested fix | Then the likely cause and a suggested fix, which a person approves. The AI proposes and people decide. |
| 04:50 | How we keep the AI honest | This is how we keep it honest: numbers first, the AI writes only the sentence, and a checker reads it before you do. |

## SD-A3 · Problem A: what we build, what we buy

`/system-design/metrics-to-decisions/build-or-buy`

| Time | Step | Say |
|---|---|---|
| 05:25 | What we build | Here's what we build ourselves: the things that define the business, like what revenue means and how we spot unusual numbers. |
| 05:55 | What we buy | And here's what we buy: the database, the AI model and the dashboards, because running those well is someone else's full-time job. |
| 06:20 | What we give up | Every line has a cost in amber. Buying means a bill and some dependence, and building means we own every fix. |

## SD-B1 · Personal, and still instant

`/system-design/personal-and-instant`

| Time | Step | Say |
|---|---|---|
| 06:45 | Signals | Every signal is something the shopper already did: what they looked at, lingered on, saved and bought, and which store is close. |
| 07:15 | Your taste | From that we build a short description of their taste that you could read out loud: linen, neutral tones, midi, size M. |
| 07:40 | Only what you can get | Here's the product point: a suggestion that's out of stock or not in your size feels smart and sells nothing, so we only show what they can actually get. |
| 08:15 | Try it on | Finally a virtual fitting room, which we buy rather than build, and only open once a size is chosen, because every try costs money. |

## SD-B2 · The speed race

`/system-design/personal-and-instant`

| Time | Step | Say |
|---|---|---|
| 08:40 | The race | Here's the trade-off drawn honestly: the same page built the simple way and the way I'd build it, on the same five-second clock. |
| 09:10 | Useful at 0.6 s | The simple way shows nothing for almost five seconds. Ours is useful at 0.6 seconds, and the AI picks slide in when they're ready. |
| 09:30 | Four techniques | Four techniques do it: load page by page, draw only what's on screen, never let AI block the page, and prepare the common answers in advance. |
| 10:05 | Try it live | And this isn't a slide: 2,000 products are loading page by page in your browser, with a simulated AI slot that gives up after 800 milliseconds. |

## SD-B3 · Problem B: what we build, what we buy

`/system-design/personal-and-instant/build-or-buy`

| Time | Step | Say |
|---|---|---|
| 10:55 | What we build | We build the two things a shopper actually feels: which suggestions come first, and how fast every page is. |
| 11:20 | What we buy | Everything that's hard but generic we buy or take as open source: understanding products, the fitting room, tracking and images. |
| 11:45 | What we give up | Each choice has a price, and each price has a limit we chose: the fitting room only opens after a size is picked. |

## SD-99 · The 80/20 map

`/system-design/build-vs-buy`

| Time | Step | Say |
|---|---|---|
| 12:10 | The map | This is the one picture I use to spend a small team's time: across, how much something makes us different, and up, how hard it is to do well. |
| 12:35 | Problem A | Problem A lands in build now for what defines the business, and buy for the heavy machinery. |
| 12:55 | Problem B | Problem B puts suggestion ranking in build later: start with a ready tool while there's no data, then replace it. |
| 13:15 | How I decide | Four questions decide every dot: is it why customers choose us, is it hard and generic, can we swap it later, and what does it cost at ten times the volume? |

## Bridge · 13:50

Close by connecting the two problems to the company:

- Problem A is what a performance-intelligence platform does every day across creators and platforms.
- Problem B is how fans and brands would experience it.
- The build-vs-buy map is how a founding engineer spends a small team's time.

**End of talk track · 14:35.** Then questions. If there is time, open the live demo on Problem B step 4 and press Restart a few times: the AI answer time changes, the page never moves.

All timings and volumes on the pages are illustrative targets, not production measurements.
