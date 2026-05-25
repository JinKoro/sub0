import { randomInt } from 'node:crypto';

// #43: подписка без иконки сервиса показывает цветной LogoPill с буквой.
// Палитра жёстко зафиксирована из SUB0 design tokens — это гарантирует, что
// цвета согласуются с дизайн-системой (категории, бейджи) и не «вырываются»
// случайным HSL'ом, как у проектов.
const SUBSCRIPTION_PALETTE = [
  '#1347ff', // SUB0.blue
  '#0a7a3f', // SUB0.good
  '#c94a1c', // SUB0.danger
  '#6b21d9', // SUB0.purple
  '#b0851a', // SUB0.warn
  '#0a0a0a', // SUB0.ink
  '#6b6b66', // SUB0.muted
] as const;

export function randomSubscriptionColor(): string {
  return SUBSCRIPTION_PALETTE[randomInt(SUBSCRIPTION_PALETTE.length)]!;
}
