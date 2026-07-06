import type { Payment } from "./payment";

export type BookingStatus =
  | "draft"
  | "waiting_payment"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "expired"
  | "rejected";

export type PaymentPolicy =
  | "free"
  | "fixed_price"
  | "donation"
  | "early_bird"
  | "custom_price";

export type PaymentDeadlinePolicy =
  | "no_deadline"
  | "hours"
  | "days"
  | "specific_date";

export type SeatReservationPolicy =
  | "immediate"
  | "after_payment"
  | "temporary";

export type Booking = {
  id: string;
  expedition_id: string;
  user_id: string;
  booking_number: string;
  booking_status: BookingStatus;
  status: string;
  expires_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  checked_in_at: string | null;
  notes: string | null;
  payment_due_at: string | null;
  joined_at: string;
  expedition?: {
    id: string;
    slug: string;
    name: string;
    location: string;
    date_start: string;
    date_end: string;
    price: string;
    price_amount: number | null;
    difficulty: string;
    image_url: string | null;
    status: string;
    quota_max: number;
    requires_approval: boolean;
    requires_payment: boolean;
    payment_policy: PaymentPolicy;
    seat_reservation_policy: SeatReservationPolicy;
    payment_deadline_policy: PaymentDeadlinePolicy;
    payment_deadline_value: number | null;
    payment_deadline_date: string | null;
    refund_policy: string | null;
    cancellation_policy: string | null;
    payment_instructions: string | null;
    accepted_payment_methods: string[];
    profiles: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] | null;
  } | null;
  payments?: Payment[];
};

export type BookingWithPayment = Booking & {
  payments: Payment[];
};

export type CreateBookingInput = {
  expedition_id: string;
  user_id: string;
  notes?: string | null;
};

export type BookingTimeline = {
  action: string;
  description: string;
  timestamp: string;
  actor?: string;
};
