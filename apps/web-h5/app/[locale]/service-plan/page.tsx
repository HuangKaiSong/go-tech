import type { PackageBizCode } from '@go-tech/types';
import Footer from '@/app/components/Footer';
import Header from '@/app/components/Header';
import { buildPackageCatalog } from '@/app/lib/package-catalog';
import servicePlanBg from '@/assets/service-plan-bg.jpg';
import { getBaseUrl } from '@/lib/http';
import { DynamicText } from '../../components/DynamicI18nText';
import PricingCard from './_renderPackage';
import EmptyCatalog from './EmptyCatalog';

import { type ExtendedPackages, buildServicePlans } from './service-plan-data';

const ServicePlan = async ({ searchParams }: { searchParams: Promise<{ product?: string | string[] }> }) => {
  let packages: ExtendedPackages[] = [];
  const baseUrl = getBaseUrl();
  const productParam = (await searchParams).product;
  const requestedProduct = Array.isArray(productParam) ? productParam[0] : productParam;
  const product: PackageBizCode = requestedProduct === 'hr' ? 'hr' : 'pms';
  const hasProduct = requestedProduct === 'hr' || requestedProduct === 'pms';

  try {
    const packagesData = (await fetch(`${baseUrl}/go-tech/platform/platformPackage/enabledList`).then(res =>
      res.json()
    )) as unknown;
    const productPlans = buildPackageCatalog(packagesData)[product].filter(
      currentPackage => (currentPackage.detail?.packageKind || 'plan') === 'plan'
    );

    packages = buildServicePlans(productPlans);
  } catch (error) {
    packages = [];
    console.log(error);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 bg-cover bg-center" style={{ backgroundImage: `url(${servicePlanBg.src})` }}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            <DynamicText text="服務計劃" />
          </h1>
          <p className="text-lg text-primary/80">Service plan</p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      {hasProduct ? <PricingCard packages={packages} product={product} /> : <EmptyCatalog />}
      <Footer />
    </div>
  );
};

export default ServicePlan;
