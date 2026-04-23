export function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function fmtDateLong(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function daysAgo(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((now.getTime() - d.getTime()) / 86400000));
}

export function getQuarterLabel(): string {
  const now = new Date();
  const quarters = ["winter quarter", "spring quarter", "summer quarter", "autumn quarter"];
  const q = Math.floor(now.getMonth() / 3);
  return quarters[q];
}

export function getIssueNumber(totalCount: number): string {
  return String(totalCount).padStart(3, "0");
}

export function getTodayFormatted(): string {
  const now = new Date();
  const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${days[now.getDay()]} · ${String(now.getDate()).padStart(2,"0")} ${months[now.getMonth()]} ${String(now.getFullYear()).slice(2)}`;
}

export function getLastUpdated(dates: string[]): string {
  if (!dates.length) return "";
  const latest = dates.sort().reverse()[0];
  return fmtDate(latest).replace(/\d+$/, (y) => `${y}`);
}

export function mkMeetingId(): string {
  return "m-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
}

export function mkPersonId(existing: string[]): string {
  const nums = existing.map(id => parseInt(id.replace("p-", ""), 10)).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return "p-" + String(next).padStart(3, "0");
}

export function isComplete(p: { name?: string; role?: string | null; email?: string | null; linkedin?: string | null }): boolean {
  return !!(p.name && p.role && p.email && p.linkedin);
}

export function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function padEntry(num: string | number): string {
  return String(num).replace("p-", "").padStart(3, "0");
}
