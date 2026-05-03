# Contributing

The canonical guide lives in [`CONTRIBUTING.md`](../CONTRIBUTING.md) at the repo root. This page is a quick reference to the directory conventions used inside the codebase.

## Where things live

```
app/                          One folder per route (App Router)
  layout.tsx                  Global shell — fonts, theme provider, nav
  page.tsx                    `/` — robot selector

components/
  providers.tsx               next-themes wrapper
  site-nav.tsx                Top nav + connection badge + theme toggle
  theme-toggle.tsx            Cycle light → dark → system

  ros/                        roslibjs hooks — keep all of them isomorphic
    useConnection.ts            Connection lifecycle subscription
    useTopic.ts                 Subscribe + publish
    useService.ts               One-shot RPCs
    useParam.ts                 Parameter server reads/writes

  ui/                         shadcn/ui primitives, vendored
                              When adding a new primitive, copy it from the
                              shadcn registry rather than depending on the CLI.

  widgets/                    Domain widgets — one file per widget. Should
                              consume only the `ros/` hooks, not the lib
                              singletons directly.

lib/
  ros.ts                      The ONLY place that creates a ROSLIB.Ros instance
  webrtc.ts                   The ONLY place that creates an RTCPeerConnection
  preferences.ts              localStorage shape — bump version on schema changes
  env.ts                      Read all NEXT_PUBLIC_* via the helpers, never
                              inline `process.env.X` in components
  types.ts                    Trim and grow as we touch new ROS message types
  utils.ts                    Small generic helpers (cn, clamp, formatBytes)
```

## Adding a widget

1. Create `components/widgets/<WidgetName>.tsx` — one default export, named after the file.
2. Use `useTopic` / `useService` from `@/components/ros`. **Never** import `roslib` directly outside `lib/ros.ts`.
3. Re-export from `components/widgets/index.ts`.
4. If the widget renders into a `<canvas>`, set up a `ResizeObserver` so it works inside drag-drop layouts (Phase 2 My UI).
5. Touch targets must be ≥ 44px; test at the 375px viewport.

## Adding a page

1. Create `app/<route>/page.tsx`.
2. Add a nav entry in [`components/site-nav.tsx`](../components/site-nav.tsx) — pick a Lucide icon.
3. The page is a Client Component if it uses any of the `useTopic` / `useService` hooks.

## Style

- Strict TypeScript. `any` requires a comment justifying it.
- Run `pnpm typecheck && pnpm lint` before pushing — CI runs both plus `pnpm build`.
- Tailwind classes go on the JSX. Use `cn()` from `lib/utils.ts` to merge with conditional classes.
- Default to the design tokens (`bg-card`, `text-muted-foreground`, `border-border`) over hardcoded colors so dark mode and theming work for free.

## Branching

- `main` is always shippable. CI gates merges.
- Feature branches: `feat/<short-description>`. Bug fixes: `fix/<short-description>`.
- One logical change per PR. Screenshots required for any visual change.
