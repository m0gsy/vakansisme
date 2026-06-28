"use client";

import { useRouter } from "next/navigation";

export default function LanguageSwitcher({ current }: { current: "id" | "en" }) {
  const router = useRouter();

  function toggle() {
    const next = current === "id" ? "en" : "id";
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className="font-body font-semibold text-muted-ink hover:text-off-white transition-colors duration-200"
      style={{
        fontSize: "0.7rem",
        letterSpacing: "0.1em",
        background: "none",
        border: "1px solid rgba(74,59,42,0.4)",
        cursor: "pointer",
        padding: "4px 9px",
      }}
      aria-label={`Switch to ${current === "id" ? "English" : "Bahasa Indonesia"}`}
    >
      {current === "id" ? "EN" : "ID"}
    </button>
  );
}
