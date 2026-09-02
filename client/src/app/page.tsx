import dynamic from "next/dynamic";
import SmoothScroll from "@/components/SmoothScroll";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { Hero } from "@/features/landing/components/Hero";

const Features = dynamic(
  () => import("@/features/landing/components/Features").then((m) => m.Features),
  { loading: () => <div className="min-h-[300px]" /> },
);
const InteractiveDemo = dynamic(
  () => import("@/features/landing/components/Demo").then((m) => m.InteractiveDemo),
  { loading: () => <div className="min-h-[480px]" /> },
);
const Security = dynamic(
  () => import("@/features/landing/components/Security").then((m) => m.Security),
  { loading: () => <div className="min-h-[300px]" /> },
);
const Pricing = dynamic(
  () => import("@/features/landing/components/Pricing").then((m) => m.Pricing),
  { loading: () => <div className="min-h-[300px]" /> },
);
const Testimonials = dynamic(
  () => import("@/features/landing/components/Testimonials").then((m) => m.Testimonials),
  { loading: () => <div className="min-h-[200px]" /> },
);
const FAQ = dynamic(
  () => import("@/features/landing/components/FAQs").then((m) => m.FAQ),
  { loading: () => <div className="min-h-[250px]" /> },
);
const CTA = dynamic(
  () => import("@/features/landing/components/CTA").then((m) => m.CTA),
  { loading: () => <div className="min-h-[200px]" /> },
);

export default function Home() {
  return (
    <>
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
