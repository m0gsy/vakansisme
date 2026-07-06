import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  PaymentProvider,
  ProviderPaymentResult,
  VerifyResult,
  PaymentInstruction,
} from "./types";
import type { Payment } from "@/types/payment";
import { PaymentRepository } from "@/lib/repositories/payment.repository";

export class ManualTransferProvider implements PaymentProvider {
  readonly name = "manual_transfer";
  readonly displayName = "Manual Bank Transfer";
  private paymentRepo: PaymentRepository;

  constructor(supabase: SupabaseClient) {
    this.paymentRepo = new PaymentRepository(supabase);
  }

  async createPayment(): Promise<ProviderPaymentResult> {
    const bankAccounts = await this.paymentRepo.getActiveBankAccounts();
    const qrisAccounts = await this.paymentRepo.getActiveQrisAccounts();

    const instructions: PaymentInstruction[] = [];

    for (const bank of bankAccounts) {
      instructions.push({
        type: "bank_transfer",
        label: bank.bank_name,
        value: `${bank.account_number}\na.n. ${bank.account_name}`,
      });
    }

    for (const qris of qrisAccounts) {
      instructions.push({
        type: "qris",
        label: qris.name,
        value: qris.name,
        imageUrl: qris.image_url,
      });
    }

    instructions.push({
      type: "instruction",
      label: "Setelah Transfer",
      value: "Upload bukti transfer di halaman pembayaran untuk verifikasi oleh admin.",
    });

    return { success: true, instructions };
  }

  async verifyPayment(): Promise<VerifyResult> {
    return { isPaid: false, providerStatus: "manual_verification" };
  }

  async cancelPayment(): Promise<boolean> {
    return true;
  }

  async refundPayment(): Promise<boolean> {
    return true;
  }

  async expirePayment(): Promise<boolean> {
    return true;
  }

  generateInstructions(payment: Payment): PaymentInstruction[] {
    void payment;
    return [];
  }
}
