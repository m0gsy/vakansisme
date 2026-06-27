export default function Loading() {
  return (
    <div className="min-h-screen bg-charcoal" style={{ paddingTop: "100px", paddingBottom: "80px" }}>
      <div className="max-w-5xl mx-auto px-6">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: "200px",
                background: "linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)",
                backgroundSize: "200% 100%",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
