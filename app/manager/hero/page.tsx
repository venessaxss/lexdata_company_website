import HeroAdminPanel from "@/components/HeroAdminPanel";

export const dynamic = "force-dynamic";

export default function ManagerHeroPage() {
  return (
    <HeroAdminPanel
      title="Manager: Homepage Hero Slides"
      returnTo="/manager/hero"
    />
  );
}
