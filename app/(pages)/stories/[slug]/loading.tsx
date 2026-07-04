export default function Loading() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "80px" }}>
      {/* Hero */}
      <div className="animate-pulse" style={{ height: "400px", background: "#1a1a1a" }} />

      <div className="max-w-3xl mx-auto px-6" style={{ paddingTop: "48px", paddingBottom: "80px" }}>
        {/* Tag */}
        <div className="animate-pulse" style={{ height: "22px", width: "70px", background: "#1a1a1a", marginBottom: "20px" }} />
        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
          <div className="animate-pulse" style={{ height: "48px", width: "90%", background: "#1a1a1a" }} />
          <div className="animate-pulse" style={{ height: "48px", width: "70%", background: "#1a1a1a" }} />
        </div>
        {/* Meta */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "40px" }}>
          <div className="animate-pulse" style={{ height: "14px", width: "80px", background: "#1a1a1a" }} />
          <div className="animate-pulse" style={{ height: "14px", width: "60px", background: "#1a1a1a" }} />
        </div>
        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[100, 95, 88, 100, 92, 78, 100, 85].map((w, i) => (
            <div key={i} className="animate-pulse" style={{ height: "14px", width: `${w}%`, background: "#1a1a1a" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
