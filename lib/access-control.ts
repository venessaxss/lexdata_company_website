export function canAccessWorkshop(reg: any) {
  if (!reg) return false;

  const accessStatus = String(reg.access_status || "").toLowerCase();

  if (["revoked", "blocked", "denied", "suspended"].includes(accessStatus)) {
    return false;
  }

  if (accessStatus === "granted") {
    return true;
  }

  return (
    reg.registration_status === "confirmed" ||
    reg.payment_status === "confirmed" ||
    reg.payment_status === "paid" ||
    reg.payment_status === "waived"
  );
}