/** Plain HTML for MCP OAuth consent — no React UI layer. */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BASE_STYLE = `
  body { font-family: Georgia, 'Times New Roman', serif; background: #f7f4eb; color: #16291d; margin: 0; padding: 2rem; line-height: 1.5; }
  main { max-width: 32rem; margin: 0 auto; background: #fbfaf5; border: 2px solid #20271f; box-shadow: 8px 8px 0 #20271f; padding: 1.75rem; }
  h1 { font-size: 1.5rem; margin: 0 0 1rem; }
  p, li { font-family: Arial, sans-serif; font-size: 0.9375rem; color: #53645b; }
  ul { padding-left: 1.25rem; }
  button, .btn { font-family: Arial, sans-serif; background: #193c25; color: #fbfaf5; border: 2px solid #16291d; padding: 0.75rem 1.25rem; font-weight: 700; cursor: pointer; box-shadow: 4px 4px 0 #d4ad4f; }
  code { font-size: 0.8125rem; background: #ece8d9; padding: 0.125rem 0.375rem; }
`;

export function mcpConsentErrorHtml(title: string, detail: string): string {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/><title>${esc(title)}</title><style>${BASE_STYLE}</style></head><body><main><h1>${esc(title)}</h1><p>${esc(detail)}</p></main></body></html>`;
}

export function mcpConsentLoginHtml(): string {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/><title>Đăng nhập admin</title><style>${BASE_STYLE}</style></head><body><main>
    <h1>Cần phiên quản trị</h1>
    <p>Ủy quyền MCP yêu cầu tài khoản <strong>ADMIN</strong>. Xác thực qua API rồi tải lại trang này:</p>
    <ol>
      <li><code>POST /api/auth/request-otp</code> — body <code>{"email":"..."}</code></li>
      <li><code>POST /api/auth/verify-otp</code> — body <code>{"email":"...","code":"..."}</code> (cookie session được set)</li>
      <li>Tải lại URL ủy quyền OAuth</li>
    </ol>
  </main></body></html>`;
}

export function mcpConsentApproveHtml(input: {
  clientName: string;
  adminEmail: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  resource: string;
}): string {
  return `<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/><title>Ủy quyền MCP</title><style>${BASE_STYLE}</style></head><body><main>
    <h1>Ủy quyền kết nối MCP</h1>
    <p><strong>${esc(input.clientName)}</strong> muốn kết nối Think &amp; Rich với quyền soạn/chỉnh <strong>bản nháp</strong> bài viết.</p>
    <ul>
      <li>Đọc danh sách trụ cột, chuyên mục và bài nháp</li>
      <li>Tạo bài viết mới ở trạng thái nháp</li>
      <li>Sửa nội dung bài đang ở trạng thái nháp</li>
    </ul>
    <p>Không xuất bản, không xóa bài, không đọc dữ liệu người dùng. Thu hồi qua <code>DELETE /api/admin/mcp-keys</code>.</p>
    <p>Đăng nhập: <strong>${esc(input.adminEmail)}</strong></p>
    <form action="/api/mcp/oauth/authorize" method="POST">
      <input type="hidden" name="client_id" value="${esc(input.clientId)}" />
      <input type="hidden" name="redirect_uri" value="${esc(input.redirectUri)}" />
      <input type="hidden" name="state" value="${esc(input.state)}" />
      <input type="hidden" name="code_challenge" value="${esc(input.codeChallenge)}" />
      <input type="hidden" name="code_challenge_method" value="${esc(input.codeChallengeMethod)}" />
      <input type="hidden" name="resource" value="${esc(input.resource)}" />
      <button type="submit">Cho phép kết nối</button>
    </form>
  </main></body></html>`;
}
