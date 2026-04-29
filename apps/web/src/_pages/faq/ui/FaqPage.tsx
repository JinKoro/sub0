import { Header } from '@/widgets/header/ui/Header';
import { Footer } from '@/widgets/footer/ui/Footer';
import { FaqHero } from '@/widgets/faq-page/ui/FaqHero';
import { FaqSections } from '@/widgets/faq-page/ui/FaqSections';

export function FaqPage() {
  return (
    <>
      <Header />
      <FaqHero />
      <FaqSections />
      <Footer />
    </>
  );
}
