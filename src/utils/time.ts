export const hourLabelIndices = Array.from({ length: 11 }, (_, i) => i * 6);

export function fmtHourLabel(index: number): string {
  const hour24 = 12 + Math.floor(index / 6);
  const display = hour24 > 12 ? hour24 - 12 : hour24;
  return `${display}${hour24 >= 12 && hour24 < 24 ? 'p' : 'a'}`;
}
