# ReoTracker — demo stub

Central material tracking and forecasting dashboard for reinforcing steel, built
for the ENGG3112 Tutorial 12 concept (client: Richard Crookes Constructions).
The user is a **quantity surveyor** reconciling estimated, ordered and
installed/required reo quantities across a live site.

> **This is a demo.** All data is seeded from `src/data/mock-data.ts` into a
> shared in-browser store. There is no backend and no real auth: four demo
> accounts show how a change made by one role reaches everyone else. State
> persists in localStorage and syncs live between browser tabs.

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
| `/` | Summary cards (estimated / ordered / installed / variance), estimated-vs-ordered-vs-installed by zone with a chart⇄table toggle, and discrepancy alerts derived from live data, with recommended actions and change requests |
| `/deliveries` | Delivery docket log with search + zone/status filters, AS/NZS 4671 batch and ACRS-certificate columns, "Add delivery" and "Attach certificate" |
| `/reconciliation` | Per-zone estimated vs ordered vs installed vs current requirement, computed variance, colour-coded status, "Mark as reconciled", installed-quantity updates and design revisions |
| `/forecast` | Four-week projected requirement vs committed orders, plus recommended procurement actions |

## Demo accounts and roles

Switch account from the avatar menu in the top bar. Each browser tab keeps its
own account, so two tabs can play two people at once. Controls a role can't use
stay visible but locked, with a "Requires … role" tooltip.

| Account | Role | Can |
|---|---|---|
| Priya Naidu (PN) — default | Quantity Surveyor | Mark / unmark line items reconciled · raise change requests from alerts (cancel balance, top-up, reallocate surplus) · export the register |
| Tom Reilly (TR) | Site Engineer | Record deliveries · update installed quantity · issue design revisions (new requirement + revision letter; the item returns to unreconciled) |
| Sarah Chen (SC) | Project Manager | Approve or reject change requests (bell or alert card) · read everything · cannot edit quantities |
| Daniel Okafor (DO) | Procurement Officer | Attach the ACRS certificate and mark a Pending delivery Documented · cannot change requirements |

The map lives in `src/lib/permissions.ts` (`can(user, action)`). Every write is
recorded in the **activity log** (avatar menu, or the bell's footer) with time,
user, role, action, target and before → after values, and notifies the roles
that care via the bell. **Reset demo data** in the avatar menu restores the seed
for every tab.

## Demo script

1. Open the app as **Priya (QS)**. The dashboard shows the seed scenario: a
   30.7% N12 over-order on Level 3 Pour A, a 1.4 t N16 shortfall on Level 5
   Pour B, and a missing certificate on DKT-2291.
2. Switch to **Tom (Site Engineer)** → Deliveries → **Add delivery**: 6 t of N12
   to Level 3 — Slab Pour A on a new PO (e.g. PO-4490). The L3-A over-order rises
   on the dashboard and the reconciliation register.
3. Still as Tom, on Reconciliation click the revision icon beside L3-A N12's
   requirement, issue **Rev G** with a lower requirement. The variance
   recalculates and the item drops back to unreconciled.
4. Switch to **Priya**. The bell shows Tom's updates; "Mark as reconciled" is
   available and "Add delivery" is locked.
5. On the dashboard, hover the Level 5 Pour B alert → **Raise request →** →
   *Reallocate surplus from Level 3 Pour A*. Switch to **Sarah (PM)** and
   approve it from the bell. The L5-B shortfall clears.
6. Switch to **Daniel (Procurement)** → Deliveries → **Attach certificate** on
   DKT-2291. Its compliance alert disappears.
7. Open **Activity log** to show the full audit trail.
8. For a live multi-user demo, open a second tab, sign in as someone else, and
   make a change — the other tab updates immediately.

## How alerts are derived

`src/lib/alerts.ts` builds the alert list from the live data. A line item is
flagged when its ordered-vs-required variance is outside the project's 5%
tolerance (critical at 15%), with these site rules:

- Complete zones are closed out and raise no variance alerts; fully reconciled
  complete zones show a "reconciled within tolerance" entry instead.
- Variances under 0.5 t are immaterial.
- A shortfall in an active zone is critical — a pour can't go ahead short.
- An over-order in a scheduled zone is capped at warning — nothing is cast yet.
- A delivery without an ACRS certificate is flagged once it is more than 2 days
  old (the supplier's grace period).

Reallocation pairs a surplus with a shortfall in another zone: same item code
first, otherwise the same material type. Each alert keeps its first-seen time.

## Swapping in a real API

Views never import `mock-data.ts` or the store internals. They read through
the hooks in `src/hooks/useProjectData.ts` and write through
`src/data/api.ts`, which is the only module that knows where data comes from.
Reads are selectors over the shared store (`src/data/store.tsx`); writes are
async commands that dispatch to it. To use a real backend, replace each write's
body with a `fetch` and dispatch the server's response — nothing else changes:

```ts
export async function markReconciled(dispatch, itemId, reconciled) {
  const res = await fetch(`${API_BASE}/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ reconciled }) })
  if (!res.ok) throw new Error(`Reconcile failed: ${res.status}`)
  dispatch({ type: 'hydrate', shared: await res.json() })
}
```

The interfaces in `mock-data.ts` (`Project`, `Zone`, `ReconciliationItem`,
`Delivery`, `Alert`, `ForecastPoint`) are the contract. The hooks keep the
`{ data, loading, error, reload }` shape, so real network latency and failures
already have a place to surface.

## Deploy

`vercel.json` rewrites every path to `index.html`, so deep links and refreshes
work with client-side routing. Deploy with `npx vercel --prod` (framework Vite,
build `npm run build`, output `dist`).

## Layout

```
src/
  components/   layout shell, cards, tables, charts, modal — all small and single-purpose
  pages/        one file per route
  data/         mock-data.ts (the seed), store.tsx (shared live store), api.ts (the seam), users.ts (demo accounts)
  hooks/        useProjectData.ts — resource hooks and write commands
  lib/          variance.ts, alerts.ts (derived alerts), permissions.ts, requests.ts, validation.ts, format.ts, chart-theme.ts
```

## Notes on the numbers

Variance is **ordered vs the current design requirement**, not vs the original
estimate — that is the discrepancy the concept exists to catch. The 5% tolerance
and 15% escalation thresholds come from the project's engineering requirements
and live on the `project` record, so they are configurable rather than hardcoded
in components. Chart colours use a CVD-validated categorical palette; the
dashboard's table toggle doubles as the accessible fallback for the chart.
