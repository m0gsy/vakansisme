export type PaymentStatus =
  | "pending"
  | "waiting_verification"
  | "paid"
  | "rejected"
  | "expired"
  | "refunded"
  | "cancelled";

export type PaymentMethod =
  | "bank_transfer"
  | "qris"
  | "cash"
  | "manual_confirmation"
  | "credit_card"
  | "virtual_account"
  | "e_wallet";

export type PaymentProvider =
  | "manual_transfer"
  | "midtrans"
  | "xendit"
  | "stripe"
  | "tripay";

export type Payment = {
  id: string;
  user_id: string;
  expedition_id: string;
  booking_id: string | null;
  payment_order_id: string;
  amount_idr: number;
  provider: PaymentProvider;
  status: string;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod | null;
  proof_image_url: string | null;
  proof_uploaded_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  rejected_reason: string | null;
  refunded_at: string | null;
  refund_reason: string | null;
  unique_code: number | null;
  expires_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type CreatePaymentInput = {
  user_id: string;
  expedition_id: string;
  booking_id: string;
  amount_idr: number;
  provider: PaymentProvider;
  payment_method: PaymentMethod;
};

export type BankAccount = {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string | null;
  is_active: boolean;
  display_order: number;
};

export type QrisAccount = {
  id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
};

export type PaymentSettings = {
  business_hours: {
    days: string[];
    start: string;
    end: string;
    timezone: string;
  };
  whatsapp_number: {
    number: string;
    label: string;
  };
  receipt_footer: {
    text: string;
  };
  reminder_templates: {
    payment_reminder: string;
    trip_reminder: string;
  };
};

export type PaymentProviderConfig = {
  name: string;
  display_name: string;
  enabled: boolean;
  config: Record<string, unknown>;
};
