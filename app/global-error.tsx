"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          background: "#111111",
          color: "#F0EDEA",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: "sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p
          style={{
            fontSize: "0.65rem",
            letterSpacing: "0.2em",
            color: "#8B7355",
            textTransform: "uppercase",
            marginBottom: "24px",
          }}
        >
          VAKANSISME
        </p>
        <h1
          style={{
            fontSize: "clamp(4rem, 20vw, 8rem)",
            fontWeight: 900,
            lineHeight: 0.88,
            letterSpacing: "-0.04em",
            margin: "0 0 16px",
          }}
        >
          500
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#8B7355", marginBottom: "32px" }}>
          Something went wrong on our end.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#9BFF3C",
            color: "#111111",
            border: "none",
            padding: "12px 28px",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
