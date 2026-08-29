"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const user = useSession((s) => s.user);
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Nhập email để nhận mã OTP 6 chữ số, rồi xác nhận để đăng nhập.
          </p>
          <Button onClick={() => setAuthOpen(true)}>
            Mở form đăng nhập
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
