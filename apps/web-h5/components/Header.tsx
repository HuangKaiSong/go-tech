import Link from "@/components/Link";
import Image, { StaticImageData } from "next/image";
import { Settings, Phone, Mail, MapPin, User, Package, LogOut, Crown, ArrowRightLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import Logo from "@/assets/Gotech_Logo.webp";

import { Button, Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@go-tech-frontend/ui";
import { ni18nConfig } from "@/ni18n.config";
import { GetServerSideProps } from "next";
import { loadTranslations } from "ni18n";
import { useState } from "react";
import { useIframeContext } from "@/contexts/IframeContext";

const Header = ({ heroBg }: { heroBg?: string | StaticImageData }) => {
  const { t } = useTranslation("common");
  const { hasIframe } = useIframeContext();

  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = () => {
    setIsSheetOpen(false);
    setIsLoggedIn(false);
    // todo: do logout logic here
  }

  return (
    <div className="h-44 backdrop-blur-xl bg-foreground overflow-hidden relative select-none">
      {heroBg && (
        <Image
          src={heroBg}
          alt="logo"
          loading="eager"
          className="w-full h-150 absolute inset-0 -z-10 object-cover"
        />
      )}
      <div className="w-full h-full backdrop-blur-xl">
        <div className="container h-full mx-auto flex flex-row items-center gap-10">
          {/* logo */}
          <Link href="/">
            <Image src={Logo} alt="logo" className={`w-40 ${hasIframe ? 'cursor-editor' : ''}`} />
          </Link>
          {/* menu */}
          <div className="flex-1 flex flex-col h-full py-4 justify-between">
            <div></div>
            <nav className="hidden  md:flex items-center justify-between gap-4">
              <Link
                href="/core-advantages"
                className="text-lg text-white hover:text-primary transition-colors col-span-1"
              >
                核心優勢
              </Link>
              <div className="h-10 border border-white"></div>
              <Link
                href="/system-features"
                className="text-lg text-white hover:text-primary transition-colors col-span-1"
              >
                查看系統功能
              </Link>
              <div className="h-10 border border-white"></div>
              <Link
                href="/service-plan"
                className="text-lg text-white hover:text-primary transition-colors col-span-1"
              >
                服務計劃
              </Link>
              <div className="h-10 border border-white"></div>
              <Link
                href="/target-audience"
                className="text-lg text-white hover:text-primary transition-colors col-span-1"
              >
                適合人群
              </Link>
              <div className="h-10 border border-white"></div>
              <Link
                href="/contact"
                className="text-lg text-white hover:text-primary transition-colors col-span-1"
              >
                聯繫我們
              </Link>
            </nav>
            <div className="grid grid-cols-3 text-sm">
              <div className={`flex items-end gap-2 text-white ${hasIframe ? 'cursor-editor' : ''}`}>
                <Phone className="w-12 h-12" />
                <div className="flex flex-col">
                  <div>Call us</div>
                  <div>+652 8888 8888</div>
                </div>
              </div>
              <div className={`flex items-end gap-2 text-white ${hasIframe ? 'cursor-editor' : ''}`}>
                <Mail className="w-12 h-12" />
                <div className="flex flex-col">
                  <div>Mail to us</div>
                  <div>info@go-tech.com</div>
                </div>
              </div>
              <div className={`flex items-end gap-2 text-white ${hasIframe ? 'cursor-editor' : ''}`}>
                <MapPin className="w-12 h-12" />
                <div className="flex flex-col">
                  <div>Address</div>
                  <div>香港九龍觀塘道123號</div>
                </div>
              </div>
            </div>
          </div>
          {/* operate */}
          <div className="basis-50 flex flex-col h-full py-4 justify-between">
            <div></div>
            <div className="flex flex-row justify-between gap-3 items-center">
              {isLoggedIn ? (
                <>
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <button className="flex items-center gap-2 text-white hover:text-primary transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">王小明</span>
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
                        <p className="font-semibold">王小明</p>
                        <p className="text-sm text-muted-foreground">user@example.com</p>
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
                      <span>設定</span>
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>登出</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
                </>
              ) : (
                <Link href="/account/login">
                  <Button className="px-10" size="sm">
                    {t("login")}
                  </Button>
                </Link>
              )}
              <div className="flex flex-row gap-2 text-white text-sm items-center">
                <div>繁簡</div>
                <ArrowRightLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-row items-center">
              <div className="h-9 w-32 bg-background rounded-l-sm text-xs flex items-center justify-center cursor-pointer">
                点击立即开始试用
              </div>
              <Button
                size="sm"
                className="shadow-primary shadow-2xl -translate-x-1"
              >
                免費試用
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (props) => {
  return {
    props: {
      ...(await loadTranslations(ni18nConfig, props.locale, ["common"])),
    },
  };
};

export default Header;
