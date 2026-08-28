import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { ok: false, message: "Nâng cấp tier đã được thay bằng mua gói credit. Vui lòng mở /pricing." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { ok: false, message: "Nâng cấp tier đã được thay bằng mua gói credit. Vui lòng mở /pricing." },
    { status: 410 }
  );
}
