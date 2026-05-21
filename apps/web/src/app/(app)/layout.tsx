import { cookies } from 'next/headers';
import { Header } from '@/widgets/header/ui/Header';
import { CabinetProvider } from '@/shared/contexts/cabinet-context';
import { ProfileProvider } from '@/shared/contexts/profile-context';
import { ProfileSync } from '@/shared/contexts/profile-sync';
import { ProjectsProvider } from '@/shared/contexts/projects-context';
import { CUR_COOKIE, parseCurrency } from '@/shared/lib/pref-cookies';

export default async function CabinetLayout({ children }: { children: React.ReactNode }) {
  const currency = parseCurrency((await cookies()).get(CUR_COOKIE)?.value);
  return (
    <ProfileProvider>
      <CabinetProvider initialCurrency={currency}>
        <ProjectsProvider>
          <ProfileSync />
          <Header mode="cabinet" />
          <main>{children}</main>
        </ProjectsProvider>
      </CabinetProvider>
    </ProfileProvider>
  );
}
