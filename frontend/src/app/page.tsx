import { auth } from "@clerk/nextjs/server";
import {
  LandingCitationSection,
  LandingCta,
  LandingFeatures,
  LandingFooter,
  LandingHero,
  LandingHowItWorks,
  LandingNav,
} from "@/components/marketing/landing";

export default async function HomePage() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);

  return (
    <main className="min-h-screen bg-surface">
      <LandingNav signedIn={signedIn} />
      <LandingHero signedIn={signedIn} />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCitationSection />
      <LandingCta signedIn={signedIn} />
      <LandingFooter />
    </main>
  );
}
