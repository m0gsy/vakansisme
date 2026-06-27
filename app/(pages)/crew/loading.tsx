export default function Loading() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="animate-pulse" style={{ height: "48px", width: "40%", background: "#1a1a1a", marginBottom: "40px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse" style={{ height: "200px", background: "#1a1a1a" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
