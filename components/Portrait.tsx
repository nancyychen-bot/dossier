"use client";
import { getInitials } from "@/lib/utils";

interface PortraitProps {
  name: string;
  photoUrl?: string | null;
  compact?: boolean;
  onAddPhoto?: () => void;
}

export function Portrait({ name, photoUrl, compact = false, onAddPhoto }: PortraitProps) {
  const width = compact ? 92 : 140;
  const height = Math.round(width * (5 / 4));
  const initials = getInitials(name);

  return (
    <div style={{
      width,
      height,
      border: "1px solid var(--ink)",
      position: "relative",
      overflow: "hidden",
      flexShrink: 0,
      background: photoUrl ? "transparent" : `
        repeating-linear-gradient(
          135deg,
          var(--paper) 0px,
          var(--paper) 10px,
          var(--bg) 10px,
          var(--bg) 20px
        )
      `,
    }}>
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <>
          {/* Corner crop marks */}
          <div style={{ position: "absolute", top: 6, left: 6, width: 10, height: 10, borderTop: "1px solid var(--muted)", borderLeft: "1px solid var(--muted)" }} />
          <div style={{ position: "absolute", top: 6, right: 6, width: 10, height: 10, borderTop: "1px solid var(--muted)", borderRight: "1px solid var(--muted)" }} />
          <div style={{ position: "absolute", bottom: 6, left: 6, width: 10, height: 10, borderBottom: "1px solid var(--muted)", borderLeft: "1px solid var(--muted)" }} />
          <div style={{ position: "absolute", bottom: 6, right: 6, width: 10, height: 10, borderBottom: "1px solid var(--muted)", borderRight: "1px solid var(--muted)" }} />

          {/* Initials */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: compact ? 32 : 52,
            fontWeight: 400,
            color: "var(--ink)",
            opacity: 0.14,
            letterSpacing: "-0.02em",
            userSelect: "none",
          }}>
            {initials}
          </div>

          {/* "No portrait" label — only show if there's no add button */}
          {!onAddPhoto && (
            <div style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 7,
              letterSpacing: "0.08em",
              color: "var(--muted)",
              textTransform: "uppercase",
            }}>
              No portrait
            </div>
          )}
          {onAddPhoto && (
            <button
              onClick={onAddPhoto}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 10,
                letterSpacing: "0.1em",
                color: "var(--accent)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textTransform: "uppercase",
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
              <span>Add photo</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}
