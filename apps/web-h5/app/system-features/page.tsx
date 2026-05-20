import { defaultSystemFeaturesBlocks } from "@/app/components/blockDefaults";
import { loadPageBlocks } from "@/app/lib/pageBlocks";
import Footer from "../components/Footer";
import Header from "../components/Header";
import HeroSection from "../components/HeroSection";

const SystemFeatures = async () => {
  const blocks = await loadPageBlocks(
    "system-features",
    defaultSystemFeaturesBlocks
  );

  const heroBackground =
    blocks?.find(block => block.type === "hero")?.backgroundImage || "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header heroBg={heroBackground} initialBlocks={blocks} />
      <HeroSection initialBlocks={blocks} page="system-features" />
      <Footer />
    </div>
  );
};

export default SystemFeatures;
