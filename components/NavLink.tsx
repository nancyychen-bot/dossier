"use client";
import { useState } from "react";

interface NavLinkProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

export function NavLink({ label, active = false, onClick }: NavLinkProps) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: '"Instrument Serif", Georgia, serif',
        fontSize: 19,
        letterSpacing: "-0.01em",
        fontWeight: 400,
        fontStyle: active ? "italic" : "normal",
        color: "var(--ink)",
        borderBottom: (active || hover) ? "1px solid var(--ink)" : "1px solid transparent",
        paddingBottom: 2,
        lineHeight: 1,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}
