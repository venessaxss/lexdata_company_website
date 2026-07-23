export function canAccessWorkshop(reg: any) {
  if (!reg) return false;

  return (
    reg.registration_status === "confirmed" ||
    reg.payment_status === "confirmed" ||
    reg.payment_status === "waived"
  );
}