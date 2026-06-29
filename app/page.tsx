import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Expeditions from "@/components/Expeditions";
import Stories from "@/components/Stories";
import ChaosWall from "@/components/ChaosWall";
import FooterCTA from "@/components/FooterCTA";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale";
import type { Trip } from "@/types/expedition";
import type { Story } from "@/types/story";
import type { ChaosCard } from "@/types/chaos";

async function getTrips(): Promise<Trip[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("expeditions")
    .select("*, expedition_members(count)")
    .order("featured", { ascending: false })
    .order("date_start");

  if (!data) return [];

  const statusOrder: Record<string, number> = { ongoing: 0, upcoming: 1, completed: 2 };

  return data
    .map((row) => ({
      id: row.id,
      name: row.name,
      location: row.location,
      difficulty: row.difficulty,
      description: row.description ?? null,
      price: row.price,
      date_start: row.date_start,
      date_end: row.date_end,
      leader_handle: row.leader_handle,
      quota_max: row.quota_max,
      image_url: row.image_url ?? "",
      member_count: (row.expedition_members as { count: number }[])[0]?.count ?? 0,
      featured: row.featured ?? false,
      status: row.status ?? "upcoming",
    }))
    .sort((a, b) => {
      const sa = statusOrder[a.status ?? "upcoming"] ?? 1;
      const sb = statusOrder[b.status ?? "upcoming"] ?? 1;
      return sa - sb;
    });
}

async function getChaosCards(): Promise<ChaosCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chaos_submissions")
    .select("id, author_handle, type, caption, image_url, rotation, accent_color")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

async function getStories(): Promise<Story[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stories")
    .select("id, author_handle, type, title, excerpt, image_url, created_at")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  return data ?? [];
}

export default async function Home() {
  const supabase = await createClient();
  const [{ data: { user } }, locale] = await Promise.all([
    supabase.auth.getUser(),
    getLocale(),
  ]);

  const [trips, stories, chaosCards] = await Promise.all([getTrips(), getStories(), getChaosCards()]);

  let joinedIds: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("expedition_members")
      .select("expedition_id")
      .eq("user_id", user.id);
    joinedIds = data?.map((m) => m.expedition_id) ?? [];
  }

  return (
    <>
      <Nav initialLocale={locale} />
      <main>
        <Hero />
        <Expeditions trips={trips} joinedIds={joinedIds} locale={locale} />
        <Stories stories={stories} locale={locale} />
        <ChaosWall initialCards={chaosCards} />
      </main>
      <FooterCTA />
    </>
  );
}
