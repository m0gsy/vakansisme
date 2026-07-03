export default function Loading() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="max-w-4xl mx-auto px-6">
        {/* Avatar + username */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
          <div className="animate-pulse" style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#1a1a1a", flexShrink: 0 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="animate-pulse" style={{ height: "28px", width: "160px", background: "#1a1a1a" }} />
            <div className="animate-pulse" style={{ height: "14px", width: "240px", background: "#1a1a1a" }} />
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "32px", marginBottom: "48px" }}>
          {[60, 60, 80].map((w, i) => (
            <div key={i} className="animate-pulse" style={{ height: "40px", width: `${w}px`, background: "#1a1a1a" }} />
          ))}
        </div>

        {/* Activity grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse" style={{ height: "160px", background: "#1a1a1a" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
