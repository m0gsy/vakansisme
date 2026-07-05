// ponytail: shared table bits lifted verbatim from the old admin/page.tsx —
// used by stories/chaos/expeditions pages to avoid tripling the same JSX.

export const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  background: "#1a1a1a",
  border: "1px solid rgba(74,59,42,0.35)",
};

export const rowStyle: React.CSSProperties = {
  borderBottom: "1px solid rgba(74,59,42,0.2)",
};

export function Cell({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <td
      className={muted ? "font-body text-muted-ink" : "font-body text-off-white"}
      style={{ fontSize: "0.82rem", padding: "12px 16px", verticalAlign: "middle" }}
    >
      {children}
    </td>
  );
}

export function TH({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="font-body font-semibold text-muted-ink uppercase"
      style={{ fontSize: "0.6rem", letterSpacing: "0.12em", padding: "10px 16px", textAlign: "left" }}
    >
      {children}
    </th>
  );
}
