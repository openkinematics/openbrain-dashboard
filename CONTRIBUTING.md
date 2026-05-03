# Contributing to OpenBrain Dashboard

Thanks for your interest. This repo follows standard open-source contribution flow.

## Before you start

1. Check open issues — your idea may already be tracked.
2. For non-trivial changes, open an issue first to discuss approach.

## Development setup

```bash
git clone https://github.com/openkinematics/openbrain-dashboard
cd openbrain-dashboard
pnpm install
cp .env.example .env.local
# edit .env.local: set NEXT_PUBLIC_ROSBRIDGE_URL=ws://<your-robot-ip>:9090
pnpm dev
```

To develop without a real robot, run [openbrain-ros](https://github.com/openkinematics/openbrain-ros) in Docker on your dev machine.

## Code style

- **TypeScript**: strict mode, no `any` without justification.
- **Lint**: ESLint flat config + Prettier (config in `eslint.config.mjs`, `.prettierrc`).
- **Components**: function components only, hooks for state.
- Run `pnpm lint && pnpm typecheck` before pushing.

## Visual identity (must follow)

- Primary color: `oklch(0.55 0.19 250)` (electric blue)
- Fonts: Orbitron (display, `font-orbitron`), Geist (body, `font-geist`)
- Sharp corners on landing-style sections
- `rounded-xl` on data cards inside the app
- Dark mode default
- All interactive elements ≥ 44px touch targets
- Mobile-first — test at 375px viewport before any other breakpoint

## Adding a widget

1. Create `components/widgets/<widget-name>.tsx`.
2. Use `useTopic` / `useService` hooks from `components/ros/`.
3. Re-export from `components/widgets/index.ts`.
4. Add focused docs or a demo route only when the widget needs operator-facing explanation.

## PR requirements

- One logical change per PR.
- All CI checks green (typecheck, lint, build).
- Lighthouse mobile audit ≥ 85 Performance, ≥ 95 Accessibility.
- Screenshots in PR description for any visual change.

## License

By contributing, you agree your work is released under the [MIT License](./LICENSE).
