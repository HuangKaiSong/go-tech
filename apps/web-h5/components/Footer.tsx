import Logo from "@/assets/Gotech_Logo.webp";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <Image src={Logo} alt="logo" className="w-full max-w-30" />
          <div>
            <h4 className="font-semibold mb-4">方案/費用</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-primary transition-colors">方案介紹</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">了解費用</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">服務/支援</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-primary transition-colors">使用說明/教學</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">聯絡我們</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">關於我們</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><a href="#" className="hover:text-primary transition-colors">公司簡介</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">查看品牌</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-background/20 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-background/50">
          <p>© 2024 GO-TECH 版權所有</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">使用條款</a>
            <a href="#" className="hover:text-primary transition-colors">隱私政策</a>
            <a href="#" className="hover:text-primary transition-colors">公司條款</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
