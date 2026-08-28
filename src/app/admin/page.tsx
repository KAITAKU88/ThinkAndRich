import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AdminPage } from "@/components/admin/AdminPage";
import { publicSiteUrl } from "@/lib/public-site-url";

export const dynamic = "force-dynamic";

export default function Page() {
  const { env } = getCloudflareContext();
  return <AdminPage publicSiteUrl={publicSiteUrl(env.PUBLIC_HOST)} />;
}
