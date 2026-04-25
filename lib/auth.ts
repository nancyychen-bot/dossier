import { cookies } from "next/headers";
import { createHmac } from "crypto";

function sessionToken() {
  const secret = process.env.DOSSIER_SECRET ?? "";
  const password = process.env.DOSSIER_PASSWORD ?? "";
  return createHmac("sha256", secret).update(password).digest("hex");
}

export function isAuthenticated(): boolean {
  const cookie = cookies().get("dossier_session");
  return cookie?.value === sessionToken();
}

export function makeSessionCookie() {
  return { name: "dossier_session", value: sessionToken() };
}
