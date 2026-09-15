import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import MobileLayout from "@/components/MobileLayout";
import { resetPassword, sendResetCode } from "@/api/auth";

const inputCls =
  "w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls = "text-xs font-medium text-foreground mb-1.5 block";

const emailValid = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 倒计时（发送后 60 秒内不可重发，与后端冷却一致）
  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  const handleSend = async () => {
    if (!emailValid(email)) return toast.error("請輸入正確的郵箱");
    setSending(true);
    try {
      await sendResetCode({ email: email.trim() });
      toast.success("驗證碼已發送至郵箱，請查收");
      setCountdown(60);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "發送失敗");
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    if (!emailValid(email)) return toast.error("請輸入正確的郵箱");
    if (!code.trim()) return toast.error("請輸入驗證碼");
    if (newPassword.length < 6 || newPassword.length > 32) return toast.error("新密碼長度需為 6~32 位");
    if (newPassword !== confirm) return toast.error("兩次輸入的新密碼不一致");
    setSubmitting(true);
    try {
      await resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      toast.success("密碼重置成功，請使用新密碼登入");
      navigate("/", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "重置失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="忘記密碼">
      <div className="px-5 pt-4 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70"
        >
          <ArrowLeft className="w-4 h-4" />
          返回登入
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">郵箱找回密碼</h2>
            <p className="text-[11px] text-muted-foreground">輸入綁定郵箱，獲取驗證碼後重置密碼</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>綁定郵箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="請輸入員工綁定的郵箱"
                autoComplete="off"
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>郵箱驗證碼</label>
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6 位驗證碼"
                inputMode="numeric"
                maxLength={6}
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || countdown > 0}
                className="shrink-0 px-3 rounded-lg text-sm font-medium border border-primary text-primary active:scale-95 disabled:opacity-50 disabled:border-border disabled:text-muted-foreground"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : countdown > 0 ? (
                  `${countdown}s`
                ) : (
                  "獲取驗證碼"
                )}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>新密碼</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6~32 位，區分大小寫"
                autoComplete="off"
                className={`${inputCls} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-90"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>確認新密碼</label>
            <input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="請再次輸入新密碼"
              autoComplete="off"
              className={inputCls}
            />
          </div>
        </div>

        <button
          onClick={handleReset}
          disabled={submitting}
          className="mt-6 w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "提交中..." : "重置密碼"}
        </button>
      </div>
    </MobileLayout>
  );
};

export default ForgotPassword;
