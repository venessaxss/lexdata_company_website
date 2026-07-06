export function canAccessWorkshop(reg: any) {
  return (
    reg.registration_status === "confirmed" &&
    reg.payment_status === "confirmed"
  );
}