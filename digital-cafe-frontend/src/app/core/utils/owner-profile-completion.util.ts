export interface OwnerProfileCompletionSource {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export function getOwnerMissingRegistrationFields(
  source: OwnerProfileCompletionSource | null | undefined,
): string[] {
  const missing: string[] = [];
  if (!String(source?.firstName || "").trim()) {
    missing.push("First Name");
  }
  if (!String(source?.lastName || "").trim()) {
    missing.push("Last Name");
  }
  if (!String(source?.email || "").trim()) {
    missing.push("Email");
  }
  if (!String(source?.phoneNumber || "").trim()) {
    missing.push("Phone Number");
  }
  return missing;
}

export function getOwnerRegistrationCompletion(
  source: OwnerProfileCompletionSource | null | undefined,
): number {
  const total = 4;
  const missing = getOwnerMissingRegistrationFields(source);
  const filled = total - missing.length;
  return Math.round((filled * 100) / total);
}
