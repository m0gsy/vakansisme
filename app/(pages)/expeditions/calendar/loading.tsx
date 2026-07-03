export default function CalendarLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6">
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
          <div style={{ width: "32px", height: "32px", background: "#2a2a2a" }} />
          <div style={{ height: "2rem", background: "#2a2a2a", width: "200px" }} />
          <div style={{ width: "32px", height: "32px", background: "#2a2a2a" }} />
        </div>

        {/* Day labels */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "2px" }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ height: "0.65rem", background: "#2a2a2a", margin: "8px auto", width: "60%" }} />
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} style={{ minHeight: "80px", background: i % 7 === 0 || i % 7 === 6 ? "#141414" : "#1a1a1a", border: "1px solid rgba(74,59,42,0.15)", padding: "8px" }}>
              <div style={{ height: "0.7rem", background: "#2a2a2a", width: "24px", marginBottom: "8px" }} />
              {i % 5 === 1 && <div style={{ height: "0.6rem", background: "#1e3010", width: "80%", marginBottom: "4px" }} />}
              {i % 8 === 3 && <div style={{ height: "0.6rem", background: "#2a1a08", width: "70%" }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
