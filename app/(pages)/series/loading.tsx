export default function SeriesLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "48px" }}>
          <div>
            <div style={{ height: "0.6rem", background: "#2a2a2a", width: "60px", marginBottom: "10px" }} />
            <div style={{ height: "3.5rem", background: "#2a2a2a", width: "320px" }} />
          </div>
          <div style={{ height: "2rem", width: "100px", background: "#2a2a2a" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: "#141414", border: "1px solid rgba(74,59,42,0.2)", overflow: "hidden" }}>
              <div style={{ height: "180px", background: "#1e1e1e" }} />
              <div style={{ padding: "20px 22px" }}>
                <div style={{ height: "1rem", background: "#2a2a2a", width: "80%", marginBottom: "10px" }} />
                <div style={{ height: "0.75rem", background: "#222", width: "100%", marginBottom: "6px" }} />
                <div style={{ height: "0.75rem", background: "#222", width: "60%", marginBottom: "14px" }} />
                <div style={{ height: "0.6rem", background: "#1e1e1e", width: "30%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
