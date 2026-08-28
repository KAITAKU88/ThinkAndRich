"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Check, Plug, Trash2, ShieldAlert } from "lucide-react";
import { cn, timeAgo } from "@/lib/utils";

// Admin screen for MCP connector credentials. The server hands back the raw
// key exactly once (POST /api/admin/mcp-keys) — after that only its digest
// exists — so the "copy it now" banner is the single chance to save it.

interface McpKey {
  id: string;
  tokenPrefix: string;
  label: string;
  kind: "MANUAL" | "OAUTH";
  createdBy: string;
  scope: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

const MCP_PATH = "/api/mcp";

export function McpKeysPanel({ publicSiteUrl }: { publicSiteUrl: string }) {
  const [keys, setKeys] = useState<McpKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mcp-keys");
      const data = (await res.json()) as { ok: boolean; keys?: McpKey[]; message?: string };
      if (data.ok && data.keys) setKeys(data.keys);
      else setError(data.message ?? "Không tải được danh sách key.");
    } catch {
      setError("Không tải được danh sách key.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate() {
    if (!label.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/mcp-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      const data = (await res.json()) as { ok: boolean; plaintext?: string; message?: string };
      if (data.ok && data.plaintext) {
        setFreshKey(data.plaintext);
        setLabel("");
        setCopied(false);
        await load();
      } else {
        setError(data.message ?? "Tạo key thất bại.");
      }
    } catch {
      setError("Tạo key thất bại.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string, keyLabel: string) {
    if (!confirm(`Thu hồi key "${keyLabel}"? Client đang dùng key này sẽ mất quyền truy cập ngay lập tức.`)) return;
    const res = await fetch(`/api/admin/mcp-keys?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = (await res.json()) as { ok: boolean; message?: string };
    if (data.ok) await load();
    else setError(data.message ?? "Thu hồi thất bại.");
  }

  const origin = publicSiteUrl.replace(/\/$/, "") || (typeof window !== "undefined" ? window.location.origin : "");
  const mcpUrl = `${origin}${MCP_PATH}`;
  const oauthMetadataUrl = `${origin}/.well-known/oauth-protected-resource`;
  const authorizeUrl = `${origin}/mcp/authorize`;

  const connectorUrl = freshKey ? `${mcpUrl}?key=${freshKey}` : "";

  async function copyUrl() {
    await navigator.clipboard.writeText(connectorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeKeys = keys.filter((k) => !k.revokedAt);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plug className="h-5 w-5" />
          MCP Connector
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Key cho phép một phiên AI (Claude.ai / ChatGPT) soạn bài viết đẩy thẳng vào hệ thống dưới dạng bản nháp.
          Key chỉ hiện đúng một lần lúc tạo — hệ thống chỉ lưu bản băm, không lưu key gốc.
        </p>
      </div>

      {/* Two connection methods — this app supports both a static bearer key
          (kind: MANUAL, minted below) and full OAuth (kind: OAUTH, minted
          automatically by /mcp/authorize when a client completes the dance).
          Neither is "the" way to connect; which one an admin needs depends on
          what the AI client's connector settings ask for. */}
      <div className="grid gap-3 lg:grid-cols-2">
        <details className="group rounded-lg border border-border bg-secondary/30 open:bg-secondary/50" open>
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium flex items-center justify-between">
            <span>Hướng dẫn 1 — API Key thủ công</span>
            <span className="text-xs text-muted-foreground group-open:hidden">Mở</span>
          </summary>
          <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              Dùng khi Claude.ai, ChatGPT hoặc một MCP client cho phép dán URL kèm secret, không bắt OAuth.
              Key nằm trong query <code className="text-[11px]">?key=</code>. Hệ thống chỉ lưu bản băm — mất key là phải tạo key mới.
            </p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Đặt tên gợi nhớ (ví dụ «Claude desktop máy A»), bấm <strong className="text-foreground">Tạo key mới</strong>.</li>
              <li>Sao chép ngay URL một lần hiện ra (dạng <code className="text-[11px]">{mcpUrl}?key=…</code>). Đóng banner là không xem lại được.</li>
              <li>
                Claude.ai: Settings → Connectors → Add custom connector. Ô <strong className="text-foreground">Remote MCP server URL</strong> dán nguyên URL có <code className="text-[11px]">?key=</code>. Để trống Client ID và Client Secret.
              </li>
              <li>
                Claude Desktop: trong <code className="text-[11px]">claude_desktop_config.json</code>, thêm server type url, url = URL vừa copy. Không khai báo OAuth.
              </li>
              <li>
                ChatGPT custom GPT / MCP: dán cùng URL vào trường server. Nếu form bắt OAuth, chuyển sang hướng dẫn 2.
              </li>
              <li>Kiểm tra: client liệt kê tool soạn bản nháp. Không có quyền xuất bản hay xóa bài.</li>
              <li>Ngắt: <strong className="text-foreground">Thu hồi</strong> trên hàng key tương ứng — request kế tiếp bị từ chối.</li>
            </ol>
            <p className="text-muted-foreground/90">
              Endpoint: <code className="text-[11px] break-all text-foreground">{mcpUrl}</code>
            </p>
          </div>
        </details>

        <details className="group rounded-lg border border-border bg-secondary/30 open:bg-secondary/50" open>
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium flex items-center justify-between">
            <span>Hướng dẫn 2 — OAuth</span>
            <span className="text-xs text-muted-foreground group-open:hidden">Mở</span>
          </summary>
          <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              Dùng khi client bắt buộc OAuth 2.1 (Claude.ai Custom Connector kiểu «Sign in», hoặc client tự động phát hiện metadata).
              Không tạo key thủ công. Sau khi bạn bấm Cho phép, một hàng loại OAuth xuất hiện trong bảng dưới.
            </p>
            <ol className="space-y-2 list-decimal list-inside">
              <li>
                Dán đúng URL gốc, không có query: <code className="text-[11px] break-all text-foreground">{mcpUrl}</code>
              </li>
              <li>Để trống Client ID / Client Secret. Client tự gọi đăng ký động (RFC 7591) tại <code className="text-[11px]">/api/mcp/oauth/register</code>.</li>
              <li>
                Client đọc metadata tại <code className="text-[11px] break-all">{oauthMetadataUrl}</code> rồi mở trình duyệt tới màn hình ủy quyền:{" "}
                <code className="text-[11px] break-all">{authorizeUrl}</code>
              </li>
              <li>Phải đăng nhập bằng tài khoản admin (OTP). Nếu chưa đăng nhập, hệ thống đưa tới trang đăng nhập admin rồi trả lại đúng chỗ.</li>
              <li>Đọc phạm vi: chỉ tạo/sửa bản nháp, không xuất bản, không xóa. Bấm <strong className="text-foreground">Cho phép kết nối</strong>.</li>
              <li>Quay lại client — kết nối hiện trong bảng với nhãn OAuth. Thu hồi giống API Key.</li>
            </ol>
            <p>
              Lưu ý: URL MCP phải là hostname trang công khai ({origin || "thinkandrich.ankiva.cc"}), không phải hostname admin.
              OAuth redirect không chạy nếu dán nhầm host console.
            </p>
          </div>
        </details>
      </div>

      {/* One-time reveal */}
      {freshKey && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 space-y-3">
          <div className="flex items-start gap-2 text-sm font-medium">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
            <span>Sao chép ngay — key này sẽ không hiển thị lại lần nào nữa.</span>
          </div>
          <div className="rounded border border-border bg-background p-3 font-mono text-xs break-all">
            {connectorUrl}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Đã sao chép" : "Sao chép URL connector"}
            </button>
            <button
              onClick={() => setFreshKey(null)}
              className="rounded-md border border-border px-3 py-1.5 text-xs hover:bg-secondary"
            >
              Tôi đã lưu key
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Dán URL trên vào ô &quot;Remote MCP server URL&quot; khi thêm custom connector, để trống hai ô OAuth.
          </p>
        </div>
      )}

      {/* Create */}
      <div className="flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Tên key (ví dụ: Claude.ai của tôi)"
          className="w-full sm:flex-1 sm:min-w-[220px] rounded-md border border-border bg-background px-3 py-2 text-sm"
        />
        <button
          onClick={handleCreate}
          disabled={!label.trim() || creating}
          className="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {creating ? "Đang tạo..." : "Tạo key mới"}
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* List */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : keys.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có key nào. Tạo key đầu tiên ở trên.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Tên</th>
                <th className="py-2 pr-4 font-medium">Loại</th>
                <th className="py-2 pr-4 font-medium">Key</th>
                <th className="py-2 pr-4 font-medium">Tạo bởi</th>
                <th className="py-2 pr-4 font-medium">Dùng lần cuối</th>
                <th className="py-2 pr-4 font-medium">Trạng thái</th>
                <th className="py-2 font-medium sr-only">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className={cn("border-b border-border/60", k.revokedAt && "opacity-50")}>
                  <td className="py-2.5 pr-4 font-medium">{k.label}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        k.kind === "OAUTH"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {k.kind === "OAUTH" ? "OAuth" : "API Key"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{k.tokenPrefix}…</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">{k.createdBy}</td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                    {k.lastUsedAt ? timeAgo(k.lastUsedAt) : "Chưa dùng"}
                  </td>
                  <td className="py-2.5 pr-4">
                    {k.revokedAt ? (
                      <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">
                        Đã thu hồi
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                        Đang hoạt động
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    {!k.revokedAt && (
                      <button
                        onClick={() => handleRevoke(k.id, k.label)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Thu hồi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeKeys.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Đang có {activeKeys.length} key hoạt động. Thu hồi key sẽ chặn client tương ứng ngay ở request kế tiếp.
        </p>
      )}
    </div>
  );
}
