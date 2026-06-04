import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { PhaseOverview } from "@/components/sections/PhaseOverview";
import { Roadmap } from "@/components/sections/Roadmap";
import { ValueProps } from "@/components/sections/ValueProps";
import { AudienceFit } from "@/components/sections/AudienceFit";
import { FAQ } from "@/components/sections/FAQ";
import { Pricing } from "@/components/sections/Pricing";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <PhaseOverview />
      <Roadmap />
      <ValueProps />
      <AudienceFit />
      <FAQ />
      <Pricing />
      <FinalCTA />
      <Footer />
    </main>
  );
}
