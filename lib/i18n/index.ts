import { es, type Messages } from "./messages/es";

/** Default locale for now. Replace with locale param when en.ts exists. */
export function getMessages(): Messages {
  return es;
}
