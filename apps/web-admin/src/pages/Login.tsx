import { Experience, canUseNebula } from '@go-tech-frontend/three';
import { Button, Input } from '@go-tech-frontend/ui';
import { useMutation } from '@tanstack/react-query';
import { useKeyPress } from 'ahooks';
import { Eye, EyeOff } from 'lucide-react';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Logo from '@/assets/images/Gotech_Logo.webp';
import TechCursor from '@/components/TechCursor';
import VideoPlayer from '@/components/VideoPlayer';
import { useAuth } from '@/hooks/use-auth';
import Dotline from '@/hooks/use-dotline';
import { type WeightedOption, weightedRandom } from '@/utils/weighted-random';

type AnimateType = 'dotline' | 'experience' | 'static' | 'video';

const animateType: readonly WeightedOption<AnimateType>[] = [
  {
    option: 'experience',
    weight: 0.7
  },
  {
    option: 'video',
    weight: 0.6
  },
  {
    option: 'dotline',
    weight: 0.2
  }
];

const selectedEffectType = weightedRandom(animateType);
const effectType: AnimateType = selectedEffectType === 'experience' && !canUseNebula() ? 'static' : selectedEffectType;

const StaticLoginBackground = () => (
  <div
    className="absolute inset-0 overflow-hidden bg-[#070b16] text-white"
    style={{
      backgroundImage: `
        radial-gradient(circle at 16% 22%, rgba(249, 115, 22, 0.2), transparent 30%),
        radial-gradient(circle at 82% 72%, rgba(37, 99, 235, 0.18), transparent 34%),
        linear-gradient(135deg, #070b16 0%, #0b1224 52%, #10182c 100%)
      `
    }}
    aria-hidden="true"
  >
    <div
      className="absolute inset-0 opacity-25"
      style={{
        backgroundImage: `
          linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px)
        `,
        backgroundSize: '52px 52px',
        maskImage: 'linear-gradient(to bottom, black, transparent 88%)'
      }}
    />

    <div
      className="absolute inset-0 opacity-35"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 1px, transparent 1.5px)',
        backgroundSize: '84px 84px',
        backgroundPosition: '18px 12px'
      }}
    />

    <div className="absolute left-[7vw] top-[9vh] hidden items-center gap-4 md:flex">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/8">
        <img src={Logo} alt="" className="h-10 w-10 object-contain" />
      </div>
      <div>
        <p className="text-sm font-semibold tracking-[0.28em] text-white/90">GO-TECH</p>
        <p className="mt-1 text-[11px] tracking-[0.2em] text-slate-400">ADMIN CONSOLE</p>
      </div>
    </div>

    <div className="absolute -bottom-52 -right-40 h-[34rem] w-[34rem] rounded-full border border-blue-400/15" />
    <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full border border-orange-400/15" />
    <div className="absolute bottom-[12vh] left-[8vw] hidden max-w-sm md:block">
      <div className="mb-5 h-px w-16 bg-orange-500/80" />
      <p className="text-3xl font-semibold leading-tight tracking-tight text-white/95">让管理更清晰，让协作更高效</p>
      <p className="mt-4 text-sm leading-6 text-slate-400">统一、安全、可靠的数字化管理平台</p>
    </div>

    <div className="absolute right-[6vw] top-[10vh] hidden items-center gap-2 text-[10px] tracking-[0.22em] text-slate-500 lg:flex">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      SYSTEM READY
    </div>
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useAuth();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const threeDom = useRef<HTMLCanvasElement>(null);
  // const [effectType, setEffectType] = useState<AnimateType>(() => weightedRandom(animateType));

  // 获取来源页面路径
  const from = location.state?.from || '/';

  const loginMutation = useMutation({
    mutationFn: async () => {
      if (!account || !password) {
        throw new Error('請填寫所有欄位');
      }
      const response = await fetch(`${import.meta.env.VITE_PROXY_PREFIX}/go-tech/platform/platformAdmin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: account,
          password
        })
      });
      return response.json();
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: result => {
      if (result && result.code === 200) {
        setToken(result.data.token);
        setIsLoading(false);

        console.log(from);

        navigate(from, { replace: true });
      } else {
        setIsLoading(false);
        toast.error(result.message);
      }
    },
    onError: error => {
      toast.error(error.message);
      setIsLoading(false);
    }
  });

  useKeyPress(['Enter'], () => {
    if (isLoading || loginMutation.isPending) {
      return;
    }

    // 如果按键被一直按住，event.repeat返回值为true

    loginMutation.mutate();
  });

  useEffect(() => {
    if (effectType === 'dotline') {
      new Dotline({ dom: 'dotline', cw: 2000, ch: 1000, ds: 150 }).start();
      return;
    }

    if (effectType !== 'experience') return;

    const canvas = threeDom.current;
    if (!canvas) return;

    const experience = new Experience(canvas);
    // oxlint-disable eslint/no-underscore-dangle
    window._experience = experience;

    return () => {
      experience.destroy();
      // oxlint-disable eslint/no-underscore-dangle
      window._experience = null;
    };
  }, [effectType]);

  const renderAnimate = (type: AnimateType) => {
    if (!type) return null;
    switch (type) {
      case 'experience':
        return (
          <>
            <TechCursor />
            <canvas
              ref={threeDom as RefObject<HTMLCanvasElement>}
              className="three-canvas relative inset-0 "
              style={{ pointerEvents: 'none', zIndex: -1 }}
            />
          </>
        );
      case 'video':
        return <VideoPlayer url="/videos/yhkt_linglong_version1.mp4" />;
      case 'dotline':
        return <canvas id="dotline" className="absolute inset-0" />;
      default:
        return <StaticLoginBackground />;
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden relative">
      {renderAnimate(effectType)}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-100 rounded-xl bg-white shadow-xl p-10">
        <h1 className="text-2xl font-bold text-center text-foreground mb-8">账户登录</h1>
        <div className="space-y-6">
          <div>
            <Input
              type="text"
              placeholder="請輸入您的電子郵箱/手機號碼"
              value={account}
              onChange={e => setAccount(e.target.value)}
              className="h-14 text-base border-border"
            />
          </div>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="請輸入您的密碼"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="h-14 text-base border-border pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <Button
            type="submit"
            disabled={isLoading || !account || !password}
            onClick={() => loginMutation.mutate()}
            className="w-full h-14 text-lg font-semibold bg-primary/80 hover:bg-primary hover:text-primary-foreground disabled:opacity-50 transition-colors"
          >
            {isLoading ? '登入中...' : '登入'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
