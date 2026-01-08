import { HeroSection } from "../components/sections/HeroSection";
import { PersonaValueProps } from "../components/sections/PersonaValueProps";
import { CodeComparisonSection } from "../components/sections/CodeComparisonSection";
import { ExampleCodeSection } from "../components/sections/ExampleCodeSection";
import { TestimonialsSection } from "../components/sections/TestimonialsSection";
import { WhatsCatchSection } from "../components/sections/WhatsCatchSection";
import { FAQSection } from "../components/sections/FAQSection";
import { CommunitySection } from "../components/sections/CommunitySection";
import { CTAFooterSection } from "../components/sections/CTAFooterSection";

export function SectionsPreview() {
  return (
    <div className="min-h-screen bg-black">
      {/* Navigation for preview */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="text-white text-sm hover:text-neutral-300">
            ← Back to main site
          </a>
          <span className="text-neutral-500 text-sm">iii Preview</span>
        </div>
      </nav>

      {/* Section components */}
      <div className="pt-12">
        <HeroSection />
        {/* <PersonaValueProps /> */}
        {/* <CodeComparisonSection /> */}
        <ExampleCodeSection />
        <TestimonialsSection />
        <WhatsCatchSection />
        <FAQSection />
        <CommunitySection />
        <CTAFooterSection />
      </div>
    </div>
  );
}
