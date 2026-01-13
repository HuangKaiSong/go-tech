
import Image from "next/image";
import heroBackground from '@/assets/background.webp'

const HeroSection = () => {
  return (
    <section className="relative min-h-150 w-full flex items-center pt-25">
      <Image 
        src={heroBackground}
        alt="Beautiful house at sunset"
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-xl">
          <h1 className="text-5xl font-bold text-background leading-tight mb-4">
            越多物業，
            <br />
            越易管理！
          </h1>
          <h2 className="text-5xl font-bold text-background mb-6">
            GO-TECH租務系統
          </h2>
          <p className="text-primary text-3xl mb-8">
            專注 分間單位、套房、簡樸房 租務系統。
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
