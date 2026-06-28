import { cookies } from "next/headers";
import type { Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get("locale")?.value;
  return raw === "en" ? "en" : "id";
}
