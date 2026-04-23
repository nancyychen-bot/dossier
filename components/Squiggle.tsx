"use client";

interface SquiggleProps {
  width?: number;
  stroke?: number;
  color?: string;
  style?: React.CSSProperties;
  className?: string;
}

export function Squiggle({ width = 120, stroke = 1.25, color = "currentColor", style = {}, className = "" }: SquiggleProps) {
  const height = width * (40 / 240);
  return (
    <svg
      viewBox="0 0 240 40"
      width={width}
      height={height}
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      style={style}
      className={className}
      aria-hidden="true"
    >
      <path d="M2 22 C 14 6, 28 6, 38 22 S 64 38, 76 22 S 100 6, 112 22 S 138 38, 150 22 S 174 6, 186 22 S 210 38, 222 22 L 238 22" />
    </svg>
  );
}
