'use client'

import Link from "@/app/components/Link";
import individualOwner from "@/assets/individual-owner.jpg";
import investorProperty from "@/assets/investor-property.jpg";
import { useIframeContext } from "@/contexts/IframeContext";
import { Button } from "@go-tech-frontend/ui";
import Image from "next/image";

const audiences = [
  {
    number: "01",
    title: "Individual Owner",
    subtitle: "持有1至3個物業的個人業主",
    description:
      "管理一次兩到三個, 並打通程序實現同步, 簡化管理, 讓一切井然有序。",
    image: individualOwner,
    align: "left" as const,
  },
  {
    number: "02",
    title: "Investor Owner",
    subtitle: "持有多只物業或結合物業投資業主",
    description: "投資一兩棟物業? 所有物業資料在雲端集中處理, 讓投資更輕鬆。",
    image: investorProperty,
    align: "right" as const,
  },
  {
    number: "03",
    title: "Body Property Owner",
    subtitle: "長期租賃不在本地的海外業主",
    description: "遙距管理物業? 隨時隨地透過系統查看物業狀況, 讓管理無距離。",
    image: individualOwner,
    align: "left" as const,
  },
];

const TargetAudienceSection = () => {
  const { hasIframe } = useIframeContext();

  return (
    <section className="py-16 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-foreground">
            適合人群/Target Audience
          </h2>
          <Link href="/target-audience">
            <Button variant="default" size="sm">
              查看更多
            </Button>
          </Link>
        </div>

        <div className={`space-y-8 ${hasIframe ? "cursor-editor" : ""}`}>
          {audiences.map((audience, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                audience.align === "right"
                  ? "md:flex-row-reverse"
                  : "md:flex-row"
              } gap-6 items-center bg-background rounded-xl overflow-hidden shadow-sm`}
            >
              <div className="w-full md:w-2/5 h-64 md:h-80">
                <Image
                  src={audience.image}
                  alt={audience.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full md:w-3/5 p-6 md:p-10">
                <div className="flex items-start gap-4">
                  <span className="text-4xl font-bold text-primary opacity-50">
                    {audience.number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-1">
                      {audience.title}
                    </h3>
                    <h4 className="text-xl font-bold text-foreground mb-3">
                      {audience.subtitle}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">
                      {audience.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;
