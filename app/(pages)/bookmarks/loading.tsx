export default function BookmarksLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-3xl mx-auto px-6">
        <div style={{ height: "3.5rem", background: "#2a2a2a", width: "50%", marginBottom: "10px" }} />
        <div style={{ height: "0.75rem", background: "#222", width: "20%", marginBottom: "48px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: "flex", background: "#1a1a1a", border: "1px solid rgba(74,59,42,0.2)", overflow: "hidden" }}>
              <div style={{ width: "100px", flexShrink: 0, background: "#222" }} />
              <div style={{ flex: 1, padding: "16px 20px" }}>
                <div style={{ height: "0.6rem", background: "#2a2a2a", width: "25%", marginBottom: "8px" }} />
                <div style={{ height: "1rem", background: "#333", width: "75%", marginBottom: "6px" }} />
                <div style={{ height: "0.7rem", background: "#222", width: "40%", marginBottom: "10px" }} />
                <div style={{ height: "0.6rem", background: "#1e1e1e", width: "30%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
