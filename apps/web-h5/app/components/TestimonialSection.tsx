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
              業務流程更為正規，更專業
            </p>

            <div className="space-y-3 mb-6">
              <p className="text-foreground font-medium">
                <span className="text-primary">✓</span>{" "}
                資訊同步，原來操作幾幾去尋
              </p>
              <p className="text-muted-foreground text-sm">多終端同步，TPOA</p>
            </div>

            <p className="text-foreground leading-relaxed">
              節省人力成本，讓租務管理更便捷，更高效
            </p>
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
