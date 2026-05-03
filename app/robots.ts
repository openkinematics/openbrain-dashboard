import type { MetadataRoute } from "next";

/**
 * Operator dashboards aren't useful in search results — search hits land on
 * unconnected app pages with no context, and customer deployments shouldn't
 * surface robot URLs / activity logs to crawlers. Direct shares (Slack/X
 * unfurl) still work because they read OG metadata, not the index.
 *
 * If a deployment ever wants discoverability, swap this for `allow: "/"` and
 * remove the `robots` block in `app/layout.tsx`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
