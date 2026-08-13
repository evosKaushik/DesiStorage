import { CTA } from "@/components/landing/CTA";
import { InteractiveDemo } from "@/components/landing/Demo";
import { FAQ } from "@/components/landing/FAQs";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";
import { Security } from "@/components/landing/Security";
import { SiteNav } from "@/components/landing/SiteNav";
import { Testimonials } from "@/components/landing/Testimonials";

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
