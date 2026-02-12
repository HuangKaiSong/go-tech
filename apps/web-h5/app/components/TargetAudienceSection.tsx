'use client'

import { audiences } from '@/app/components/blockDefaults';
import Link from "@/app/components/Link";
import { useIframeContext } from "@/contexts/IframeContext";
import { Button } from "@go-tech-frontend/ui";
import Image from "next/image";

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
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="text-xl font-bold text-foreground mb-3">
                      {audience.title}
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
