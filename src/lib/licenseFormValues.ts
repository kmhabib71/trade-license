/**
 * Shared license-form value shape + empty factory. Kept in a plain module (no
 * "use client") so both the client `LicenseForm` and the server create/edit
 * pages can import it. (A client module can't export helpers a server component
 * calls.)
 */
export interface LicenseFormValues {
  businessName: string;
  ownerName: string;
  fatherOrHusbandName: string;
  motherName: string;
  businessNature: string;
  businessType: string;
  address: string;
  ward: string;
  market: string;
  area: string;
  zone: string;
  nidPassportBirth: string;
  binNo: string;
  tinNo: string;
  phone: string;
  email: string;
  licenseNo: string;
  oldLicenseNo: string;
  fiscalYear: string;
  status: "new" | "renewed";
  businessStartDate: string;
  issueDate: string;
  expiryDate: string;
  licenseFee: string;
  signboardTax: string;
  surcharge: string;
  vat: string;
  incomeTax: string;
  bookFee: string;
  formFee: string;
  arrears: string;
  correctionFee: string;
  total: string;
  paymentStatus: "paid" | "due";
  amountPaid: string;
  amountDue: string;
}

export function emptyFormValues(): LicenseFormValues {
  return {
    businessName: "", ownerName: "", fatherOrHusbandName: "", motherName: "",
    businessNature: "", businessType: "", address: "", ward: "", market: "",
    area: "", zone: "", nidPassportBirth: "", binNo: "", tinNo: "", phone: "",
    email: "", licenseNo: "", oldLicenseNo: "", fiscalYear: "", status: "new",
    businessStartDate: "", issueDate: "", expiryDate: "", licenseFee: "",
    signboardTax: "", surcharge: "", vat: "", incomeTax: "", bookFee: "",
    formFee: "", arrears: "", correctionFee: "", total: "", paymentStatus: "due",
    amountPaid: "", amountDue: "",
  };
}
