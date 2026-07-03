export default function DMThreadLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "80px", paddingBottom: "0", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(74,59,42,0.25)", display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ width: "40px", height: "40px", background: "#222", flexShrink: 0 }} />
        <div style={{ height: "0.85rem", background: "#2a2a2a", width: "120px" }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {[{ w: "55%", self: false }, { w: "40%", self: true }, { w: "65%", self: false }, { w: "35%", self: true }, { w: "50%", self: false }].map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.self ? "flex-end" : "flex-start" }}>
            <div style={{ height: "2.2rem", background: m.self ? "#1e2e10" : "#1e1e1e", border: `1px solid ${m.self ? "rgba(155,255,60,0.15)" : "rgba(74,59,42,0.2)"}`, width: m.w, maxWidth: "70%" }} />
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(74,59,42,0.25)" }}>
        <div style={{ height: "2.5rem", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)" }} />
      </div>
    </div>
  );
}
