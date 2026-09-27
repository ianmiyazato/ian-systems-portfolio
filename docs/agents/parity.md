# Parity

<!-- Generated from packages/routes/src/routes.manifest.ts. Regenerate: WRITE_PARITY=1 pnpm --filter @portfolio/routes test -->

Every approved screen, the design board it is checked against, and its screenshot. "Checked" means the route was opened at 1440 × 900 in Chromium and compared with the board; the crawler (`tests/e2e/crawler.spec.ts`) separately proves every route renders its heading with zero console errors.

| # | Route | Board | System | Release | Overlays | Checked | Screenshot |
|---|---|---|---|---|---|---|---|
| 1 | `/` | OV-home | Overview | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/overview/home.png` |
| 2 | `/work/mare/languages` | OV-languages | Maré | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/mare/mare-languages.png` |
| 3 | `/system-design/mare` | SD-mare | Maré | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/mare/system-design-mare.png` |
| 4 | `/mare/ops/counter` | BA-lanes | Counter | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/counter/counter-lanes.png` |
| 5 | `/mare/ops/counter/pick/MR-904117` | BA-picking | Counter | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/counter/counter-picking.png` |
| 6 | `/mare/ops/counter?modal=handover&order=MR-904112&sub=third-party` | BA-handover | Counter | 0.1 | modal=handover sub=third-party | ✅ 2026-09-26 | `docs/screenshots/counter/counter-handover.png` |
| 7 | `/mare/ops/counter?modal=cutoff-plan&sub=why` | BA-cutoff | Counter | 0.1 | modal=cutoff-plan sub=why | ✅ 2026-09-26 | `docs/screenshots/counter/counter-cutoff-plan.png` |
| 8 | `/mare/ops/counter/returns` | BA-returns | Counter | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/counter/counter-returns.png` |
| 9 | `/mare/ops/counter/stock` | BA-stock | Counter | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/counter/counter-stock.png` |
| 10 | `/mare/ops/product-hub` | PH-catalog | Product Hub | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/product-hub/product-hub-catalog.png` |
| 11 | `/mare/ops/product-hub/products/510233?tab=pricing` | PH-detail | Product Hub | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/product-hub/product-hub-detail.png` |
| 12 | `/mare/ops/product-hub/products/510233?modal=agent-run&sub=edit` | PH-agent-run | Product Hub | 0.1 | modal=agent-run sub=edit | ✅ 2026-09-26 | `docs/screenshots/product-hub/product-hub-agent-run.png` |
| 13 | `/mare/ops/product-hub/marketplace/onboarding/linho-co?step=mapping` | PH-onboarding | Product Hub | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/product-hub/product-hub-onboarding.png` |
| 14 | `/mare/ops/product-hub/availability` | PH-availability | Product Hub | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/product-hub/product-hub-availability.png` |
| 15 | `/mare/ops/product-hub/imports` | PH-imports | Product Hub | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/product-hub/product-hub-imports.png` |
| 16 | `/mare/ops/product-hub/audit` | PH-audit | Product Hub | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/product-hub/product-hub-audit.png` |
| 17 | `/mare/ops/pay` | PY-applications | Pay | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/pay/pay-applications.png` |
| 18 | `/mare/ops/pay/applications/AP-77118` | PY-detail | Pay | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/pay/pay-application-detail.png` |
| 19 | `/mare/ops/pay/applications/AP-77118?modal=decision&sub=override` | PY-decision | Pay | 0.1 | modal=decision sub=override | ✅ 2026-09-26 | `docs/screenshots/pay/pay-decision.png` |
| 20 | `/mare/ops/pay/accounts` | PY-accounts | Pay | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/pay/pay-accounts.png` |
| 21 | `/mare/ops/pay/disputes` | PY-disputes | Pay | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/pay/pay-disputes.png` |
| 22 | `/mare/ops/pay/collections` | PY-collections | Pay | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/pay/pay-collections.png` |
| 23 | `/mare/ops/pay/fraud` | PY-fraud | Pay | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/pay/pay-fraud.png` |
| 24 | `/mare/ops/pay/models` | PY-models | Pay | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/pay/pay-models.png` |
| 25 | `/mare/ops/pay/policies` | PY-policies | Pay | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/pay/pay-policies.png` |
| 26 | `/mare/apps/pay` | PY-app | Pay | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/pay/pay-customer-app.png` |
| 27 | `/mare/ops/circle` | CI-program | Circle | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/circle/circle-program.png` |
| 28 | `/mare/ops/circle/rules/summer-swim` | CI-rules | Circle | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/circle/circle-rule-builder.png` |
| 29 | `/mare/ops/circle?modal=leak&code=MARI15&sub=rotate` | CI-leak | Circle | 0.1 | modal=leak sub=rotate | ✅ 2026-09-26 | `docs/screenshots/circle/circle-leak.png` |
| 30 | `/mare/ops/circle/creators` | CI-creators | Circle | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/circle/circle-creators.png` |
| 31 | `/mare/ops/circle/campaigns` | CI-campaigns | Circle | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/circle/circle-campaigns.png` |
| 32 | `/mare/ops/circle/payouts` | CI-payouts | Circle | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/circle/circle-payouts.png` |
| 33 | `/mare/apps/circle` | CI-app | Circle | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/circle/circle-creator-app.png` |
| 34 | `/mare/ops/mesh` | MS-topology | Mesh | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/mesh/mesh-topology.png` |
| 35 | `/mare/ops/mesh/partners/ligeiro-log` | MS-partner | Mesh | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/mesh/mesh-partner.png` |
| 36 | `/mare/ops/mesh/dlq?modal=replay&sub=transform` | MS-dlq | Mesh | 0.1 | modal=replay sub=transform | ✅ 2026-09-26 | `docs/screenshots/mesh/mesh-dlq-replay.png` |
| 37 | `/mare/ops/mesh/invoices/MR-904117` | MS-invoices | Mesh | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/mesh/mesh-invoice-chain.png` |
| 38 | `/mare/ops/mesh/events` | MS-events | Mesh | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/mesh/mesh-events.png` |
| 39 | `/mare/ops/mesh/contracts` | MS-contracts | Mesh | 0.2 | — | ✅ 2026-09-27 | `docs/screenshots/mesh/mesh-contracts.png` |
| 40 | `/mare/apps/shop` | CS-app | Consumer | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/consumer/consumer-app.png` |
| 41 | `/mare/shop` | CS-site | Consumer | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/consumer/consumer-site.png` |
| 42 | `/atlas/welcome?step=2` | AT-onboarding | Atlas | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-onboarding.png` |
| 43 | `/atlas/pipeline` | AT-pipeline | Atlas | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-pipeline.png` |
| 44 | `/atlas/pipeline/board?drawer=parallax-pay&sub=log-outcome` | AT-board | Atlas | 0.1 | drawer=parallax-pay sub=log-outcome | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-board.png` |
| 45 | `/atlas/companies/parallax-pay` | AT-company | Atlas | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-company.png` |
| 46 | `/atlas/arena?modal=setup&prompt=payments-ledger` | AT-arena | Atlas | 0.1 | modal=setup | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-arena-setup.png` |
| 47 | `/atlas/arena/session/14` | AT-session | Atlas | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-arena-session.png` |
| 48 | `/atlas/arena/sessions/14` | AT-feedback | Atlas | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-feedback.png` |
| 49 | `/atlas/arena/sessions/14?drawer=transcript&t=31:30` | AT-transcript | Atlas | 0.1 | drawer=transcript | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-transcript.png` |
| 50 | `/atlas/academy/designing-for-10x` | AT-lesson | Atlas | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-academy.png` |
| 51 | `/atlas/academy/designing-for-10x?modal=paywall&sub=checkout` | AT-paywall | Atlas | 0.1 | modal=paywall sub=checkout | ✅ 2026-09-26 | `docs/screenshots/atlas/atlas-paywall.png` |
| 52 | `/system-design/atlas` | SD-atlas | Atlas | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/atlas/system-design-atlas.png` |
| 53 | `/pulse` | PU-intelligence | Pulse | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/pulse/pulse-intelligence.png` |
| 54 | `/pulse/distribution` | PU-distribution | Pulse | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/pulse/pulse-distribution.png` |
| 55 | `/pulse/harness` | PU-harness | Pulse | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/pulse/pulse-harness.png` |
| 56 | `/system-design/pulse` | SD-pulse | Pulse | 0.1 | — | ✅ 2026-09-26 | `docs/screenshots/pulse/system-design-pulse.png` |

Parity: **56/56**.
