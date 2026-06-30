import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import HomeHeroCarousel, { HomeHeroSlide } from "@/components/HomeHeroCarousel";

export default async function HomeHero() {
  noStore();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("home_hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("HomeHero error:", error.message);
  }

  return <HomeHeroCarousel slides={(data ?? []) as HomeHeroSlide[]} />;
}
