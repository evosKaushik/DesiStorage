import { CTA } from "@/features/landing/components/CTA";
import { InteractiveDemo } from "@/features/landing/components/Demo";
import { FAQ } from "@/features/landing/components/FAQs";
import { Features } from "@/features/landing/components/Features";
import { Hero } from "@/features/landing/components/Hero";
import { Pricing } from "@/features/landing/components/Pricing";
import { Security } from "@/features/landing/components/Security";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { Testimonials } from "@/features/landing/components/Testimonials";

export default function Home() {
  return (
    <>
      <SiteNav />
      <Hero />
      <Features />
      <InteractiveDemo />
      <Security />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTA />
    </>
  );
}
