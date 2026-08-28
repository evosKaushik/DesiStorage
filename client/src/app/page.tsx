import { Hero } from "@/features/landing/components/Hero";
import { SiteNav } from "../features/landing/components/SiteNav";
import { Features } from "@/features/landing/components/Features";
import { InteractiveDemo } from "@/features/landing/components/Demo";
import { Security } from "@/features/landing/components/Security";
import { Pricing } from "@/features/landing/components/Pricing";
import { Testimonials } from "@/features/landing/components/Testimonials";
import { FAQ } from "@/features/landing/components/FAQs";
import { CTA } from "@/features/landing/components/CTA";
import SmoothScroll from "@/components/SmoothScroll";

export default function Home() {
  return (
    <>
      {/* Smooth Scroll */}
      <SmoothScroll />

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
