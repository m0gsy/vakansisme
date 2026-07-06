import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";
import { AdminRemindersButton, AdminPaymentRemindersButton, AdminReminderTemplate } from "@/components/AdminActions";

export const metadata = { title: "Reminders — Admin — VAKANSISME" };

export default async function AdminRemindersPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ marginBottom: "48px" }}>
          <p className="font-body font-semibold text-chaos-orange uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}>ADMIN</p>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}>
            REMINDERS
          </h1>
        </div>

        <AdminNav active="reminders" />

        <AdminReminderTemplate />

        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            SEND TRIP REMINDERS
          </h2>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginBottom: "12px" }}>Remind approved members about upcoming departure.</p>
          <AdminRemindersButton />
        </section>

        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            SEND PAYMENT REMINDERS
          </h2>
          <p className="font-body text-muted-ink" style={{ fontSize: "0.72rem", marginBottom: "12px" }}>Remind members with pending payment for upcoming trips.</p>
          <AdminPaymentRemindersButton />
        </section>
      </div>
    </div>
  );
}
