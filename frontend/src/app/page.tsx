import LandingNavbar from "@/components/landing/LandingNavbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import SocialProof from "@/components/landing/SocialProof";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <LandingNavbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <SocialProof />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
