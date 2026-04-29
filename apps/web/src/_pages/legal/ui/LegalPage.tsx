import { Header } from '@/widgets/header/ui/Header';
import { Footer } from '@/widgets/footer/ui/Footer';
import { LegalHero } from '@/widgets/legal-page/ui/LegalHero';
import { LegalDocs } from '@/widgets/legal-page/ui/LegalDocs';

export function LegalPage() {
  return (
    <>
      <Header />
      <LegalHero />
      <LegalDocs />
      <Footer />
    </>
  );
}
