const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatMoney(amount: number, currency = "MNT"): string {
  const sign = amount < 0 ? "−" : "";
  const value = number.format(Math.abs(amount));
  return currency === "MNT" ? `${sign}${value}₮` : `${sign}${value} ${currency}`;
}

export function formatPercent(ratio: number | null): string {
  return ratio === null ? "—" : `${Math.round(ratio * 100)}%`;
}

export function ratio(part: number, whole: number): number | null {
  return whole > 0 ? part / whole : null;
}
