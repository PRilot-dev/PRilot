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
import { faqCategories } from "@/data/faq";

const organizationJsonLd = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "PRilot",
	url: "https://prilot.dev",
	logo: "https://prilot.dev/logo.png",
	description:
		"AI-powered Pull Request Assistant. Generate, review, and send pull requests automatically.",
};

const softwareJsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "PRilot",
	url: "https://prilot.dev",
	applicationCategory: "DeveloperApplication",
	operatingSystem: "Web",
	description:
		"Generate, review, and send pull requests automatically with AI. Collaborate seamlessly on GitHub and GitLab repositories.",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
		description: "Free plan with up to 30 Pull Requests per month",
	},
};

const faqJsonLd = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: faqCategories.flatMap((category) =>
		category.faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	),
};

export default function LandingPage() {
	return (
		<div className="min-h-screen overflow-x-hidden">
			<script type="application/ld+json">
				{JSON.stringify([organizationJsonLd, softwareJsonLd, faqJsonLd])}
			</script>
			<LandingNavbar />
			<main>
				<HeroSection />
				<FeaturesSection />
				<BenefitsSection />
				<HowItWorksSection />
				<WorkflowSection />
				<ConsistencySection />
				<ExampleSection />
				<FAQSection />
				<CTASection />
			</main>
			<LandingFooter />
		</div>
	);
}
