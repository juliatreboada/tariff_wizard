/** Strip to digits; phone valid if 9–15 digits remain. */
export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

/** Optional participation number: alphanumeric, spaces, hyphens. */
export function isValidParticipationNumber(raw: string): boolean {
  if (raw.trim() === "") return true;
  return /^[\w\s-]{1,32}$/u.test(raw.trim());
}

export function trimOptional(value: string | undefined): string | undefined {
  const t = value?.trim();
  return t === "" ? undefined : t;
}
