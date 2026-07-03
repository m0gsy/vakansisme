export default function TripsLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <div style={{ height: "3.5rem", background: "#2a2a2a", width: "45%", marginBottom: "10px" }} />
        <div style={{ height: "0.75rem", background: "#222", width: "22%", marginBottom: "48px" }} />

        <div style={{ height: "0.8rem", background: "#2a2a2a", width: "180px", marginBottom: "20px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "56px" }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} style={{ display: "flex", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.2)", overflow: "hidden" }}>
              <div style={{ width: "120px", flexShrink: 0, background: "#222" }} />
              <div style={{ flex: 1, padding: "20px 24px" }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <div style={{ height: "0.58rem", background: "#2a2a2a", width: "60px" }} />
                  <div style={{ height: "0.58rem", background: "#1e1e1e", width: "40px" }} />
                </div>
                <div style={{ height: "1.1rem", background: "#333", width: "70%", marginBottom: "8px" }} />
                <div style={{ height: "0.72rem", background: "#222", width: "45%", marginBottom: "14px" }} />
                <div style={{ height: "0.65rem", background: "#1e1e1e", width: "35%" }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ height: "0.8rem", background: "#2a2a2a", width: "140px", marginBottom: "20px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: "flex", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.2)", overflow: "hidden" }}>
              <div style={{ width: "120px", flexShrink: 0, background: "#1e1e1e" }} />
              <div style={{ flex: 1, padding: "20px 24px" }}>
                <div style={{ height: "0.58rem", background: "#2a2a2a", width: "80px", marginBottom: "10px" }} />
                <div style={{ height: "1.1rem", background: "#2a2a2a", width: "60%", marginBottom: "8px" }} />
                <div style={{ height: "0.72rem", background: "#1e1e1e", width: "40%", marginBottom: "14px" }} />
                <div style={{ height: "0.65rem", background: "#1a1a1a", width: "30%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
