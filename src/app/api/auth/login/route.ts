import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/validation";
import {
  signSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ভুল ইনপুট", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  await dbConnect();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user || user.status !== "active") {
    return NextResponse.json(
      { error: "ইমেইল বা পাসওয়ার্ড ভুল" },
      { status: 401 },
    );
  }

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "ইমেইল বা পাসওয়ার্ড ভুল" },
      { status: 401 },
    );
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = await signSession({
    userId: String(user._id),
    tenantId: user.tenantId ? String(user.tenantId) : null,
    role: user.role,
    name: user.name,
  });

  const res = NextResponse.json({
    ok: true,
    role: user.role,
    redirect: user.role === "super_admin" ? "/admin" : "/dashboard",
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return res;
}
