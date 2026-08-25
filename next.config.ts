import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  async rewrites() {
    // OAuth discovery lives at fixed /.well-known/* URLs, but the App Router
    // ignores directories whose name begins with a dot, so those paths are
    // mapped onto a normal route handler here.
    //
    // Each document is also exposed with a trailing path segment: RFC 8414
    // and RFC 9728 tell a client whose resource has a path (/api/mcp) to look
    // under /.well-known/<doc>/api/mcp, and clients differ over which form
    // they try first.
    return [
      {
        source: "/.well-known/oauth-authorization-server",
        destination: "/api/mcp/oauth/metadata?doc=authorization-server",
      },
      {
        source: "/.well-known/oauth-authorization-server/:path*",
        destination: "/api/mcp/oauth/metadata?doc=authorization-server",
      },
      {
        source: "/.well-known/oauth-protected-resource",
        destination: "/api/mcp/oauth/metadata?doc=protected-resource",
      },
      {
        source: "/.well-known/oauth-protected-resource/:path*",
        destination: "/api/mcp/oauth/metadata?doc=protected-resource",
      },
    ];
  },
};

export default nextConfig;

// Lets `next dev` resolve env.DB / env.ATTACHMENTS via getCloudflareContext()
// without needing `wrangler dev` — see wrangler.jsonc for the bindings.
initOpenNextCloudflareForDev();
