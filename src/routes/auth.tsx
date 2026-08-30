import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brand } from "@/components/site/Brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — FLEXZY STORE" },
      { name: "description", content: "เข้าสู่ระบบหรือสมัครสมาชิก FLEXZY STORE เพื่อซื้อสินค้าและใช้บริการ" },
      { property: "og:title", content: "เข้าสู่ระบบ — FLEXZY STORE" },
      { property: "og:description", content: "เข้าสู่ระบบหรือสมัครสมาชิก FLEXZY STORE" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("อีเมลไม่ถูกต้อง").max(255);
const passwordSchema = z.string().min(8, "รหัสผ่านอย่างน้อย 8 ตัวอักษร").max(72);
const usernameSchema = z
  .string()
  .trim()
  .min(3, "ชื่อผู้ใช้อย่างน้อย 3 ตัวอักษร")
  .max(24, "ชื่อผู้ใช้ยาวเกินไป")
  .regex(/^[A-Za-z0-9_.]+$/, "ใช้ได้เฉพาะ A-Z 0-9 _ .");

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/" });
    });
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.object({ email: emailSchema, password: passwordSchema }).safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("เข้าสู่ระบบไม่สำเร็จ: อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    toast.success("ยินดีต้อนรับกลับมา");
    void navigate({ to: "/" });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z
      .object({ email: emailSchema, password: passwordSchema, username: usernameSchema })
      .safeParse({ email, password, username });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { username: parsed.data.username },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("สมัครสมาชิกสำเร็จ");
    void navigate({ to: "/" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="surface-card rounded-3xl p-8">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2 rounded-full">
            <TabsTrigger value="signin" className="rounded-full">
              เข้าสู่ระบบ
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-full">
              สมัครสมาชิก
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={signIn} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="si-email">อีเมล</Label>
                <Input id="si-email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="si-pass">รหัสผ่าน</Label>
                <Input id="si-pass" type="password" value={password} maxLength={72} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                เข้าสู่ระบบ
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={signUp} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="su-user">ชื่อผู้ใช้</Label>
                <Input id="su-user" value={username} maxLength={24} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-email">อีเมล</Label>
                <Input id="su-email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="su-pass">รหัสผ่าน</Label>
                <Input id="su-pass" type="password" value={password} maxLength={72} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                สมัครสมาชิก
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> หรือ <span className="h-px flex-1 bg-border" />
        </div>
        <Button variant="secondary" className="w-full rounded-full" onClick={google}>
          เข้าสู่ระบบด้วย Google
        </Button>
      </div>
    </div>
  );
}
