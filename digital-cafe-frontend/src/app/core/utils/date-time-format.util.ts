export function uppercaseMeridiem(value: string): string {
  return String(value || "").replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
}
