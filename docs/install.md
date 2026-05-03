# Install

## Prerequisites

- **Node.js ≥ 20** — verified on 20 LTS and 22.
- **pnpm ≥ 9** — the project pins `packageManager` to a specific version. Other package managers may install the same dependency tree but are not supported by CI.
- A running [openbrain-ros](https://github.com/openkinematics/openbrain-ros) instance with:
  - `rosbridge_server` listening on `ws://<robot-ip>:9090`
  - The OpenBrain WebRTC streamer on `http://<robot-ip>:8080`

## Local development

```bash
git clone https://github.com/openkinematics/openbrain-dashboard
cd openbrain-dashboard
pnpm install
cp .env.example .env.local
```

Edit `.env.local`:

```ini
NEXT_PUBLIC_ROSBRIDGE_URL=ws://192.168.1.50:9090
NEXT_PUBLIC_VIDEO_BASE_URL=http://192.168.1.50:8080
```

Then:

```bash
pnpm dev
# open http://localhost:3000
```

## Without a physical robot

Run [openbrain-ros](https://github.com/openkinematics/openbrain-ros) under Docker on your dev machine — it bundles a turtlebot3 Gazebo sim. Point the dashboard at `ws://localhost:9090`.

## Production build

```bash
pnpm build
pnpm start
# defaults to :3000
```

The default production build is a Next.js server build (run with `pnpm start`, Vercel, or a Node container). Static export is possible as a separate deployment mode; see [deploying.md](./deploying.md).

## Connecting from a phone

1. Make sure your phone is on the same Wi-Fi as the robot.
2. Open `http://<dev-machine-ip>:3000` (or the deployed URL) on the phone.
3. Enter the robot's `ws://...` URL on the home screen.
4. The dashboard will remember it under Recent.

If the robot is on HTTPS but the rosbridge is plaintext, browsers will block the mixed-content WebSocket. Either expose rosbridge over `wss://` (e.g. via Nginx + Let's Encrypt) or serve the dashboard over plain HTTP from the same network.

## Troubleshooting

| Symptom                                    | Likely cause                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Status badge stuck on "connecting…"        | rosbridge unreachable; check `ws://<ip>:9090` from your browser's devtools                        |
| Status flips to "reconnecting…" repeatedly | The socket opens then closes — usually a CORS or origin mismatch on the rosbridge side            |
| Cameras show "stream unavailable"          | The video streamer isn't running or the port (8080) is firewalled                                 |
| URDF widget says "loading…" forever        | The `/robot_description` topic is empty — check `ros2 topic echo /robot_description`              |
| Joystick draws but the robot doesn't move  | Check that nothing else is publishing on `/cmd_vel` (e.g. Nav2). Check `ros2 topic echo /cmd_vel` |
