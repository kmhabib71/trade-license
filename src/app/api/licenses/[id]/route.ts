import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { withTenant, AuthError, authErrorStatus } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { License } from "@/models/License";
import { parseLicensePayload, updateLicense } from "@/lib/licenseWrite";

/** Resolve tenant or return the matching error response. */
async function tenantOr(
  fn: (tenantId: string) => Promise<Response>,
): Promise<Response> {
  try {
    const { tenantId } = await withTenant();
    return await fn(tenantId);
  } catch (e) {
    if (e instanceof AuthError) {
      return NextResponse.json({ error: e.code }, { status: authErrorStatus(e.code) });
    }
    throw e;
  }
}

/** GET /api/licenses/[id] — single record (tenant-scoped). */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return tenantOr(async (tenantId) => {
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    await dbConnect();
    const doc = await License.findOne({ _id: id, tenantId }).lean();
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true, license: { ...doc, id: String(doc._id) } });
  });
}

/** PUT /api/licenses/[id] — update (edit). */
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return tenantOr(async (tenantId) => {
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const parsed = parseLicensePayload(await req.json().catch(() => null));
    if (!parsed.ok) {
      return NextResponse.json(
        { error: "যাচাই ব্যর্থ", issues: parsed.issues },
        { status: 422 },
      );
    }
    await dbConnect();
    try {
      const ok = await updateLicense(tenantId, id, parsed.data);
      if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({ ok: true, id });
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: number }).code === 11000
      ) {
        return NextResponse.json(
          { error: "এই লাইসেন্স নম্বর ইতিমধ্যে সংরক্ষিত আছে" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "আপডেট ব্যর্থ" }, { status: 500 });
    }
  });
}

/** DELETE /api/licenses/[id] — delete with chain repair. If the deleted record
 *  superseded a prior year, restore that prior record to active so the person's
 *  history chain isn't left dangling. */
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  return tenantOr(async (tenantId) => {
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    await dbConnect();
    const doc = await License.findOne({ _id: id, tenantId })
      .select("_id previousLicenseId")
      .lean();
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

    await License.deleteOne({ _id: id, tenantId });

    // Restore the superseded predecessor (if any) to active.
    if (doc.previousLicenseId) {
      await License.updateOne(
        { _id: doc.previousLicenseId, tenantId, supersededBy: id },
        {
          $set: { archived: false, isActive: true },
          $unset: { archivedAt: "", supersededBy: "" },
        },
      );
    }

    return NextResponse.json({ ok: true });
  });
}
