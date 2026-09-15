import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import MobileLayout from "@/components/MobileLayout";
import { changePassword } from "@/api/auth";
import { clearToken } from "@/lib/auth";

const inputCls =
  "w-full border border-border rounded-lg px-3 py-2.5 pr-10 text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";
const labelCls = "text-xs font-medium text-foreground mb-1.5 block";

/** 带右侧显隐切换的密码输入 */
const PasswordInput = ({
  onChange,
  placeholder,
  value,
}: {
  onChange: (v: string) => void;
  placeholder: string;
  value: string;
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={inputCls}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground active:scale-90"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!oldPassword) return toast.error("請輸入原密碼");
    if (!newPassword) return toast.error("請輸入新密碼");
    if (newPassword.length < 6 || newPassword.length > 32) return toast.error("新密碼長度需為 6~32 位");
    if (newPassword === oldPassword) return toast.error("新密碼不可與原密碼相同");
    if (newPassword !== confirm) return toast.error("兩次輸入的新密碼不一致");
    setSubmitting(true);
    try {
      await changePassword({ oldPassword, newPassword });
      toast.success("密碼已修改，請使用新密碼重新登入");
      // 改密后旧 token 仍有效，但为安全起见清除登录态、回到登录页
      clearToken();
      navigate("/", { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "修改失敗");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileLayout title="修改密碼">
      <div className="px-5 pt-4 pb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 active:opacity-70"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">修改密碼</h2>
            <p className="text-[11px] text-muted-foreground">為保障帳號安全，請定期更換密碼</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>原密碼</label>
            <PasswordInput value={oldPassword} onChange={setOldPassword} placeholder="請輸入原密碼" />
          </div>
          <div>
            <label className={labelCls}>新密碼</label>
            <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="6~32 位，區分大小寫" />
          </div>
          <div>
            <label className={labelCls}>確認新密碼</label>
            <PasswordInput value={confirm} onChange={setConfirm} placeholder="請再次輸入新密碼" />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "提交中..." : "確認修改"}
        </button>
      </div>
    </MobileLayout>
  );
};

export default ChangePassword;
