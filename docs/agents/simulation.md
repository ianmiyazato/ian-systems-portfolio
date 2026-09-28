# Simulation

## AI simulation

`packages/ai-sim` exports `AIProvider` with `retrieve`, `rerank`, `generateStream`, `runAgent`, `judge`, and `runEval`. `SimulatedProvider` is deterministic and scenario-driven; it accepts a domain corpus and grounded canned answers (`new SimulatedProvider(corpus, answers)`), which Pulse uses for Ask Pulse and the harness. Remotes use the same trust pattern through `AiSurface` (`@portfolio/remote-runtime`) and the shell through `components/overlay.tsx`. `LiveProvider` deliberately throws until it is instantiated inside a server-only route with both live provider keys. Never import provider keys into a client component.
