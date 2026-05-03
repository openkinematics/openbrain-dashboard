# OpenBrain Dashboard

OpenBrain Dashboard is a web operator console for robots running the OpenBrain stack. It brings teleoperation, live maps, missions, health telemetry, cameras, robot previews, and fleet shortcuts into one browser UI.

Built by [OpenKinematics](https://www.openkinematics.com), a robotics company building practical tools for real-world robot skills and deployment.

[![CI](https://github.com/openkinematics/openbrain-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/openkinematics/openbrain-dashboard/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![ROS 2](https://img.shields.io/badge/ROS-2-22314E)](https://docs.ros.org)

## Why This Exists

Robots need a dependable operator surface: a place to drive, inspect, map, plan, and debug without installing a desktop app. OpenBrain Dashboard is local-first, mobile-friendly, and designed to connect directly to ROS through rosbridge and OpenBrain video streams.

Use it for:

- Driving a robot from a laptop, tablet, or phone.
- Demoing robot behavior without a live robot using `?demo=1`.
- Managing local robot profiles and connection presets.
- Visualizing maps, odometry, health, cameras, and URDF models.
- Building a clean browser-based frontend for `openbrain-ros`.

## Features

- **CockPit**: cameras, virtual joystick, Gamepad API support, 3D robot model, live map, `/goal_pose`, and speed presets.
- **Maps**: localization database list/load/save/delete workflows, mapping controls, camera panel, teleop overlay, and offline demo data.
- **Missions**: click-to-add waypoints, reorder/delete controls, loop mode, and mission start/stop service calls.
- **Health**: CPU, GPU, memory, thermal, and power telemetry with demo fallback when disconnected.
- **Fleet**: local browser registry for robots, favorites, quick connect, and endpoint management.
- **My UI**: drag-and-drop CockPit widget layout saved per browser profile.
- **Profile & Settings**: rosbridge/video defaults, theme, speed profile, joystick behavior, gamepad axes, and video transport preferences.

## Demo Mode

Open any route with `?demo=1` to keep the UI in demo mode:

```text
http://localhost:3000/cockpit?demo=1
```

Demo mode is useful for hosted demos, screenshots, reviews, and development without a robot. It keeps the demo flag while navigating through the dashboard.

## Quick Start

```bash
git clone https://github.com/openkinematics/openbrain-dashboard
cd openbrain-dashboard
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

For live robot data, set:

```ini
NEXT_PUBLIC_ROSBRIDGE_URL=ws://<robot-ip>:9090
NEXT_PUBLIC_VIDEO_BASE_URL=http://<robot-ip>:8080
```

For demo-only development, you can skip robot endpoints and use `?demo=1`.

## Deploy

```bash
pnpm build
pnpm start
```

For live robot operation from an HTTPS deployment, browsers require secure robot endpoints. Use `wss://` for rosbridge and `https://` for video, usually through a TLS proxy, tunnel, or private network gateway.

More deployment notes are in [`docs/deploying.md`](./docs/deploying.md).

## Requirements

- Node.js `>=20.9.0`
- pnpm `>=9`
- Optional live stack:
  - `rosbridge_server` at `ws://<robot-ip>:9090` or `wss://...`
  - OpenBrain video streamer at `http://<robot-ip>:8080` or `https://...`

## Environment Variables

All `NEXT_PUBLIC_*` values are inlined at build time. Operators can still override rosbridge and video defaults from **Profile** or **Fleet**; those values persist in localStorage.

| Variable                                  | Default                 | Purpose                                    |
| ----------------------------------------- | ----------------------- | ------------------------------------------ |
| `NEXT_PUBLIC_ROSBRIDGE_URL`               | `ws://localhost:9090`   | Default rosbridge WebSocket                |
| `NEXT_PUBLIC_VIDEO_BASE_URL`              | `http://localhost:8080` | Default OpenBrain video streamer           |
| `NEXT_PUBLIC_CAMERA_NO_SIGNAL_POSTER_URL` | bundled fallback image  | Optional camera loading/no-signal backdrop |

OpenKinematics links are fixed in code:

- Site: [openkinematics.com](https://www.openkinematics.com)
- GitHub: [github.com/openkinematics/openbrain-dashboard](https://github.com/openkinematics/openbrain-dashboard)

## Scripts

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | Start the Next.js dev server with webpack |
| `pnpm build`        | Create a production build with webpack    |
| `pnpm start`        | Serve the production build                |
| `pnpm lint`         | Run ESLint                                |
| `pnpm typecheck`    | Run TypeScript without emitting files     |
| `pnpm format`       | Format the project with Prettier          |
| `pnpm format:check` | Check Prettier formatting without writing |

## Tech Stack

- [Next.js 16](https://nextjs.org) App Router
- [React 19](https://react.dev)
- [TypeScript 6](https://www.typescriptlang.org)
- [Tailwind CSS 4](https://tailwindcss.com)
- [roslibjs](https://github.com/RobotWebTools/roslibjs)
- [Three.js](https://threejs.org) and `urdf-loader`
- Radix UI primitives
- LocalStorage preferences by default

## Project Structure

```text
app/                   Routes: cockpit, maps, missions, health, fleet, profile, settings, my-ui
components/cockpit/    Shared CockPit widget tiles
components/ros/        React hooks for topics, services, params, and connection state
components/ui/         Reusable UI primitives
components/widgets/    Camera, joystick, map, gauges, robot model, speed selector
lib/                   ROS client, WebRTC, preferences, demo data, env, types, utilities
public/                Static assets
docs/                  Install, deployment, and contribution notes
```

## Mobile First

The dashboard is tuned for phones, tablets, and desktop control stations:

- Bottom dock on mobile.
- Sticky top navigation.
- Safe-area support for notched devices.
- Large touch targets.
- Responsive cards and map/camera panels.
- Fixed footer and mobile dock spacing.

## OpenKinematics

OpenKinematics builds tools for deploying robot skills into real-world workflows. Learn more:

- [Website](https://www.openkinematics.com)
- [GitHub organization](https://github.com/openkinematics)
- [openbrain-ros](https://github.com/openkinematics/openbrain-ros)

## Contributing

Contributions are welcome. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md), keep changes focused, and run the checks before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm format:check
pnpm build
```

## License

MIT. See [`LICENSE`](./LICENSE).
