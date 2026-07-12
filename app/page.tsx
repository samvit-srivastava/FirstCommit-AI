import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-300">
      <Header />
      <main>
        <Hero />
        <FeatureCards />
      </main>
      <Footer />
    </div>
  );
}
