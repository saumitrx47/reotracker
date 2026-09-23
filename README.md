# ReoTracker — demo stub

Central material tracking and forecasting dashboard for reinforcing steel, built
for the ENGG3112 Tutorial 12 concept (client: Richard Crookes Constructions).
The user is a **quantity surveyor** reconciling estimated, ordered and
installed/required reo quantities across a live site.

> **This is a UI stub.** All numbers come from `src/data/mock-data.ts`. There is
> no backend, no auth and nothing persists.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` produces a production bundle;
`npm run typecheck` runs TypeScript without emitting.

## Stack

React 19 + Vite + TypeScript · Tailwind CSS v4 · Recharts · React Router · lucide-react.

## Views

| Route | What it shows |
|---|---|
| `/` | Summary cards (estimated / ordered / installed / variance), estimated-vs-ordered-vs-installed by zone with a chart⇄table toggle, and colour-coded discrepancy alerts with recommended actions |
| `/deliveries` | Delivery docket log with search + zone/status filters, AS/NZS 4671 batch and ACRS-certificate columns, and an "Add delivery" modal |
| `/reconciliation` | Per-zone estimated vs ordered vs installed vs current requirement, computed variance, colour-coded status and "Mark as reconciled" (local state) |
| `/forecast` | Four-week projected requirement vs committed orders, plus recommended procurement actions |

## Swapping in a real API

Views never import `mock-data.ts`. They call `src/data/api.ts`, which is the
only module that knows where data comes from — replace each function body with a
`fetch` returning the same shape and nothing else changes:

```ts
export async function getDeliveries(): Promise<Delivery[]> {
  const res = await fetch(`${API_BASE}/projects/${projectId}/deliveries`)
  if (!res.ok) throw new Error(`Deliveries request failed: ${res.status}`)
  return res.json()
}
```

The interfaces in `mock-data.ts` (`Project`, `Zone`, `ReconciliationItem`,
`Delivery`, `Alert`, `ForecastPoint`) are the contract. `markReconciled()` and
`createDelivery()` are the two write stubs; the reconciliation page already
awaits the former, so pointing it at a `PATCH` is a one-line change.

`src/hooks/useProjectData.ts` wraps each accessor in a small async hook with
loading and error states, so real network latency and failures already have a
place to surface.

## Layout

```
src/
  components/   layout shell, cards, tables, charts, modal — all small and single-purpose
  pages/        one file per route
  data/         mock-data.ts (the fixture) + api.ts (the seam)
  hooks/        useProjectData.ts — async resource hooks
  lib/          format.ts, variance.ts (variance maths), chart-theme.ts (palette tokens)
```

## Notes on the numbers

Variance is **ordered vs the current design requirement**, not vs the original
estimate — that is the discrepancy the concept exists to catch. The 5% tolerance
and 15% escalation thresholds come from the project's engineering requirements
and live on the `project` record, so they are configurable rather than hardcoded
in components. Chart colours use a CVD-validated categorical palette; the
dashboard's table toggle doubles as the accessible fallback for the chart.
