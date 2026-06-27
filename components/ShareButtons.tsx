"use client";

import { useState } from "react";

export default function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button
        onClick={copyLink}
        className="font-body font-semibold transition-all duration-150"
        style={{
          fontSize: "0.68rem",
          letterSpacing: "0.1em",
          padding: "7px 16px",
          background: "transparent",
          border: "1px solid rgba(74,59,42,0.4)",
          color: copied ? "#9BFF3C" : "#8B7355",
          cursor: "pointer",
        }}
      >
        {copied ? "COPIED ✓" : "COPY LINK"}
      </button>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-body font-semibold transition-all duration-150"
        style={{
          fontSize: "0.68rem",
          letterSpacing: "0.1em",
          padding: "7px 16px",
          background: "transparent",
          border: "1px solid rgba(74,59,42,0.4)",
          color: "#8B7355",
          textDecoration: "none",
          display: "inline-block",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#F0EDEA")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#8B7355")}
      >
        SHARE WA
      </a>
    </div>
  );
}
