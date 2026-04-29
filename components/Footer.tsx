"use client";
import { Squiggle } from "./Squiggle";
import { Person } from "@/lib/types";

function exportCSV(people: Person[]) {
  const headers = ["Name", "Role", "Company", "Email", "Phone", "LinkedIn", "Met at", "City", "Date met", "Status", "Notes"];
  const rows = people.map(p => [
    p.name,
    p.role,
    p.company === "—" ? "" : p.company,
    p.email ?? "",
    p.phone ?? "",
    p.linkedin ?? "",
    p.location,
    p.metCity,
    p.captured,
    p.tags[0] ?? "",
    p.notes,
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dossier-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface FooterProps {
  people?: Person[];
}

export function Footer({ people = [] }: FooterProps) {
  return (
    <footer className="container foot-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="uc muted">About</div>
        <div className="serif ital" style={{ fontSize: 15, maxWidth: "42ch", lineHeight: 1.45 }}>
          A private dossier for forgetful people.<br />
          Designed by{" "}
          <a
            href="https://x.com/nancy_y_chen"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink)", borderBottom: "1px solid var(--ink)", paddingBottom: 1 }}
          >
            Nancy Chen
          </a>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <Squiggle width={90} style={{ opacity: 0.5, color: "var(--muted)" }} />
        <div className="mono muted" style={{ fontSize: 10 }}>※ EST. 2026</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, justifyContent: "flex-end" }}>
        <button
          onClick={() => exportCSV(people)}
          className="mono muted"
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "var(--muted)", padding: 0,
          }}
        >
          Export CSV ↓
        </button>
      </div>
    </footer>
  );
}
