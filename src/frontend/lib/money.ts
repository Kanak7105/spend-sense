/** Sum money values in integer paise to avoid floating-point drift. */
export function sumMoney(values: number[]) {
  return values.reduce((total, v) => total + Math.round(v * 100), 0) / 100;
}
