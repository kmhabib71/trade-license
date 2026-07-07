import "server-only";
import { cookies } from "next/headers";
import { dbConnect } from "@/lib/db";
import { Subscription, isSubscriptionActive } from "@/models/Subscription";
import {
  SESSION_COOKIE,
  verifySession,
  type SessionPayload,
} from "@/lib/session";
import type { UserRole } from "@/lib/types";

/** Read + verify the current session from the request cookies (server components/routes). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Throw-style guard: returns the session or throws 401-like error. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("UNAUTHENTICATED");
  return session;
}

export async function requireRole(role: UserRole): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== role) throw new AuthError("FORBIDDEN");
  return session;
}

/**
 * Resolve the tenant scope for the current request.
 * - inspector → their own tenantId (required)
 * - super_admin → may pass an explicit tenantId, else null (cross-tenant admin)
 *
 * Use the returned `tenantId` in EVERY domain query so records never cross tenants.
 */
export async function withTenant(): Promise<{
  session: SessionPayload;
  tenantId: string;
}> {
  const session = await requireUser();
  if (session.role === "inspector") {
    if (!session.tenantId) throw new AuthError("NO_TENANT");
    return { session, tenantId: session.tenantId };
  }
  throw new AuthError("FORBIDDEN"); // super_admin uses /admin routes, not tenant-scoped ones
}

/** True when the inspector's tenant has an active/paid subscription. */
export async function hasActiveSubscription(tenantId: string): Promise<boolean> {
  await dbConnect();
  const sub = await Subscription.findOne({ tenantId }).lean();
  return isSubscriptionActive(sub);
}

/** Combined guard for the inspector app: authenticated + tenant + paid. */
export async function requirePaidTenant(): Promise<{
  session: SessionPayload;
  tenantId: string;
}> {
  const scope = await withTenant();
  if (!(await hasActiveSubscription(scope.tenantId))) {
    throw new AuthError("SUBSCRIPTION_INACTIVE");
  }
  return scope;
}

export type AuthErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NO_TENANT"
  | "SUBSCRIPTION_INACTIVE";

export class AuthError extends Error {
  code: AuthErrorCode;
  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
  }
}

/** Map an AuthError to an HTTP status for API routes. */
export function authErrorStatus(code: AuthErrorCode): number {
  switch (code) {
    case "UNAUTHENTICATED":
      return 401;
    case "SUBSCRIPTION_INACTIVE":
      return 402; // Payment Required
    default:
      return 403;
  }
}
