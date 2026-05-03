import type { MetadataRoute } from "next";
import { DEPLOYMENT_URL } from "@/lib/env";

const ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/cockpit", priority: 0.9 },
  { path: "/health", priority: 0.8 },
  { path: "/missions", priority: 0.8 },
  { path: "/maps", priority: 0.7 },
  { path: "/fleet", priority: 0.7 },
  { path: "/my-ui", priority: 0.6 },
  { path: "/profile", priority: 0.4 },
  { path: "/settings", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, priority }) => ({
    url: `${DEPLOYMENT_URL.replace(/\/$/, "")}${path}`,
    lastModified,
    changeFrequency: "weekly",
    priority,
  }));
}
