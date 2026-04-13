const ALL_WHITESPACE_REGEX = /[\p{Z}\p{C}\s]+/gu;

const EDGE_WHITESPACE_REGEX =
  /^[\s\u00A0\u1680\u180E\u2000-\u200D\u2028\u2029\u202F\u205F\u2060\u3000\uFEFF]+|[\s\u00A0\u1680\u180E\u2000-\u200D\u2028\u2029\u202F\u205F\u2060\u3000\uFEFF]+$/g;

const EMAIL_ALLOWED_CHARS_REGEX = /[^A-Za-z0-9.!#$%&'*+/=?^_`{|}~@-]/g;

export function sanitizeNoWhitespace(value: string): string {
  return String(value ?? "").replace(ALL_WHITESPACE_REGEX, "");
}

export function sanitizeTrimEdges(value: string): string {
  return String(value ?? "").replace(EDGE_WHITESPACE_REGEX, "");
}

export function sanitizeNormalizeWhitespace(value: string): string {
  const normalizedValue = String(value ?? "").replace(ALL_WHITESPACE_REGEX, " ");
  return sanitizeTrimEdges(normalizedValue);
}

export function sanitizeEmailCredential(value: string): string {
  return sanitizeNoWhitespace(value).replace(EMAIL_ALLOWED_CHARS_REGEX, "");
}
