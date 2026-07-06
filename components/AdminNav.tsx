import Link from "next/link";

const LINKS = [
  { href: "/admin", key: "dashboard", label: "DASHBOARD" },
  { href: "/admin/payments", key: "payments", label: "PAYMENTS" },
  { href: "/admin/payment-settings", key: "payment-settings", label: "PAYMENT SETTINGS" },
  { href: "/admin/gallery", key: "gallery", label: "GALLERY" },
  { href: "/admin/stories", key: "stories", label: "STORIES" },
  { href: "/admin/chaos", key: "chaos", label: "CHAOS" },
  { href: "/admin/expeditions", key: "expeditions", label: "EXPEDITIONS" },
  { href: "/admin/destinations", key: "destinations", label: "DESTINATIONS" },
  { href: "/admin/users", key: "users", label: "USERS" },
  { href: "/admin/proposals", key: "proposals", label: "PROPOSALS" },
  { href: "/admin/activities", key: "activities", label: "ACTIVITIES" },
  { href: "/admin/reminders", key: "reminders", label: "REMINDERS" },
  { href: "/admin/reports", key: "reports", label: "REPORTS" },
];

export default function AdminNav({ active }: { active?: string }) {
  return (
    <nav style={{ position: "sticky", top: "64px", zIndex: 10, background: "#111111", borderBottom: "1px solid rgba(74,59,42,0.3)", marginBottom: "32px", overflowX: "auto", whiteSpace: "nowrap", padding: "10px 0" }}>
      {LINKS.map(({ href, key, label }) => (
        <Link
          key={key}
          href={href}
          className={`font-body font-semibold transition-colors duration-150 ${active === key ? "text-neon-green" : "text-muted-ink hover:text-neon-green"}`}
          style={{ fontSize: "0.58rem", letterSpacing: "0.12em", padding: "4px 16px", textDecoration: "none", display: "inline-block" }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
