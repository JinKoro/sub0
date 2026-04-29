import { Header } from '@/widgets/header/ui/Header';
import { Footer } from '@/widgets/footer/ui/Footer';
import { ContactsHero } from '@/widgets/contacts-page/ui/ContactsHero';
import { ContactsBody } from '@/widgets/contacts-page/ui/ContactsBody';

export function ContactsPage() {
  return (
    <>
      <Header />
      <ContactsHero />
      <ContactsBody />
      <Footer />
    </>
  );
}
