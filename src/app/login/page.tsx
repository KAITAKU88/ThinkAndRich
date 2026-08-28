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
    <div className="container mx-auto max-w-md px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Nhập email để nhận mã OTP 6 chữ số, rồi xác nhận để đăng nhập.
          </p>
          <Button className="w-full" onClick={() => setAuthOpen(true)}>
            Mở form đăng nhập
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
