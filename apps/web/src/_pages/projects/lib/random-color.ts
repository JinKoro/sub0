// HSL → hex, mirroring the design file (projects-page.jsx).
// Constrained so generated colors are punchy but readable on white.
function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const k = (n: number): number => (n + h / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number): number =>
    Math.round(255 * (ln - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return (
    '#' +
    [f(0), f(8), f(4)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Brand-adjacent random color; avoids yellow-green band where text contrast
 * suffers. Tries up to 12 times to differ from `prev` (re-shuffle UX).
 */
export function randomProjectHex(prev?: string): string {
  for (let i = 0; i < 12; i += 1) {
    const h = Math.floor(Math.random() * 360);
    const s = 58 + Math.floor(Math.random() * 28); // 58–85
    const l = 36 + Math.floor(Math.random() * 16); // 36–51
    const hex = hslToHex(h, s, l);
    if (hex !== prev) return hex;
  }
  return hslToHex(Math.floor(Math.random() * 360), 70, 45);
}
