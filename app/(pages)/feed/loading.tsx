export default function FeedLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-2xl mx-auto px-6">
        <div style={{ height: "3.5rem", background: "#2a2a2a", width: "40%", marginBottom: "10px" }} />
        <div style={{ height: "0.75rem", background: "#222", width: "30%", marginBottom: "48px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            i % 3 === 2 ? (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 20px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.2)" }}>
                <div style={{ width: "20px", height: "20px", background: "#2a2a2a", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "0.65rem", background: "#2a2a2a", width: "60%", marginBottom: "6px" }} />
                  <div style={{ height: "0.85rem", background: "#222", width: "80%" }} />
                </div>
                <div style={{ width: "40px", height: "0.6rem", background: "#2a2a2a" }} />
              </div>
            ) : (
              <div key={i} style={{ display: "flex", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.2)", overflow: "hidden" }}>
                <div style={{ width: "80px", flexShrink: 0, background: "#222" }} />
                <div style={{ padding: "16px 20px", flex: 1 }}>
                  <div style={{ height: "0.6rem", background: "#2a2a2a", width: "45%", marginBottom: "6px" }} />
                  <div style={{ height: "0.9rem", background: "#333", width: "85%", marginBottom: "8px" }} />
                  <div style={{ height: "0.6rem", background: "#1e1e1e", width: "20%" }} />
                </div>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
