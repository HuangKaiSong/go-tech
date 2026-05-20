"use client";

import Link from "@/app/components/Link";
// import Logo from "@/assets/Gotech_Logo.webp";
import {
  Crown,
  LogOut,
  Mail,
  Package,
  Phone,
  Settings,
  User,
} from "lucide-react";
import Image, { StaticImageData } from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useIframeContext } from "@/contexts/IframeContext";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@go-tech-frontend/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageBlock } from "./PageBlocks";

const SelectTenant = ({
  generateCallback,
}: {
  generateCallback: (uri: string) => void;
}) => {
  const router = useRouter();
  const { hasIframe } = useIframeContext();
  const { isLoggedIn, tenants, token } = useAuth();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const handleClick = async (tenant: Tenant) => {
    const response = await fetch(
      `/go-tech/platform/platformCustomer/gotoPmsCode?tenantId=${tenant!.tenantId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-type": "platform_customer",
        },
      }
    ).then(res => res.json());
    if (response.code === 200) {
      const uri = `tenantCallback?code=${response.data}`;
      generateCallback(uri);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div
        className="h-9 w-32 text-xs flex items-center justify-center cursor-pointer text-foreground"
        onClick={() => {
          if (hasIframe) {
            console.warn("在 iframe 中链接点击被阻止");
            return false;
          }
          if (!isLoggedIn) {
            router.push("/account/login");
          }
          setIsOpen(true);
        }}
      >
        點擊前往 GO-PMS
      </div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="flex items-center justify-center gap-2">
              選擇租户
            </DialogTitle>
          </DialogHeader>
          {/* 选择租户 */}
          <div className="grid grid-cols-3 gap-4 items-center justify-center">
            {tenants?.map(tenant => (
              <div
                key={tenant.tenantId}
                onClick={() => handleClick(tenant)}
                className="flex flex-col items-center rounded-lg border-solid border border-transparent py-2 gap-y-2 transition-all hover:border-primary active:hover:border-primary"
              >
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xl">
                    {tenant.tenantName?.slice(0, 1)}
                  </span>
                </div>
                <p className="text-sm font-medium">{tenant.tenantName}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const Header = ({
  heroBg,
  initialBlocks,
}: {
  heroBg?: string | StaticImageData;
  initialBlocks?: PageBlock[];
}) => {
  const t = useTranslations();
  const router = useRouter();
  const { hasIframe } = useIframeContext();
  const { user, isLoggedIn, logout, token, tenants } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const defaultLogoSrc = "/images/Gotech_Logo.webp";
  const block = initialBlocks?.find(block => block.type === "common");
  const {
    logo = defaultLogoSrc,
    phoneValue = "+852 5971 1918",
    emailValue = "info@go-techs.com",
  } = block?.values || {};

  const hasTenant = tenants && tenants.length > 0;
  const pm2Window = useRef<Window | null>(null);

  const handleLogout = async () => {
    setIsSheetOpen(false);
    logout();
  };

  const resolveAction = (value: unknown) => {
    if (typeof value !== "string") return null;
    const normalized = value.toLowerCase();
    if (normalized.includes("service-plan")) return "service-plan";
    if (normalized.includes("trial-env")) return "trial-env";
    if (normalized.includes("order")) return "order";

    return null;
  };

  function cleanup() {
    window.removeEventListener("message", handleMessage);
    window.removeEventListener("pm2Window", handleCustomEvent as EventListener);
  }

  function applyAction(action: "trial-env" | "service-plan" | "order") {
    if (action === "trial-env") {
      tryOut();
      return;
    }
    if (action === "service-plan") {
      pm2Window.current = window.open(`/service-plan`, "_blank");
      router.replace("/service-plan");
      return;
    }
    if (action === "order") {
      pm2Window.current = window.open(`/my-orders`, "_blank");
      router.replace("/my-orders");
      return;
    }
    if (pm2Window.current) {
      pm2Window.current?.close();
    }
    cleanup();
    window.focus();
  }

  function handleMessage(event: MessageEvent) {
    const action = resolveAction(
      event.data?.command ?? event.data?.action ?? event.data?.type
    );
    if (!action) return;
    applyAction(action);
  }

  function handleCustomEvent(event: Event) {
    const detail = (event as CustomEvent).detail;
    const action = resolveAction(
      detail?.command ?? detail?.action ?? detail?.type
    );
    if (!action) return;
    applyAction(action);
  }

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    window.addEventListener("pm2Window", handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener("message", handleMessage);
      window.removeEventListener(
        "pm2Window",
        handleCustomEvent as EventListener
      );
    };
  }, []);

  const generateCallback = (uri: string) => {
    const taialHost = process.env.NEXT_PUBLIC_TRIAL_HOST;

    pm2Window.current = window.open(`${taialHost}/oauth/${uri}`, "_blank");
  };

  const goNow = async () => {
    if (tenants.length === 0) return;
    // 不管有多少个租户, 直接选择倒数第一个跳转
    const tenant = tenants.at(-1);
    const response = await fetch(
      `/go-tech/platform/platformCustomer/gotoPmsCode?tenantId=${tenant!.tenantId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-type": "platform_customer",
        },
      }
    ).then(res => res.json());
    if (response.code === 200) {
      const uri = `tenantCallback?code=${response.data}`;
      generateCallback(uri);
    }
  };

  const tryOut = async () => {
    const response = await fetch(
      "/go-tech/platform/platformCustomer/trialCode",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-type": "platform_customer",
        },
      }
    );
    if (response.ok) {
      const result = await response.json();
      if (result.code === 200) {
        const uri = `tryCallback?code=${result.data}`;
        generateCallback(uri);
      }
    }
  };

  return (
    <div className="h-44 backdrop-blur-xl bg-black/70 text-white/70 overflow-hidden relative select-none">
      {heroBg && (
        <Image
          src={heroBg}
          alt="logo"
          fill
          loading="eager"
          className="w-full h-150 absolute inset-0 -z-10 object-cover"
        />
      )}
      <div className="w-full h-full backdrop-blur-xl">
        <div className="container h-full mx-auto flex flex-row items-center gap-10">
          {/* logo */}
          <Link href="/">
            <img
              src={logo}
              alt="logo"
              data-block-id="common-info"
              data-block-role="logo"
              className={`w-40 ${hasIframe ? "cursor-editor" : ""}`}
            />
          </Link>
          {/* menu */}
          <div className="flex-1 flex flex-col h-full py-4 justify-between">
            <div></div>
            <nav className="hidden  md:flex items-center justify-between gap-4">
              <Link
                href="/core-advantages"
                className="text-lg hover:text-primary transition-colors col-span-1"
              >
                核心優勢
              </Link>
              <div className="h-10 border border-white/70"></div>
              <Link
                href="/system-features"
                className="text-lg hover:text-primary transition-colors col-span-1"
              >
                查看系統功能
              </Link>
              <div className="h-10 border border-white/70"></div>
              <Link
                href="/service-plan"
                className="text-lg hover:text-primary transition-colors col-span-1"
              >
                服務計劃
              </Link>
              <div className="h-10 border border-white/70"></div>
              <Link
                href="/target-audience"
                className="text-lg hover:text-primary transition-colors col-span-1"
              >
                適合人群
              </Link>
              <div className="h-10 border border-white/70"></div>
              <Link
                href="/contact"
                className="text-lg hover:text-primary transition-colors col-span-1"
              >
                聯繫我們
              </Link>
            </nav>
            <div className="grid grid-cols-2 text-sm text-white/80">
              <div
                data-block-id="common-info"
                data-block-role="phone"
                className={`flex items-center justify-center gap-2 ${hasIframe ? "cursor-editor" : ""}`}
              >
                <Phone className="w-12 h-12" />
                <div className="flex flex-col">
                  <div data-block-id="common-info" data-block-role="phoneTitle">
                    Call Us
                  </div>
                  <div data-block-id="common-info" data-block-role="phoneValue">
                    {phoneValue}
                  </div>
                </div>
              </div>
              <div
                data-block-id="common-info"
                data-block-role="email"
                className={`flex items-center justify-center gap-2 ${hasIframe ? "cursor-editor" : ""}`}
              >
                <Mail className="w-12 h-12" />
                <div className="flex flex-col">
                  <div data-block-id="common-info" data-block-role="emailTitle">
                    Mail To Us
                  </div>
                  <div data-block-id="common-info" data-block-role="emailValue">
                    {emailValue}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* operate */}
          <div className="basis-50 flex flex-col h-full py-4 justify-between">
            <div></div>
            <div className="flex flex-row justify-between gap-3 items-center">
              {isLoggedIn && user ? (
                <>
                  <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                      <button className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">
                          {user.nickname}
                        </span>
                        <Crown className="w-4 h-4 text-yellow-400" />
                      </button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80 bg-background">
                      <SheetHeader className="border-b pb-4">
                        <SheetTitle className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold">{user.nickname}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.sub}
                            </p>
                          </div>
                        </SheetTitle>
                      </SheetHeader>
                      <div className="mt-6 space-y-2">
                        <Link
                          href="/my-orders"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Package className="w-5 h-5 text-muted-foreground" />
                          <span>我的訂單</span>
                        </Link>
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          onClick={() => setIsSheetOpen(false)}
                        >
                          <Settings className="w-5 h-5 text-muted-foreground" />
                          <span>{t("Common.setting")}</span>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>{t("Common.logout")}</span>
                        </button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </>
              ) : (
                <Link href="/account/login">
                  <Button className="px-10" size="sm">
                    {t("Common.login")}
                  </Button>
                </Link>
              )}
              {/* <LocaleSwitcher /> */}
            </div>
            <div className="flex flex-row bg-background items-center rounded-l-sm rounded-r-lg">
              {hasTenant ? (
                <>
                  <SelectTenant
                    generateCallback={generateCallback}
                  ></SelectTenant>
                  <Button
                    size="sm"
                    disabled={!isLoggedIn}
                    className="shadow-primary shadow-2xl"
                    onClick={() => goNow()}
                  >
                    立即前往
                  </Button>
                </>
              ) : (
                <>
                  <div
                    className="h-9 w-32 text-xs flex items-center justify-center cursor-pointer text-foreground"
                    onClick={() => {
                      if (hasIframe) {
                        console.warn("在 iframe 中链接点击被阻止");
                        return false;
                      }
                      if (!isLoggedIn) {
                        router.push("/account/login");
                      }
                    }}
                  >
                    點擊立即開始試用
                  </div>
                  <Button
                    size="sm"
                    disabled={!isLoggedIn}
                    className="shadow-primary shadow-2xl"
                    onClick={() => tryOut()}
                  >
                    免費試用
                  </Button>
                </>
              )}
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
