import { Header } from '@/widgets/header/ui/Header'
import { Hero } from '@/widgets/home-page/ui/Hero'
import { Problem } from '@/widgets/home-page/ui/Problem'
import { Solution } from '@/widgets/home-page/ui/Solution'
import { HowItWorks } from '@/widgets/home-page/ui/HowItWorks'
import { Tools } from '@/widgets/home-page/ui/Tools'
import { ForWhom } from '@/widgets/home-page/ui/ForWhom'
import { DashboardPreview } from '@/widgets/home-page/ui/DashboardPreview'
import { Pricing } from '@/widgets/home-page/ui/Pricing'
import { SocialProof } from '@/widgets/home-page/ui/SocialProof'
import { Resources } from '@/widgets/home-page/ui/Resources'
import { FAQ } from '@/widgets/home-page/ui/FAQ'
import { FinalCTA } from '@/widgets/home-page/ui/FinalCTA'
import { Footer } from '@/widgets/footer/ui/Footer'

export function MainPage() {
  return (
    <>
      <Header />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <Tools />
      <ForWhom />
      <DashboardPreview />
      <Pricing />
      <SocialProof />
      <Resources />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  )
}
