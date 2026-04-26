export function fmtRub(
  n: number,
  opts: { short?: boolean; withUnit?: boolean } = {}
): string {
  const { short = false, withUnit = true } = opts
  const rounded = Math.round(n)
  const spaced = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  if (!withUnit) return spaced
  return short ? spaced + '₽' : spaced + ' ₽'
}
