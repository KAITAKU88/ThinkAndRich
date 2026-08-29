import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";
import { getOAuthClient, redirectUriAllowed } from "@/lib/server/mcp-oauth";

// Consent screen for the MCP OAuth flow. A server component so the session
// check happens before anything renders — the approve button is never shown
// to someone who could not use it.
//
// This lives outside /admin on purpose: middleware protects that prefix by
// redirecting to a login URL carrying only the pathname, which would drop the
// OAuth query parameters. Here the sign-in redirect preserves the whole URL.

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function ErrorPanel({ title, detail }: { title: string; detail: string }) {
  return (
    <main>
      <div>
        <div>
          <AlertTriangle />
          <h1>{title}</h1>
        </div>
        <p>{detail}</p>
      </div>
    </main>
  );
}

export default async function AuthorizePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const single = (key: string): string => {
    const value = params[key];
    return typeof value === "string" ? value : "";
  };

  const clientId = single("client_id");
  const redirectUri = single("redirect_uri");
  const responseType = single("response_type");
  const codeChallenge = single("code_challenge");
  const codeChallengeMethod = single("code_challenge_method") || "S256";
  const state = single("state");
  const resource = single("resource");

  if (!clientId || !redirectUri) {
    return <ErrorPanel title="Yêu cầu không hợp lệ" detail="Thiếu client_id hoặc redirect_uri." />;
  }
  if (responseType && responseType !== "code") {
    return <ErrorPanel title="Không hỗ trợ" detail="Chỉ hỗ trợ response_type=code." />;
  }
  if (!codeChallenge || codeChallengeMethod !== "S256") {
    return (
      <ErrorPanel
        title="Thiếu bảo vệ PKCE"
        detail="Ứng dụng phải gửi code_challenge với code_challenge_method=S256."
      />
    );
  }

  const { env } = getCloudflareContext();
  const client = await getOAuthClient(env.DB, clientId);
  if (!client) {
    return <ErrorPanel title="Ứng dụng chưa đăng ký" detail="Không tìm thấy client_id này." />;
  }
  if (!redirectUriAllowed(client, redirectUri)) {
    return (
      <ErrorPanel
        title="redirect_uri không khớp"
        detail="Địa chỉ chuyển hướng không nằm trong danh sách ứng dụng đã đăng ký."
      />
    );
  }

  // Not signed in (or not an admin) — bounce through the admin login, keeping
  // every OAuth parameter so the flow resumes exactly where it left off.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token, env.JWT_SECRET) : null;
  if (!session || session.role !== "ADMIN") {
    const current = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") current.set(key, value);
    }
    redirect(`/admin/login?from=${encodeURIComponent(`/mcp/authorize?${current.toString()}`)}`);
  }

  return (
    <main>
      <div>
        <div>
          <ShieldCheck />
          <h1>Ủy quyền kết nối</h1>
        </div>

        <p>
          <span>{client.name}</span> muốn kết nối vào Think &amp; Rich với
          quyền soạn và chỉnh sửa <span>bản nháp</span> bài viết.
        </p>

        <ul>
          <li>• Đọc danh sách trụ cột, chuyên mục và bài nháp</li>
          <li>• Tạo bài viết mới ở trạng thái nháp</li>
          <li>• Sửa nội dung bài đang ở trạng thái nháp</li>
        </ul>

        <p>
          Không thể xuất bản, không thể xóa bài, và không đọc được dữ liệu người dùng. Bạn có thể thu hồi quyền bất
          cứ lúc nào trong <span>Admin → MCP Connector</span>.
        </p>

        <div>
          Đăng nhập với tư cách <span>{session.email}</span>
        </div>

        <form action="/api/mcp/oauth/authorize" method="POST">
          <input type="hidden" name="client_id" value={clientId} />
          <input type="hidden" name="redirect_uri" value={redirectUri} />
          <input type="hidden" name="state" value={state} />
          <input type="hidden" name="code_challenge" value={codeChallenge} />
          <input type="hidden" name="code_challenge_method" value={codeChallengeMethod} />
          <input type="hidden" name="resource" value={resource} />
          <button
            type="submit"
          >
            Cho phép kết nối
          </button>
        </form>

        <p>
          Không phải bạn khởi tạo yêu cầu này? Hãy đóng trang lại.
        </p>
      </div>
    </main>
  );
}
