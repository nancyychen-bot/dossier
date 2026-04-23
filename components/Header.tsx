"use client";
import { NavLink } from "./NavLink";
import { Squiggle } from "./Squiggle";
import { useDossier } from "@/lib/store";
import { getTodayFormatted } from "@/lib/utils";

export function Header() {
  const { route, goto, signOut } = useDossier();

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: "var(--bg)",
      borderBottom: "1px solid var(--rule)",
    }}>
      <div className="container hdr-grid">
        <nav className="hdr-nav">
          <NavLink label="Dossier" active={route.name === "list"} onClick={() => goto("list")} />
          <NavLink label="Capture" active={route.name === "capture"} onClick={() => goto("capture")} />
          <NavLink label="Enrich" active={route.name === "enrich"} onClick={() => goto("enrich")} />
        </nav>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, whiteSpace: "nowrap", justifyContent: "flex-end" }}>
          <span className="mono muted" style={{ fontSize: 10 }}>{getTodayFormatted()}</span>
          <span className="muted hide-mobile" style={{ fontSize: 14 }}>✐</span>
          <button
            onClick={signOut}
            className="mono muted hide-mobile"
            style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", background: "none", border: "none", color: "var(--muted)", paddingBottom: 1, borderBottom: "1px solid transparent" }}
            title="Sign out"
          >
            sign out
          </button>
        </div>
      </div>
    </header>
  );
}
