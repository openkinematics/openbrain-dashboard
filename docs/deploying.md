# Deploying

The dashboard is a standard Next.js 16 App Router app. It can run anywhere Next runs, but for production we recommend one of three patterns.

## 1. Vercel (recommended for the public demo)

```bash
pnpm dlx vercel --prod
```

Or import the repo at [vercel.com/new](https://vercel.com/new). Set the env vars from [`.env.example`](../.env.example) in the project settings.

Notes:

- `NEXT_PUBLIC_ROSBRIDGE_URL` is **inlined at build time**, so a single deployment can only point at one default robot. Operators can override it from the Profile page (saved to their localStorage).
- If the rosbridge server is on plain `ws://`, your Vercel deployment must be served over `http://` to avoid mixed-content blocking. In practice that means Vercel previews work for development but production usually pairs the dashboard with `wss://` (rosbridge behind Nginx + TLS).

## 2. Self-hosted Docker

A minimal `Dockerfile`:

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["pnpm", "start"]
```

Run:

```bash
docker build -t openbrain-dashboard .
docker run --rm -p 3000:3000 \
  -e NEXT_PUBLIC_ROSBRIDGE_URL=ws://robot.local:9090 \
  -e NEXT_PUBLIC_VIDEO_BASE_URL=http://robot.local:8080 \
  openbrain-dashboard
```

## 3. Static export (S3 / CDN / nginx)

Static export is possible only after opting into Next's export mode with `output: "export"` in `next.config.ts`. Run `pnpm build`; the `out/` directory is the deployable static artifact. Note that this drops runtime dynamic route support for `app/robots/[id]` unless you pre-render known robot IDs with `generateStaticParams`.

## Behind nginx (recommended for private deployments)

```nginx
server {
  listen 443 ssl http2;
  server_name dashboard.example.com;

  # ... ssl config ...

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # Reverse-proxy rosbridge so the browser sees a single origin (no mixed content).
  location /rosbridge/ {
    proxy_pass http://robot.local:9090/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400;
  }
}
```

Then set `NEXT_PUBLIC_ROSBRIDGE_URL=wss://dashboard.example.com/rosbridge` so the browser uses the same TLS-terminated origin.

## CI

GitHub Actions runs typecheck + lint + build on every PR — see [.github/workflows/ci.yml](../.github/workflows/ci.yml).
