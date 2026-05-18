import { randomInt } from 'node:crypto';

// #47 (backend): projects get a random hue with fixed saturation/lightness,
// stored in the existing project.color (#RRGGBB, varchar(7)).
const SATURATION = 0.65;
const LIGHTNESS = 0.55;

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = (
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  ).map((v) => Math.round((v + m) * 255));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function randomProjectColor(): string {
  return hslToHex(randomInt(360), SATURATION, LIGHTNESS);
}
