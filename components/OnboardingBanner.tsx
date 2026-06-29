import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function OnboardingBanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.username) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 200,
        background: "#9BFF3C",
        color: "#111",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
      }}
    >
      <span className="font-body font-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.08em" }}>
        Set a username to get started
      </span>
      <Link
        href="/settings"
        className="font-body font-semibold"
        style={{
          fontSize: "0.65rem",
          letterSpacing: "0.14em",
          background: "#111",
          color: "#9BFF3C",
          padding: "6px 14px",
          textDecoration: "none",
        }}
      >
        GO TO SETTINGS →
      </Link>
    </div>
  );
}
