import type { Metadata } from "next";
import { AppBanner } from "@/components/home/AppBanner";
import { CtaSection } from "@/components/home/CtaSection";
import { FaqSection } from "@/components/home/FaqSection";
import { HeroSection } from "@/components/home/HeroSection";
import { PortfolioSection } from "@/components/home/PortfolioSection";
import { PricingSection } from "@/components/home/PricingSection";
import { ProcessSection } from "@/components/home/ProcessSection";
import { ServicesShowcase } from "@/components/home/ServicesShowcase";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ValuePillars } from "@/components/home/ValuePillars";
import { Reveal } from "@/components/ui/Reveal";
import { siteConfig } from "@/data/site";
import { buildFaqJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: `${siteConfig.name} | ${siteConfig.tagline}`,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  const faqJsonLd = buildFaqJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HeroSection />
      <TrustStrip />
      <Reveal>
        <ValuePillars />
      </Reveal>
      <Reveal>
        <ServicesShowcase />
      </Reveal>
      <Reveal>
        <PortfolioSection />
      </Reveal>
      <Reveal>
        <ProcessSection />
      </Reveal>
      <Reveal>
        <PricingSection />
      </Reveal>
      <Reveal>
        <AppBanner />
      </Reveal>
      <Reveal>
        <TestimonialsSection />
      </Reveal>
      <Reveal>
        <FaqSection />
      </Reveal>
      <Reveal>
        <CtaSection />
      </Reveal>
    </>
  );
}
