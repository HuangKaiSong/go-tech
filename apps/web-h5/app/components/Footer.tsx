import Logo from "@/assets/Gotech_Logo.webp";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <Image src={Logo} alt="logo" className="w-full max-w-30" />
          <div>
            <h4 className="font-semibold mb-4">公司業務</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>
                <a href="/system-features" className="hover:text-primary transition-colors">
                  租賃管理
                </a>
              </li>
              <li>
                <a href="/system-features" className="hover:text-primary transition-colors">
                  收租管理
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">服務對象</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>
                <a href="/target-audience" className="hover:text-primary transition-colors">
                  PMS系統訂閱者
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">關於我們</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>
                <a href="/service-plan" className="hover:text-primary transition-colors">
                  服務計劃
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-primary transition-colors">
                  聯繫我們
                </a>
              </li>
            </ul>
          </div>

          <div>
            <ul className="space-y-2 text-sm text-background/70">
              <li>
                <a href="/free-trial" className="hover:text-primary transition-colors">
                  立即試用
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-background/50">
          <p>版權所有：GO-TECHS 2024@</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="/legal-agreement/terms/terms-of-use" className="hover:text-primary transition-colors">
              服務條款
            </a>
            <a href="/legal-agreement/terms/privacy" className="hover:text-primary transition-colors">
              私隱政策
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
