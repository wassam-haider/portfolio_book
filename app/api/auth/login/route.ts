import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createSessionToken, sessionCookie } from "@/lib/auth";
import { rateLimit, clientKey } from "@/lib/rateLimit";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // compare anyway against self to keep timing uniform
    timingSafeEqual(ba, ba);
    return false;
  }
  return timingSafeEqual(ba, bb);
}

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientKey(req)}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword || !process.env.AUTH_SECRET) {
    return NextResponse.json(
      { error: "Admin login is not configured (set ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET)." },
      { status: 503 },
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const emailOk = safeEqual((body.email ?? "").toLowerCase(), adminEmail.toLowerCase());
  const passwordOk = safeEqual(body.password ?? "", adminPassword);
  if (!emailOk || !passwordOk) {
    return NextResponse.json({ error: "Wrong credentials, keeper." }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie.name, token, sessionCookie.options);
  return res;
}
