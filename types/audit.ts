export type AuditAction =
  | "booking.created"
  | "booking.cancelled"
  | "booking.expired"
  | "booking.confirmed"
  | "booking.checked_in"
  | "booking.completed"
  | "booking.rejected"
  | "payment.created"
  | "payment.proof_uploaded"
  | "payment.verified"
  | "payment.rejected"
  | "payment.expired"
  | "payment.refunded"
  | "payment.cancelled"
  | "seat.reserved"
  | "seat.released"
  | "deadline.changed"
  | "deadline.extended"
  | "booking.notes_updated";

export type AuditLog = {
  id: string;
  booking_id: string;
  payment_id: string | null;
  action: AuditAction;
  actor_id: string | null;
  actor_ip: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
