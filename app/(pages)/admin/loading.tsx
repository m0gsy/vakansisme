export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div style={{ height: "3rem", background: "#2a2a2a", width: "30%", marginBottom: "56px" }} />

        {Array.from({ length: 3 }).map((_, s) => (
          <div key={s} style={{ marginBottom: "56px" }}>
            <div style={{ height: "1.5rem", background: "#2a2a2a", width: `${180 + s * 40}px`, marginBottom: "20px" }} />
            <div style={{ border: "1px solid rgba(74,59,42,0.2)", overflow: "hidden" }}>
              {/* Table header */}
              <div style={{ display: "flex", gap: "0", background: "#111", borderBottom: "1px solid rgba(74,59,42,0.2)", padding: "10px 16px" }}>
                {Array.from({ length: 4 }).map((_, c) => (
                  <div key={c} style={{ flex: c === 0 ? 2 : 1, height: "0.6rem", background: "#2a2a2a", marginRight: "24px" }} />
                ))}
              </div>
              {/* Rows */}
              {Array.from({ length: 4 }).map((_, r) => (
                <div key={r} style={{ display: "flex", padding: "12px 16px", borderBottom: "1px solid rgba(74,59,42,0.1)", background: r % 2 === 0 ? "#1a1a1a" : "#161616" }}>
                  {Array.from({ length: 4 }).map((_, c) => (
                    <div key={c} style={{ flex: c === 0 ? 2 : 1, height: "0.8rem", background: c === 0 ? "#2a2a2a" : "#1e1e1e", marginRight: "24px", width: `${60 + Math.random() * 30}%` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
