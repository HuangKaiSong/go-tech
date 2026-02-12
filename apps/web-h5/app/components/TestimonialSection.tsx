'use client'

import homeOffice from "@/assets/home-office.jpg";
import { useIframeContext } from "@/contexts/IframeContext";
import Image from "next/image";

const TestimonialSection = () => {
  const { hasIframe } = useIframeContext();
  return (
    <section className="py-16 bg-background">
      <div
        className={`container mx-auto px-4 ${hasIframe ? "cursor-editor" : ""}`}
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-6xl text-primary/20 font-serif mb-4">"</div>
            <h3 className="text-xl font-bold text-foreground mb-4">
              更標準，更高效的管理方式
            </h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              業務流程更規範、更專業，讓租務管理有章可循、執行一致。
            </p>

            <div className="space-y-3 mb-6 text-sm text-muted-foreground">
              <div >
                - 資訊集中與同步：所有物業、租約、收租、維修與文件資料統一管理，減少四處翻查與重複輸入。
              </div>
              <div>
                - 多終端使用：支援電腦與手機等多裝置操作，隨時查看與跟進。
              </div>
              <div>
                - 節省人力成本：以清晰流程與集中管理減少人手投入，提升整體處理效率，讓租務管理更便捷、更高效。
              </div>
            </div>

          </div>

          <div className="rounded-xl overflow-hidden shadow-lg">
            <Image
              src={homeOffice}
              alt="Modern workspace"
              className="w-full h-80 object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
