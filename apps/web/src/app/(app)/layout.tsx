import { Header } from '@/widgets/header/ui/Header';
import { CabinetProvider } from '@/shared/contexts/cabinet-context';

export default function CabinetLayout({ children }: { children: React.ReactNode }) {
  return (
    <CabinetProvider>
      <Header mode="cabinet" />
      <main>{children}</main>
    </CabinetProvider>
  );
}
