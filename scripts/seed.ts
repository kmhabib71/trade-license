/**
 * Seed script: super_admin + one demo tenant/inspector + subscription + the
 * sample license (উযাইর ট্রেড ভেঞ্চারস) from the real PDF.
 *
 * Run: npm run seed
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import bcrypt from "bcryptjs";
import { dbConnect } from "../src/lib/db";
import { Tenant } from "../src/models/Tenant";
import { User } from "../src/models/User";
import { Subscription } from "../src/models/Subscription";
import { License } from "../src/models/License";
import { buildPersonKey, parseLicenseNo, parseFiscalYear } from "../src/lib/bangla";

async function main() {
  await dbConnect();

  // ── super_admin ──
  const adminEmail = "admin@tradelicense.local";
  const adminPass = "admin123";
  await User.findOneAndUpdate(
    { email: adminEmail },
    {
      email: adminEmail,
      name: "প্ল্যাটফর্ম অ্যাডমিন",
      role: "super_admin",
      tenantId: null,
      status: "active",
      passwordHash: await bcrypt.hash(adminPass, 10),
    },
    { upsert: true, new: true },
  );

  // ── demo tenant (inspector account) ──
  const tenant = await Tenant.findOneAndUpdate(
    { slug: "demo-chattogram" },
    {
      name: "চট্টগ্রাম ডেমো ইন্সপেক্টর",
      slug: "demo-chattogram",
      city: "চট্টগ্রাম",
      zone: "১৬নং চকবাজার",
      status: "active",
    },
    { upsert: true, new: true },
  );

  // ── inspector user ──
  const inspEmail = "inspector@tradelicense.local";
  const inspPass = "inspector123";
  const inspector = await User.findOneAndUpdate(
    { email: inspEmail },
    {
      email: inspEmail,
      name: "তদন্তকারী (ডেমো)",
      role: "inspector",
      tenantId: tenant._id,
      status: "active",
      passwordHash: await bcrypt.hash(inspPass, 10),
    },
    { upsert: true, new: true },
  );

  if (!tenant.ownerUserId) {
    tenant.ownerUserId = inspector._id;
    await tenant.save();
  }

  // ── subscription (active this month) ──
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  await Subscription.findOneAndUpdate(
    { tenantId: tenant._id },
    {
      tenantId: tenant._id,
      plan: "monthly_500",
      amount: 500,
      currency: "BDT",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
    { upsert: true, new: true },
  );

  // ── sample license from উযাইর ট্রেড ভেঞ্চারস.pdf ──
  const licenseNo = "TRAD/CHTG/006515/2024";
  const oldLicenseNo = "০০৬৫১৫/২০২৪";
  const fiscalYear = parseFiscalYear("2026-2027");
  const personKey = buildPersonKey({ licenseNo, oldLicenseNo, nid: "9137119724" });

  await License.findOneAndUpdate(
    { tenantId: tenant._id, licenseNo },
    {
      tenantId: tenant._id,
      businessName: "উযাইর ট্রেড ভেঞ্চারস",
      ownerName: "তাসনিম তাবাস্সুম",
      fatherOrHusbandName: "শাহ মুরাদ",
      motherName: "ইয়াসমিন আরা",
      businessNature: "অন্যান্য - একক",
      businessType: "কমিশন এজেন্ট, আমদানীকারক",
      address: "এস. এ টাওয়ার, ৩০/বি, কাতালগঞ্জ, আ/এ, রোড নং-৪, পাঁচলাইশ, চট্টগ্রাম",
      ward: "২",
      market: "১৬নং চকবাজার (২য় অংশ)",
      area: "চকবাজার",
      nidPassportBirth: "9137119724",
      phone: "01729093255",
      presentAddress: {
        holding: "এস এ টাওয়ার, ৩০/বি",
        road: "০৪",
        village: "কাতালগঞ্জ আ/এ",
        postcode: "৪২০৩",
        thana: "পাঁচলাইশ",
        district: "চট্টগ্রাম",
        division: "চট্টগ্রাম",
      },
      permanentAddress: {
        holding: "ঈদা গাজীর বাড়ি",
        village: "কাইগ্রাম",
        postcode: "৪৩৭১",
        thana: "পটিয়া",
        district: "চট্টগ্রাম",
        division: "চট্টগ্রাম",
      },
      licenseNo,
      oldLicenseNo,
      referenceYear: parseLicenseNo(licenseNo).referenceYear,
      fiscalYear,
      status: "renewed",
      businessStartDate: new Date("2024-07-01"),
      issueDate: new Date("2026-07-01"),
      issueTime: "17:06:04",
      expiryDate: new Date("2027-06-30"),
      licenseFee: 4000,
      signboardTax: 400,
      surcharge: 0,
      vat: 600,
      incomeTax: 3000,
      bookFee: 0,
      formFee: 15,
      arrears: 0,
      correctionFee: 0,
      total: 8015,
      paymentStatus: "due",
      amountDue: 8015,
      personKey,
      isActive: true,
      archived: false,
      sourceType: "pdf",
      extractionMethod: "manual",
      verified: true,
    },
    { upsert: true, new: true },
  );

  console.log("✅ Seed complete.");
  console.log(`   super_admin: ${adminEmail} / ${adminPass}`);
  console.log(`   inspector:   ${inspEmail} / ${inspPass}`);
  console.log(`   tenant:      ${tenant.name} (${tenant.slug})`);
  console.log(`   license:     ${licenseNo} (personKey=${personKey})`);

  await (await import("mongoose")).default.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
