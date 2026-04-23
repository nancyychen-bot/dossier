"use client";
import { useState } from "react";

interface UnderlinedInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
}

export function UnderlinedInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  type = "text",
  multiline = false,
  rows = 3,
  required,
}: UnderlinedInputProps) {
  const [focus, setFocus] = useState(false);
  const shared = {
    value: value || "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    placeholder,
    autoFocus,
    required,
    style: {
      width: "100%",
      padding: "6px 0 7px",
      borderBottom: `1px solid ${focus ? "var(--ink)" : "var(--rule)"}`,
      fontSize: 15,
      lineHeight: 1.4,
      fontFamily: "inherit",
      resize: multiline ? "vertical" as const : "none" as const,
      background: "transparent",
      border: "none",
      outline: "none",
      color: "var(--ink)",
    } as React.CSSProperties,
  };
  return multiline
    ? <textarea {...shared} rows={rows} />
    : <input {...shared} type={type} />;
}
