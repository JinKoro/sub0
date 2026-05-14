import { useCabinet } from '@/shared/contexts/cabinet-context';
import { curSymbol, fromRub } from '@/shared/constants/cabinet';

export function useFormatRub() {
  const { currency } = useCabinet();
  const sym = curSymbol(currency);
  return (rub: number) => {
    const val = Math.round(fromRub(rub, currency));
    const spaced = String(val).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return spaced + ' ' + sym;
  };
}
