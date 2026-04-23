"use client";
import { useState } from "react";

interface TextLinkProps {
  children: React.ReactNode;
  onClick?: () => void;
  arrow?: string;
  accent?: boolean;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function TextLink({ children, onClick, arrow = "→", accent = false, style = {}, disabled = false }: TextLinkProps) {
  const [hover, setHover] = useState(false);
  const color = accent ? "var(--accent)" : "var(--ink)";
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={disabled}
      style={{
        color,
        borderBottom: hover ? `1px solid ${color}` : "1px solid transparent",
        paddingBottom: 1,
        display: "inline-flex",
        gap: 7,
        alignItems: "baseline",
        fontSize: 14,
        fontWeight: 500,
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
        ...style,
      }}
    >
      <span>{children}</span>
      {arrow && <span style={{ fontWeight: 400 }}>{arrow}</span>}
    </button>
  );
}
