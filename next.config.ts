import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Lets `next dev` resolve env.DB / env.ATTACHMENTS via getCloudflareContext()
// without needing `wrangler dev` — see wrangler.jsonc for the bindings.
initOpenNextCloudflareForDev();
