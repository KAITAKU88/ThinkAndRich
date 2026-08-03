"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSession } from "@/store/session";

export function AuthDialog() {
  const authOpen = useSession((s) => s.authOpen);
  const setAuthOpen = useSession((s) => s.setAuthOpen);
  const login = useSession((s) => s.login);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const asAdmin = email.toLowerCase().includes("admin");
    login(email, { asAdmin });
    setLoading(false);
    toast.success(
      asAdmin
        ? "Đăng nhập Admin (mock magic link)."
        : "Đã gửi mã — đăng nhập thành công (mock)."
    );
    setEmail("");
  }

  return (
    <Dialog open={authOpen} onOpenChange={setAuthOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đăng nhập IdeaVault</DialogTitle>
          <DialogDescription>
            Không cần mật khẩu. Chúng tôi gửi mã đăng nhập tới email của bạn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="auth-email">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="ban@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Tip demo: email chứa &quot;admin&quot; → quyền Quản trị.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <Mail className="h-4 w-4" />
            {loading ? "Đang gửi..." : "Gửi mã đăng nhập"}
          </Button>
        </form>

        <div className="relative my-2">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs uppercase tracking-widest text-muted-foreground">
            hoặc
          </span>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              login("google.user@gmail.com");
              toast.success("Đăng nhập Google (mock).");
            }}
          >
            Tiếp tục với Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              login("fb.user@facebook.com");
              toast.success("Đăng nhập Facebook (mock).");
            }}
          >
            Tiếp tục với Facebook
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
