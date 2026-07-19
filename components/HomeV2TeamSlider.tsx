import { createAdminClient } from "@/lib/supabase/admin";
import HomeV2TeamSliderClient from "@/components/HomeV2TeamSliderClient";

export type V2TeamMember = {
  id: string;
  name: string;
  role: string;
  bio?: string | null;
  image?: string | null;
  profileUrl: string;
};

export default async function HomeV2TeamSlider() {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("team_members")
    .select(
      "id,name,full_name,title,role,role_title,position_title,bio,photo_url,profile_image_url,media_url,profile_slug,is_active,is_published,sort_order,display_order"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("display_order", { ascending: true })
    .limit(12);

  if (error) {
    console.error("HomeV2TeamSlider error:", error.message);
    return null;
  }

  const members: V2TeamMember[] = (data ?? [])
    .filter((member: any) => member.is_published !== false)
    .map((member: any) => ({
      id: member.id,
      name: member.full_name || member.name || "LexData Member",
      role:
        member.position_title ||
        member.role_title ||
        member.role ||
        member.title ||
        "Team Member",
      bio: member.bio,
      image: member.media_url || member.photo_url || member.profile_image_url,
      profileUrl: member.profile_slug
        ? `/team/${member.profile_slug}`
        : `/team/${member.id}`,
    }));

  if (members.length === 0) return null;

  return <HomeV2TeamSliderClient members={members} />;
}