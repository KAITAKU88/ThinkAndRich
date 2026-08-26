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

export function McpKeysPanel() {
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

  const connectorUrl = freshKey
    ? `${typeof window !== "undefined" ? window.location.origin : ""}${MCP_PATH}?key=${freshKey}`
    : "";

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
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Tên</th>
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
