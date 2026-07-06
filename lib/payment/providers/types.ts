import type { Payment } from "@/types/payment";

export type ProviderPaymentResult = {
  success: boolean;
  providerPaymentId?: string;
  redirectUrl?: string;
  instructions?: PaymentInstruction[];
  error?: string;
};

export type PaymentInstruction = {
  type: "bank_transfer" | "qris" | "instruction";
  label: string;
  value: string;
  imageUrl?: string;
};

export type VerifyResult = {
  isPaid: boolean;
  providerStatus: string;
};

export interface PaymentProvider {
  readonly name: string;
  readonly displayName: string;

  createPayment(params: {
    paymentId: string;
    orderId: string;
    amount: number;
    customerEmail?: string | null;
    customerName?: string;
    description?: string;
  }): Promise<ProviderPaymentResult>;

  verifyPayment(orderId: string): Promise<VerifyResult>;

  cancelPayment(orderId: string): Promise<boolean>;

  refundPayment(orderId: string, amount?: number, reason?: string): Promise<boolean>;

  expirePayment(orderId: string): Promise<boolean>;

  generateInstructions(payment: Payment): PaymentInstruction[];
}
