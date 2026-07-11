import { Hero } from "@/components/landing/Hero";
import { UrlInput } from "@/components/landing/UrlInput";
import { FeatureCards } from "@/components/landing/FeatureCards";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <Hero />
        <UrlInput />
        <FeatureCards />
      </main>
      <Footer />
    </div>
  );
}
