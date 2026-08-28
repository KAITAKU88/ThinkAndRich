import { NextResponse, type NextRequest } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { appSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/api-auth";
import { sendAuthOtp } from "@/lib/server/send-otp";
import { consumeOtp, normalizeOtpCode } from "@/lib/server/otp";
import {
  generateRecoveryCode,
  hashRecoveryCode,
  ownerEmailFromEnv,
  OWNER_RECOVERY_HASH_KEY,
} from "@/lib/owner-recovery";

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const db = drizzle(ctx.env.DB);
  const stored = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, OWNER_RECOVERY_HASH_KEY))
    .get();

  return NextResponse.json({
    ok: true,
    loginEmail: ctx.session.email,
    ownerEmail: ownerEmailFromEnv(ctx.env),
    recoveryConfigured: Boolean(stored?.value),
  });
}

export async function POST(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (!ctx) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as
    | { action?: string; code?: string }
    | null;
  const action = body?.action;
  const ownerEmail = ownerEmailFromEnv(ctx.env);
  if (!ownerEmail) {
    return NextResponse.json(
      { ok: false, message: "Chưa cấu hình OWNER_EMAIL / ADMIN_EMAILS." },
      { status: 500 }
    );
  }

  const db = drizzle(ctx.env.DB);
  const stored = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, OWNER_RECOVERY_HASH_KEY))
    .get();
  const configured = Boolean(stored?.value);

  if (action === "request-otp") {
    if (!configured) {
      return NextResponse.json({ ok: false, message: "Chưa có mã để xoay vòng." }, { status: 400 });
    }
    await sendAuthOtp(ctx.env, ownerEmail, "tạo mã khôi phục mới");
    return NextResponse.json({ ok: true, needsOtp: true });
  }

  if (action !== "generate") {
    return NextResponse.json({ ok: false, message: "Yêu cầu không hợp lệ." }, { status: 400 });
  }

  if (configured) {
    const code = normalizeOtpCode(body?.code ?? "");
    if (code.length !== 6) {
      return NextResponse.json(
        { ok: false, message: "Cần OTP gửi tới email chủ sở hữu để tạo mã mới." },
        { status: 400 }
      );
    }
    if (!(await consumeOtp(db, ownerEmail, code))) {
      return NextResponse.json(
        { ok: false, message: "Mã OTP không chính xác hoặc đã hết hạn." },
        { status: 401 }
      );
    }
  }

  const recoveryCode = generateRecoveryCode();
  const hash = await hashRecoveryCode(recoveryCode);
  const now = new Date().toISOString();
  await db
    .insert(appSettings)
    .values({
      key: OWNER_RECOVERY_HASH_KEY,
      value: hash,
      updatedAt: now,
      updatedBy: ctx.session.email,
    })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: hash, updatedAt: now, updatedBy: ctx.session.email },
    });

  return NextResponse.json({
    ok: true,
    recoveryCode,
    recoveryConfigured: true,
    loginEmail: ctx.session.email,
    ownerEmail,
  });
}
