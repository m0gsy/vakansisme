import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ProposalModerationActions } from "@/components/AdminActions";

type Params = Promise<{ id: string }>;

export default async function ProposalDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) redirect("/");

  const service = createServiceClient();
  const { data: proposal } = await service
    .from("expedition_proposals")
    .select("*")
    .eq("id", id)
    .single();

  if (!proposal) notFound();

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px" }}>
        <Link href="/admin" className="font-body text-muted-ink hover:text-neon-green transition-colors duration-150" style={{ fontSize: "0.72rem", letterSpacing: "0.1em", display: "inline-block", marginBottom: "32px" }}>
          ← BACK TO ADMIN
        </Link>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
          <span
            className="font-body font-semibold"
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.12em",
              padding: "3px 10px",
              background: proposal.status === "pending" ? "rgba(255,107,26,0.15)" : proposal.status === "approved" ? "#9BFF3C" : "rgba(74,59,42,0.4)",
              color: proposal.status === "pending" ? "#FF6B1A" : proposal.status === "approved" ? "#111111" : "#8B7355",
              textTransform: "uppercase",
            }}
          >
            {proposal.status}
          </span>
          <span className="font-body text-muted-ink" style={{ fontSize: "0.72rem" }}>
            {new Date(proposal.created_at).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>

        <h1 className="font-display font-black uppercase text-off-white" style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", letterSpacing: "-0.025em", lineHeight: 0.9, marginBottom: "8px" }}>
          {proposal.name}
        </h1>
        <p className="font-body text-neon-green" style={{ fontSize: "0.78rem", letterSpacing: "0.06em", marginBottom: "32px" }}>
          PROPOSED BY @{proposal.proposer_handle}
        </p>

        {proposal.image_url && (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", marginBottom: "32px", overflow: "hidden" }}>
            <Image src={proposal.image_url} alt={proposal.name} fill sizes="720px" className="object-cover" />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          {[
            ["LOCATION", proposal.location],
            ["DIFFICULTY", proposal.difficulty],
            ["PRICE", proposal.price],
            ["PARTICIPANTS", `${proposal.quota_max} max`],
            ["START DATE", proposal.date_start],
            ["END DATE", proposal.date_end],
            ["APPROVAL REQUIRED", proposal.requires_approval ? "Yes" : "No"],
          ].map(([label, value]) => (
            <div key={label} style={{ borderBottom: "1px solid rgba(74,59,42,0.3)", paddingBottom: "12px" }}>
              <p className="font-body text-muted-ink" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "4px" }}>{label}</p>
              <p className="font-body text-off-white" style={{ fontSize: "0.88rem" }}>{value}</p>
            </div>
          ))}
        </div>

        {proposal.description && (
          <div style={{ marginBottom: "32px" }}>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "10px" }}>DESCRIPTION</p>
            <p className="font-body text-off-white" style={{ fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{proposal.description}</p>
          </div>
        )}

        {proposal.admin_note && (
          <div style={{ marginBottom: "32px", padding: "14px", border: "1px solid rgba(255,107,26,0.25)", background: "rgba(255,107,26,0.05)" }}>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: "6px" }}>ADMIN NOTE</p>
            <p className="font-body text-off-white" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>{proposal.admin_note}</p>
          </div>
        )}

        {proposal.status === "pending" && (
          <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(74,59,42,0.3)" }}>
            <p className="font-body text-muted-ink" style={{ fontSize: "0.65rem", letterSpacing: "0.1em", marginBottom: "14px" }}>MODERATION</p>
            <ProposalModerationActions proposal={proposal} onDone={() => { window.location.href = "/admin"; }} />
          </div>
        )}
      </div>
    </div>
  );
}
