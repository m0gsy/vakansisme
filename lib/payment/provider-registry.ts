import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentProvider } from "./providers/types";
import { ManualTransferProvider } from "./providers/manual-transfer";

const providerFactories = new Map<string, (supabase: SupabaseClient) => PaymentProvider>();

export function registerProvider(name: string, factory: (supabase: SupabaseClient) => PaymentProvider): void {
  providerFactories.set(name, factory);
}

export function getProvider(name: string, supabase: SupabaseClient): PaymentProvider {
  const factory = providerFactories.get(name);
  if (!factory) {
    throw new Error(`Payment provider "${name}" not registered`);
  }
  return factory(supabase);
}

export function getProviderForPayment(payment: { provider: string }, supabase: SupabaseClient): PaymentProvider {
  return getProvider(payment.provider, supabase);
}

registerProvider("manual_transfer", (supabase) => new ManualTransferProvider(supabase));
