import { Header } from '@/widgets/header/ui/Header'
import { Hero } from '@/widgets/home-page/ui/Hero'
import { Problem } from '@/widgets/home-page/ui/Problem'
import { Solution } from '@/widgets/home-page/ui/Solution'
import { ForWhom } from '@/widgets/home-page/ui/ForWhom'
import { DashboardPreview } from '@/widgets/home-page/ui/DashboardPreview'
import { Notifications } from '@/widgets/home-page/ui/Notifications'
import { Pricing } from '@/widgets/home-page/ui/Pricing'
import { SocialProof } from '@/widgets/home-page/ui/SocialProof'
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
      <ForWhom />
      <DashboardPreview />
      <Notifications />
      <Pricing />
      <SocialProof />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  )
}
