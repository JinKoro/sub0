import { Header } from '@/widgets/header/ui/Header';
import { Footer } from '@/widgets/footer/ui/Footer';
import { ReviewsHero } from '@/widgets/reviews-page/ui/ReviewsHero';
import { ReviewsBody } from '@/widgets/reviews-page/ui/ReviewsBody';

export function ReviewsPage() {
  return (
    <>
      <Header />
      <ReviewsHero />
      <ReviewsBody />
      <Footer />
    </>
  );
}
