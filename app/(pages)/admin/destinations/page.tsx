import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminDestinations from "@/components/AdminDestinations";

export const metadata = { title: "Destinations — Admin — VAKANSISME" };

export default async function AdminDestinationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ marginBottom: "48px" }}>
          <p
            className="font-body font-semibold text-chaos-orange uppercase"
            style={{ fontSize: "0.65rem", letterSpacing: "0.14em", marginBottom: "8px" }}
          >
            ADMIN
          </p>
          <h1
            className="font-display font-black uppercase text-off-white"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", letterSpacing: "-0.025em", lineHeight: 0.88 }}
          >
            DESTINATIONS
          </h1>
        </div>
        <AdminDestinations />
      </div>
    </div>
  );
}
