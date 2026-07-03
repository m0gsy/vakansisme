export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ height: "3.5rem", background: "#2a2a2a", width: "35%", marginBottom: "32px" }} />
        <div style={{ height: "2.5rem", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.3)", marginBottom: "56px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px" }}>
          {["Expeditions", "Stories", "Crew"].map((label) => (
            <div key={label}>
              <div style={{ height: "0.7rem", background: "#2a2a2a", width: "80px", marginBottom: "16px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", padding: "12px 14px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.2)" }}>
                    <div style={{ width: "48px", height: "48px", background: "#222", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: "0.6rem", background: "#2a2a2a", width: "90%", marginBottom: "6px" }} />
                      <div style={{ height: "0.55rem", background: "#1e1e1e", width: "60%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
