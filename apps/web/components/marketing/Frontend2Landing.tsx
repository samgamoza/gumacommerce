import Background from "@/components/marketing/guma/Background";
import ScrollProgress from "@/components/marketing/guma/ScrollProgress";
import Nav from "@/components/marketing/guma/Nav";
import Hero from "@/components/marketing/guma/Hero";
import BeforeAfter from "@/components/marketing/guma/BeforeAfter";
import HowItWorks from "@/components/marketing/guma/HowItWorks";
import BentoGrid from "@/components/marketing/guma/BentoGrid";
import Pricing from "@/components/marketing/guma/Pricing";
import SocialProof from "@/components/marketing/guma/SocialProof";
import ClosingCTA from "@/components/marketing/guma/ClosingCTA";
import Footer from "@/components/marketing/guma/Footer";

/** frontend2 — the Guma One.ai landing. Dark theme scoped to `.guma-landing`. */
export function Frontend2Landing() {
  return (
    <div className="guma-landing relative min-h-screen">
      <Background />
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <BeforeAfter />
        <HowItWorks />
        <BentoGrid />
        <SocialProof />
        <Pricing />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
