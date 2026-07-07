import { redirect, notFound } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { getSession, hasActiveSubscription } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { License } from "@/models/License";
import LicenseForm from "../../LicenseForm";
import {
  emptyFormValues,
  type LicenseFormValues,
} from "@/lib/licenseFormValues";

/** Phase 6.3 — edit an existing license. Loads the record, fills the form. */
export default async function EditLicensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "inspector" || !session.tenantId) {
    redirect("/login");
  }
  if (!(await hasActiveSubscription(session.tenantId))) {
    redirect("/billing");
  }
  if (!isValidObjectId(id)) notFound();

  await dbConnect();
  const doc = await License.findOne({ _id: id, tenantId: session.tenantId }).lean();
  if (!doc) notFound();

  const initial = toFormValues(doc);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <div className="mb-6">
        <a href={`/licenses/${id}`} className="text-sm text-brand hover:underline">
          ← বিস্তারিত-এ ফিরুন
        </a>
        <h1 className="mt-2 text-2xl font-bold">লাইসেন্স সম্পাদনা</h1>
        <p className="text-sm text-slate-500">{doc.businessName}</p>
      </div>
      <LicenseForm mode="edit" id={id} initial={initial} />
    </div>
  );
}

/** Format a stored Date to `dd/mm/yyyy` for the form's date inputs. */
function fmtDate(d: unknown): string {
  if (!(d instanceof Date) && typeof d !== "string") return "";
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "";
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${dt.getUTCFullYear()}`;
}

function num(v: unknown): string {
  return typeof v === "number" ? String(v) : "";
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFormValues(doc: any): LicenseFormValues {
  return {
    ...emptyFormValues(),
    businessName: str(doc.businessName),
    ownerName: str(doc.ownerName),
    fatherOrHusbandName: str(doc.fatherOrHusbandName),
    motherName: str(doc.motherName),
    businessNature: str(doc.businessNature),
    businessType: str(doc.businessType),
    address: str(doc.address),
    ward: str(doc.ward),
    market: str(doc.market),
    area: str(doc.area),
    zone: str(doc.zone),
    nidPassportBirth: str(doc.nidPassportBirth),
    binNo: str(doc.binNo),
    tinNo: str(doc.tinNo),
    phone: str(doc.phone),
    email: str(doc.email),
    licenseNo: str(doc.licenseNo),
    oldLicenseNo: str(doc.oldLicenseNo),
    fiscalYear: str(doc.fiscalYear),
    status: doc.status === "renewed" ? "renewed" : "new",
    businessStartDate: fmtDate(doc.businessStartDate),
    issueDate: fmtDate(doc.issueDate),
    expiryDate: fmtDate(doc.expiryDate),
    licenseFee: num(doc.licenseFee),
    signboardTax: num(doc.signboardTax),
    surcharge: num(doc.surcharge),
    vat: num(doc.vat),
    incomeTax: num(doc.incomeTax),
    bookFee: num(doc.bookFee),
    formFee: num(doc.formFee),
    arrears: num(doc.arrears),
    correctionFee: num(doc.correctionFee),
    total: num(doc.total),
    paymentStatus: doc.paymentStatus === "paid" ? "paid" : "due",
    amountPaid: num(doc.amountPaid),
    amountDue: num(doc.amountDue),
  };
}
