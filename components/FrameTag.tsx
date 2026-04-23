"use client";

interface FrameTagProps {
  children: React.ReactNode;
  accent?: boolean;
  color?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function FrameTag({ children, accent = false, color, style = {}, onClick }: FrameTagProps) {
  const resolvedColor = color ?? (accent ? "var(--accent)" : "var(--ink)");
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${resolvedColor}`,
        color: resolvedColor,
        padding: "2px 7px 1px",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        fontSize: "10.5px",
        fontWeight: 500,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
