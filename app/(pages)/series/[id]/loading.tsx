export default function SeriesDetailLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingBottom: "80px" }}>
      <div style={{ height: "320px", background: "#1a1a1a" }} />

      <div className="max-w-4xl mx-auto px-6">
        <div style={{ height: "0.65rem", background: "#2a2a2a", width: "80px", marginBottom: "32px", marginTop: "0" }} />

        <div style={{ height: "3rem", background: "#2a2a2a", width: "55%", marginBottom: "12px" }} />
        <div style={{ height: "0.65rem", background: "#222", width: "120px", marginBottom: "20px" }} />
        <div style={{ height: "0.85rem", background: "#1e1e1e", width: "70%", marginBottom: "6px" }} />
        <div style={{ height: "0.85rem", background: "#1e1e1e", width: "50%", marginBottom: "40px" }} />

        <div style={{ height: "1rem", background: "#2a2a2a", width: "200px", marginBottom: "16px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "20px", alignItems: "center", padding: "20px 22px", background: "#141414", border: "1px solid rgba(74,59,42,0.2)" }}>
              <div style={{ width: "32px", height: "1.8rem", background: "#2a2a2a", flexShrink: 0 }} />
              <div style={{ width: "72px", height: "72px", background: "#222", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "0.58rem", background: "#2a2a2a", width: "15%", marginBottom: "6px" }} />
                <div style={{ height: "1rem", background: "#333", width: "70%", marginBottom: "6px" }} />
                <div style={{ height: "0.75rem", background: "#222", width: "90%", marginBottom: "4px" }} />
                <div style={{ height: "0.75rem", background: "#222", width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
