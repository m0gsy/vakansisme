export default function Loading() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "80px" }}>
      {/* Hero skeleton */}
      <div className="animate-pulse" style={{ height: "480px", background: "#1a1a1a" }} />

      <div className="max-w-7xl mx-auto px-6" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "64px" }}>
          {/* Main */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="animate-pulse" style={{ height: "16px", width: "80px", background: "#1a1a1a" }} />
            <div className="animate-pulse" style={{ height: "56px", width: "70%", background: "#1a1a1a" }} />
            <div className="animate-pulse" style={{ height: "56px", width: "50%", background: "#1a1a1a" }} />
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              {[100, 120, 90].map((w, i) => (
                <div key={i} className="animate-pulse" style={{ height: "32px", width: `${w}px`, background: "#1a1a1a" }} />
              ))}
            </div>
            <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[100, 90, 95, 80].map((w, i) => (
                <div key={i} className="animate-pulse" style={{ height: "14px", width: `${w}%`, background: "#1a1a1a" }} />
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ height: "48px", background: "#1a1a1a" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
