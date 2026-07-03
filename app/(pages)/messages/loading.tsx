export default function MessagesLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-2xl mx-auto px-6">
        <div style={{ height: "3.5rem", background: "#2a2a2a", width: "55%", marginBottom: "48px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.2)" }}>
              <div style={{ width: "44px", height: "44px", background: "#222", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ height: "0.8rem", background: "#2a2a2a", width: "30%" }} />
                  <div style={{ height: "0.6rem", background: "#1e1e1e", width: "15%" }} />
                </div>
                <div style={{ height: "0.72rem", background: "#1e1e1e", width: "70%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
