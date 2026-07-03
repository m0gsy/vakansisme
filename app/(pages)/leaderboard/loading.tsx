export default function Loading() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Heading */}
        <div className="animate-pulse" style={{ height: "64px", width: "320px", background: "#1a1a1a", marginBottom: "48px" }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          {[0, 1].map((board) => (
            <div key={board}>
              <div className="animate-pulse" style={{ height: "18px", width: "120px", background: "#1a1a1a", marginBottom: "20px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse"
                    style={{ height: "48px", background: "#1a1a1a", opacity: 1 - i * 0.07 }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
