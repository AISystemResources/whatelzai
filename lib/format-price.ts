const SYMBOLS: Record<string, string> = {
  sgd: "S$",
  usd: "US$",
  eur: "€",
  gbp: "£",
};

export function formatMinorUnits(minor: number, currency: string): string {
  const sym = SYMBOLS[currency.toLowerCase()] ?? `${currency.toUpperCase()} `;
  const major = minor / 100;
  const rounded = Number.isInteger(major) ? major.toString() : major.toFixed(2);
  return `${sym}${rounded}`;
}
