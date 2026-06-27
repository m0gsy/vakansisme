export default function Loading() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div
          className="animate-pulse"
          style={{ height: "56px", width: "60%", background: "#1a1a1a", marginBottom: "40px" }}
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse" style={{ height: "320px", background: "#1a1a1a" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
