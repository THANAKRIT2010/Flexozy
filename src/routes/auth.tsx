import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
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
const otpSchema = z.string().regex(/^\d{6}$/, "รหัส OTP ต้องเป็นตัวเลข 6 หลัก");

// Which supabase.auth.verifyOtp "type" to use once the user submits their code.
type PendingVerification = { email: string; type: "signup" | "email" } | null;

const RESEND_COOLDOWN_SECONDS = 60;

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Passwordless-login email field, kept separate from signin/signup email
  // so switching tabs doesn't leak state between flows.
  const [otpEmail, setOtpEmail] = useState("");

  const [pending, setPending] = useState<PendingVerification>(null);
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/" });
    });
  }, [navigate]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1 && cooldownTimer.current) clearInterval(cooldownTimer.current);
        return s - 1;
      });
    }, 1000);
  }

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
      // Deliberately vague: never reveal whether the email exists.
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
    const { data, error } = await supabase.auth.signUp({
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
    // With email confirmation required (recommended in Supabase Auth
    // settings), no session comes back yet — the account isn't usable
    // until the OTP is verified. That's what stops throwaway/spoofed
    // emails from creating live accounts.
    if (!data.session) {
      setPending({ email: parsed.data.email, type: "signup" });
      setOtp("");
      startCooldown();
      toast.success("ส่งรหัส OTP ไปที่อีเมลแล้ว กรอกรหัส 6 หลักเพื่อยืนยันตัวตน");
      return;
    }
    toast.success("สมัครสมาชิกสำเร็จ");
    void navigate({ to: "/" });
  }

  async function requestOtpLogin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(otpEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "อีเมลไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    // shouldCreateUser: false — an OTP-login request must never silently
    // create a new account for an arbitrary email address someone typed in.
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      toast.error("ส่งรหัส OTP ไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }
    setPending({ email: parsed.data, type: "email" });
    setOtp("");
    startCooldown();
    toast.success("ส่งรหัส OTP ไปที่อีเมลแล้ว");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!pending) return;
    const parsed = otpSchema.safeParse(otp);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "รหัส OTP ไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: pending.email,
      token: parsed.data,
      type: pending.type,
    });
    setLoading(false);
    if (error) {
      toast.error("รหัส OTP ไม่ถูกต้องหรือหมดอายุ");
      return;
    }
    toast.success("ยืนยันตัวตนสำเร็จ");
    setPending(null);
    void navigate({ to: "/" });
  }

  async function resendOtp() {
    if (!pending || cooldown > 0) return;
    setLoading(true);
    const { error } =
      pending.type === "signup"
        ? await supabase.auth.resend({ type: "signup", email: pending.email })
        : await supabase.auth.signInWithOtp({ email: pending.email, options: { shouldCreateUser: false } });
    setLoading(false);
    if (error) {
      toast.error("ส่งรหัสใหม่ไม่สำเร็จ ลองอีกครั้งในภายหลัง");
      return;
    }
    startCooldown();
    toast.success("ส่งรหัส OTP ใหม่แล้ว");
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

  if (pending) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="surface-card rounded-3xl p-8">
          <div className="mb-6 flex justify-center">
            <Brand />
          </div>
          <h2 className="text-center text-lg font-semibold">ยืนยันรหัส OTP</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            กรอกรหัส 6 หลักที่ส่งไปที่ {pending.email}
          </p>
          <form onSubmit={verifyOtp} className="mt-6 flex flex-col items-center gap-4">
            <InputOTP maxLength={6} value={otp} onChange={setOtp} pattern="^[0-9]*$">
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <Button type="submit" className="w-full rounded-full" disabled={loading || otp.length !== 6}>
              ยืนยัน
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
              disabled={cooldown > 0 || loading}
              onClick={resendOtp}
            >
              {cooldown > 0 ? `ส่งรหัสใหม่ได้ใน ${cooldown} วิ` : "ส่งรหัสอีกครั้ง"}
            </button>
            <button
              type="button"
              className="text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setPending(null)}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="surface-card rounded-3xl p-8">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-3 rounded-full">
            <TabsTrigger value="signin" className="rounded-full">
              เข้าสู่ระบบ
            </TabsTrigger>
            <TabsTrigger value="signup" className="rounded-full">
              สมัครสมาชิก
            </TabsTrigger>
            <TabsTrigger value="otp" className="rounded-full">
              OTP
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
                สมัครสมาชิก (ยืนยันด้วย OTP)
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="otp">
            <form onSubmit={requestOtpLogin} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp-email">อีเมล</Label>
                <Input
                  id="otp-email"
                  type="email"
                  value={otpEmail}
                  maxLength={255}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                ใช้สำหรับบัญชีที่มีอยู่แล้วเท่านั้น ไม่ต้องใช้รหัสผ่าน — ระบบจะส่งรหัส 6 หลักไปยืนยันตัวตนทางอีเมล
              </p>
              <Button type="submit" className="w-full rounded-full" disabled={loading}>
                ส่งรหัส OTP
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
