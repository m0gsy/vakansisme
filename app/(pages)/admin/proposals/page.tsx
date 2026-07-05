import { requireAdmin } from "@/lib/admin";
import AdminNav from "@/components/AdminNav";
import { AdminProposalsSection } from "@/components/AdminActions";

export const metadata = { title: "Proposals — Admin — VAKANSISME" };

export default async function AdminProposalsPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ marginBottom: "48px" }}>
          <p className="font-body font-semibold text-chaos-orange uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}>ADMIN</p>
          <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}>
            PROPOSALS
          </h1>
        </div>

        <AdminNav active="proposals" />

        <section style={{ marginBottom: "56px" }}>
          <h2 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(1.4rem, 3vw, 2rem)", letterSpacing: "-0.02em", marginBottom: "20px" }}>
            PROPOSALS
          </h2>
          <AdminProposalsSection />
        </section>
      </div>
    </div>
  );
}
