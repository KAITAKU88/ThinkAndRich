import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ExplorePage } from "@/components/explore/ExplorePage";
import { getPublicPosts } from "@/lib/server/public-posts";

export const revalidate = 60;

export const metadata = {
  title: "Khám phá Thư viện Mô hình Tư duy & Chiến lược — Think & Rich",
  description:
    "Tìm kiếm và lọc các mô hình tư duy, mô hình tâm trí và chiến lược kinh doanh theo chuyên mục, thời lượng đọc, video và thẻ chủ đề.",
};

export default async function Page() {
  // ISR (`revalidate = 60`) prerenders this route; sync
  // getCloudflareContext() is illegal there and `next build` exits.
  const { env } = await getCloudflareContext({ async: true });
  const initialPosts = await getPublicPosts(env.DB, { pageSize: 200 });
  return <ExplorePage initialPosts={initialPosts} />;
}
