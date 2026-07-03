export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-charcoal animate-pulse" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-2xl mx-auto px-6">
        <div style={{ height: "3rem", background: "#2a2a2a", width: "40%", marginBottom: "48px" }} />

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "40px" }}>
          <div style={{ width: "80px", height: "80px", background: "#222", borderRadius: "50%", flexShrink: 0 }} />
          <div style={{ height: "1.8rem", background: "#1e1e1e", width: "120px" }} />
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginBottom: "48px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div style={{ height: "0.6rem", background: "#2a2a2a", width: "80px", marginBottom: "10px" }} />
              <div style={{ height: "2rem", background: "transparent", borderBottom: "2px solid #2a2a2a" }} />
            </div>
          ))}
        </div>

        {/* Save button */}
        <div style={{ height: "2.5rem", background: "#2a2a2a", width: "120px", marginBottom: "56px" }} />

        {/* Notifications section */}
        <div style={{ height: "1.2rem", background: "#2a2a2a", width: "200px", marginBottom: "24px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ height: "0.8rem", background: "#1e1e1e", width: "55%" }} />
              <div style={{ width: "36px", height: "20px", background: "#2a2a2a" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
