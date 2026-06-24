import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-black/70 text-white/80 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 mb-8">
          <Image src="/images/Gotech_Logo.webp" alt="logo" width={120} height={120} className="w-full max-w-30" />
          <div>
            <h4 className="font-semibold mb-4">公司業務</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/system-features" className="hover:text-primary transition-colors">
                  租賃管理
                </Link>
              </li>
              <li>
                <Link href="/system-features" className="hover:text-primary transition-colors">
                  收租管理
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">服務對象</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/target-audience" className="hover:text-primary transition-colors">
                  PMS系統訂閱者
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">關於我們</h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li>
                <Link href="/service-plan" className="hover:text-primary transition-colors">
                  服務計劃
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  聯繫我們
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <ul className="space-y-2 text-sm text-white/80">
              <li>
                <Link href="/free-trial" className="hover:text-primary transition-colors">
                  立即試用
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-white/70">
          <p>版權所有：GO-TECHS 2024@</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/legal-agreement/terms/refund" className="hover:text-primary transition-colors">
              退款政策
            </Link>
            <Link href="/legal-agreement/terms/terms-of-use" className="hover:text-primary transition-colors">
              服務條款
            </Link>
            <Link href="/legal-agreement/terms/privacy" className="hover:text-primary transition-colors">
              私隱政策
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
