import { MarketingHeader } from './MarketingHeader';
import { CabinetHeader } from './CabinetHeader';

interface Props {
  mode?: 'marketing' | 'cabinet';
}

export function Header({ mode = 'marketing' }: Props) {
  return mode === 'cabinet' ? <CabinetHeader /> : <MarketingHeader />;
}
