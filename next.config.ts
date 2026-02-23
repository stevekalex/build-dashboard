import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Operational pages: inbox, approve, ready-to-send, closing
    dashboard: {
      stale: 15,
      revalidate: 15,
      expire: 300,
    },
    // Analytics pages: pulse, pipeline
    analytics: {
      stale: 60,
      revalidate: 60,
      expire: 3600,
    },
  },
};

export default withSentryConfig(nextConfig);
