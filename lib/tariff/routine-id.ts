export function newRoutineItemId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `ri-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
