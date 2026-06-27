import HeroAdminPanel from "@/components/HeroAdminPanel";

export const dynamic = "force-dynamic";

export default function AdminHeroPage() {
  return (
    <HeroAdminPanel
      title="Admin: Homepage Hero Slides"
      returnTo="/admin/hero"
    />
  );
}
