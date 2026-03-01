import BenefitsSection from "@/components/landing/BenefitsSection";
import ConsistencySection from "@/components/landing/ConsistencySection";
import CTASection from "@/components/landing/CTASection";
import ExampleSection from "@/components/landing/ExampleSection";
import FAQSection from "@/components/landing/FAQSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingNavbar from "@/components/landing/LandingNavbar";
import WorkflowSection from "@/components/landing/WorkflowSection";

export default function LandingPage() {
	return (
		<div className="min-h-screen overflow-x-hidden">
			<LandingNavbar />
			<HeroSection />
			<FeaturesSection />
			<BenefitsSection />
			<HowItWorksSection />
			<WorkflowSection />
			<ConsistencySection />
			<ExampleSection />
			<FAQSection />
			<CTASection />
			<LandingFooter />
		</div>
	);
}
