"use client";
import { useState } from "react";

interface FilterChipProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, count, active, onClick }: FilterChipProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 6,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? "var(--ink)" : hover ? "var(--ink)" : "var(--muted)",
        letterSpacing: "-0.005em",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span style={{ fontSize: 11, transform: "translateY(-0.5px)" }}>
        {active ? "●" : "○"}
      </span>
      <span>{label}</span>
      {count != null && (
        <span style={{
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: 0,
          fontSize: 11,
          color: "var(--muted)",
          fontWeight: 400,
        }}>
          {String(count).padStart(2, "0")}
        </span>
      )}
    </button>
  );
}
