"use client";

interface KVProps {
  k: string;
  v?: string | null;
  children?: React.ReactNode;
}

export function KV({ k, v, children }: KVProps) {
  const hasValue = children || (v !== null && v !== undefined && v !== "");
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "110px 1fr",
      gap: 24,
      padding: "10px 0",
      borderBottom: "1px solid var(--rule)",
      alignItems: "baseline",
    }}>
      <div className="uc muted">{k}</div>
      <div style={{ fontSize: 15, fontWeight: 400, color: hasValue ? "var(--ink)" : "var(--muted)" }}>
        {children || (hasValue ? v : <span style={{ fontStyle: "italic" }}>— not yet captured</span>)}
      </div>
    </div>
  );
}
