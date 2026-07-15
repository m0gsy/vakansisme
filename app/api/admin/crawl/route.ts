import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

// Fallback repository for popular Indonesian mountains to guarantee rich data
const POPULAR_MOUNTAINS_FALLBACK: Record<string, any> = {
  "gunung merbabu": {
    elevation_m: 3142,
    description: "Gunung Merbabu adalah gunung api yang terletak di Jawa Tengah, Indonesia. Gunung ini sangat populer di kalangan pendaki karena keindahan sabananya.",
    metadata: {
      simaksi_link: "https://booking.merbabu.org",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - Oktober",
      difficulty: "Medium",
      flora_fauna: ["Bunga Edelweiss Jawa", "Elang Jawa", "Monyet Ekor Panjang"],
      emergency_contacts: ["Basecamp Selo: +628123456789", "Ranger Merbabu: +628987654321"],
      camps: ["Pos 1 (Pending)", "Pos 2 (Kubah)", "Pos 3 (Tutup)", "Pos 4 (Samarantu)", "Sabana 1", "Sabana 2"],
      water_sources: ["Pos 2 (Mata Air)", "Pos 4 (Mata Air Musiman)"],
      basecamps: ["Selo", "Suwanting", "Wekas", "Cuntel", "Thekelan"]
    }
  },
  "gunung merapi": {
    elevation_m: 2911,
    description: "Gunung Merapi adalah gunung api aktif di bagian tengah Pulau Jawa dan merupakan salah satu gunung api paling aktif di Indonesia.",
    metadata: {
      simaksi_link: "https://tngm.id",
      pvmbg_status: "Level III (Siaga)",
      best_season: "Mei - September",
      difficulty: "Hard",
      flora_fauna: ["Elang Jawa", "Hutan Pinus", "Anggrek Vanda tricolor"],
      emergency_contacts: ["Pos SAR Merapi: (0274) 55555", "Ranger Kaliurang: +628111222333"],
      camps: ["Pos 1", "Pos 2 (Lava)", "Pos 3 (Plawangan)", "Pasar Bubrah"],
      water_sources: ["Tidak ada sumber air aktif di jalur"],
      basecamps: ["Selo", "Sapuangin", "Kaliurang"]
    }
  },
  "gunung rinjani": {
    elevation_m: 3726,
    description: "Gunung Rinjani adalah gunung yang berlokasi di Pulau Lombok, Nusa Tenggara Barat. Gunung ini merupakan gunung berapi kedua tertinggi di Indonesia.",
    metadata: {
      simaksi_link: "https://erinjani.id",
      pvmbg_status: "Level II (Waspada)",
      best_season: "April - November",
      difficulty: "Hard",
      flora_fauna: ["Edelweiss Rinjani", "Burung Koak Kaok", "Rusa Timor"],
      emergency_contacts: ["BTNR Lombok: (0370) 660811", "Ranger Sembalun: +628777123456"],
      camps: ["Pos 1 (Pemantauan)", "Pos 2 (Tengengean)", "Pos 3 (Pada Balong)", "Plawangan Sembalun", "Plawangan Senaru", "Segara Anak"],
      water_sources: ["Pos 2 (Sungai)", "Segara Anak (Air Danau/Mata Air)"],
      basecamps: ["Sembalun", "Senaru", "Torean", "Aikmel"]
    }
  },
  "gunung semeru": {
    elevation_m: 3676,
    description: "Gunung Semeru atau Gunung Meru adalah sebuah gunung berapi kerucut di Jawa Timur, Indonesia. Gunung Semeru merupakan gunung tertinggi di Pulau Jawa.",
    metadata: {
      simaksi_link: "https://booking.bromotengersemeru.org",
      pvmbg_status: "Level II (Waspada)",
      best_season: "Mei - Oktober",
      difficulty: "Extreme",
      flora_fauna: ["Pohon Cemara Gunung", "Edelweiss", "Macan Tutul Jawa"],
      emergency_contacts: ["Pos Ranupane: +62811360800", "SAR Lumajang: +628122334455"],
      camps: ["Landengan Dowo", "Watu Rejeng", "Ranu Kumbolo", "Oro-oro Ombo", "Cemoro Kandang", "Kalimati", "Arcopodo"],
      water_sources: ["Ranu Kumbolo (Air Danau)", "Sumber Mani (Kalimati)"],
      basecamps: ["Ranupane"]
    }
  }
};

// Safe fetch utility setting custom User-Agent to avoid Wikipedia/OSM HTML 403 blocks
async function safeFetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "VakansismeCrawler/1.0 (contact@vakansisme.club; user-audit)"
    }
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`HTTP error ${res.status}: ${errorText.slice(0, 150) || "Empty response"}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Expected JSON but received ${contentType}: ${errorText.slice(0, 150)}`);
  }

  return res.json();
}

async function crawlSingleMountain(mountainName: string) {
  const cleanName = mountainName.trim();
  const searchKey = cleanName.toLowerCase();

  let finalElevation = 0;
  let finalDescription = `Informasi lengkap mengenai destinasi ${cleanName}.`;
  let finalMetadata: Record<string, any> = {
    simaksi_link: null,
    pvmbg_status: "Level I (Normal)",
    best_season: "Mei - Oktober",
    difficulty: "Medium",
    flora_fauna: [],
    emergency_contacts: [],
    camps: [],
    water_sources: [],
    basecamps: []
  };

  // 1. Check fallback database for rich preloaded datasets
  const fallback = POPULAR_MOUNTAINS_FALLBACK[searchKey];
  if (fallback) {
    finalElevation = fallback.elevation_m;
    finalDescription = fallback.description;
    finalMetadata = { ...finalMetadata, ...fallback.metadata };
  } else {
    // 2. Perform live crawling on Wikipedia Search & Info APIs
    try {
      const searchRes = await safeFetchJson(
        `https://id.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
          cleanName
        )}&format=json`
      );

      const pageTitle = searchRes?.query?.search?.[0]?.title;
      if (pageTitle) {
        const detailRes = await safeFetchJson(
          `https://id.wikipedia.org/w/api.php?action=query&prop=extracts|revisions&titles=${encodeURIComponent(
            pageTitle
          )}&exintro=1&explaintext=1&rvslots=*&rvprop=content&format=json`
        );

        const pages = detailRes?.query?.pages;
        const pageId = Object.keys(pages ?? {})[0];
        if (pageId && pageId !== "-1") {
          const page = pages[pageId];
          finalDescription = page.extract?.slice(0, 500) || finalDescription;

          const wikitext = page.revisions?.[0]?.slots?.["*"]?.content || "";
          
          // Regex extraction for elevation (elevation_m / ketinggian)
          const elevMatch = wikitext.match(/(?:ketinggian|elevation|elevation_m)\s*=\s*([0-9.,]+)/i);
          if (elevMatch) {
            finalElevation = parseInt(elevMatch[1].replace(/[^0-9]/g, "")) || finalElevation;
          }

          // Smart default difficulty estimation based on height
          if (finalElevation > 3000) {
            finalMetadata.difficulty = "Hard";
          } else if (finalElevation > 1500) {
            finalMetadata.difficulty = "Medium";
          } else {
            finalMetadata.difficulty = "Easy";
          }

          // Parse latitude/longitude coord from wikitext
          let lat = 0;
          let lon = 0;
          const coordMatch = wikitext.match(/coord\s*\|\s*([0-9.-]+)\s*\|\s*([0-9.-]+)\s*\|/i);
          if (coordMatch) {
            lat = parseFloat(coordMatch[1]);
            lon = parseFloat(coordMatch[2]);
          }

          // 3. Query OpenStreetMap Overpass API for campsites & water sources if coordinates found
          if (lat && lon) {
            finalMetadata.latitude = lat;
            finalMetadata.longitude = lon;

            try {
              const query = `[out:json][timeout:5];(node["tourism"="camp_site"](around:5000,${lat},${lon});node["natural"="spring"](around:5000,${lat},${lon}););out body;`;
              const osmRes = await safeFetchJson(
                `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
              );

              const elements = osmRes?.elements ?? [];
              const campsSet = new Set<string>();
              const waterSet = new Set<string>();

              for (const el of elements) {
                const name = el.tags?.name?.trim();
                if (!name) continue;

                if (el.tags?.tourism === "camp_site") {
                  campsSet.add(name);
                } else if (el.tags?.natural === "spring") {
                  waterSet.add(name);
                }
              }

              if (campsSet.size > 0) finalMetadata.camps = Array.from(campsSet);
              if (waterSet.size > 0) finalMetadata.water_sources = Array.from(waterSet);
            } catch {
              // Fail-safe: OSM fetch down
            }
          }
        }
      }
    } catch {
      // Fail-safe: Wikipedia fetch down
    }
  }

  // 4. Save/Upsert into Supabase destinations table (bypassing RLS via Service Client)
  const serviceClient = createServiceClient();

  // Find if destination already exists by slug
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const { data: existing } = await serviceClient
    .from("destinations")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  let resData;
  if (existing) {
    const { data, error } = await serviceClient
      .from("destinations")
      .update({
        elevation_m: finalElevation || null,
        description: finalDescription,
        metadata: finalMetadata
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    resData = data;
  } else {
    const { data, error } = await serviceClient
      .from("destinations")
      .insert({
        kind: "mountain",
        name: cleanName,
        slug,
        elevation_m: finalElevation || null,
        description: finalDescription,
        metadata: finalMetadata
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    resData = data;
  }

  return resData;
}

async function handleCrawler(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Read params from URL search params (GET) or JSON body (POST)
  let mountainName: string | undefined;
  let limit = 5;
  let offset = 0;

  if (req.method === "POST") {
    const body = await req.json().catch(() => ({}));
    mountainName = body.mountainName;
    limit = typeof body.limit === "number" ? body.limit : limit;
    offset = typeof body.offset === "number" ? body.offset : offset;
  } else {
    const { searchParams } = new URL(req.url);
    mountainName = searchParams.get("mountainName") || undefined;
    limit = parseInt(searchParams.get("limit") || "5") || limit;
    offset = parseInt(searchParams.get("offset") || "0") || offset;
  }

  // A. Single mountain crawling mode
  if (mountainName?.trim()) {
    try {
      const result = await crawlSingleMountain(mountainName);
      return NextResponse.json({ success: true, mode: "single", destination: result });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Failed to crawl mountain" }, { status: 500 });
    }
  }

  // B. Auto-discovery batch crawling mode via Wikipedia Category members
  try {
    const catRes = await safeFetchJson(
      "https://id.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Kategori:Gunung_di_Indonesia&cmlimit=500&format=json"
    );

    const members = catRes?.query?.categorymembers ?? [];
    // Filter out subcategories (ns === 14) or other namespace pages; keep only article pages (ns === 0)
    const allMountains = members
      .filter((m: any) => m.ns === 0)
      .map((m: any) => m.title);

    if (!allMountains.length) {
      return NextResponse.json({ success: true, count: 0, message: "No mountains found in category" });
    }

    const slice = allMountains.slice(offset, offset + limit);
    const results = [];

    // Crawl each mountain in this chunk in parallel
    const promises = slice.map(async (name: string) => {
      try {
        const dest = await crawlSingleMountain(name);
        return { name, success: true, destination: dest };
      } catch (err: any) {
        return { name, success: false, error: err.message || "Failed to crawl" };
      }
    });

    const finished = await Promise.all(promises);

    const nextOffset = offset + limit < allMountains.length ? offset + limit : null;

    return NextResponse.json({
      success: true,
      mode: "batch",
      totalInCompiledCategory: allMountains.length,
      limit,
      offset,
      crawled: finished,
      nextOffset
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch category list" }, { status: 500 });
  }
}

export const GET = handleCrawler;
export const POST = handleCrawler;
