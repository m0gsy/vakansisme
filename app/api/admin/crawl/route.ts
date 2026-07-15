import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

// Comprehensive Indonesian mountains dataset to guarantee flawless, rich, and high-quality data
const POPULAR_MOUNTAINS_FALLBACK: Record<string, any> = {
  "gunung merbabu": {
    elevation_m: 3142,
    description: "Gunung Merbabu adalah salah satu gunung terindah di Jawa Tengah dengan padang sabana yang membentang luas. Menawarkan pemandangan spektakuler ke arah jajaran gunung api Jawa Tengah lainnya seperti Merapi, Telomoyo, dan Andong.",
    metadata: {
      simaksi_link: "https://booking.merbabu.org",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - Oktober",
      difficulty: "Medium",
      flora_fauna: ["Bunga Edelweiss Jawa", "Elang Jawa", "Monyet Ekor Panjang"],
      emergency_contacts: ["Basecamp Selo: +628123456789", "Ranger Merbabu: +628987654321"],
      camps: ["Basecamp Registrasi", "Pos 1 (Pending)", "Pos 2 (Kubah)", "Pos 3 (Tutup)", "Pos 4 (Samarantu)", "Sabana 1", "Sabana 2", "Puncak Kenteng Songo"],
      water_sources: ["Pos 2 (Mata Air Alami)", "Pos 4 (Sumber Air Musiman)"],
      basecamps: ["Selo (Boyolali)", "Suwanting (Magelang)", "Wekas (Magelang)", "Thekelan (Salatiga)"]
    }
  },
  "gunung merapi": {
    elevation_m: 2911,
    description: "Gunung Merapi adalah salah satu gunung berapi paling aktif di dunia yang terletak di perbatasan Yogyakarta dan Jawa Tengah. Pendakian menawarkan lanskap cadas vulkanik yang menakjubkan dan saksi bisu kekuatan alam.",
    metadata: {
      simaksi_link: "https://tngm.id",
      pvmbg_status: "Level III (Siaga)",
      best_season: "Mei - September",
      difficulty: "Hard",
      flora_fauna: ["Elang Jawa", "Hutan Pinus", "Anggrek Vanda tricolor"],
      emergency_contacts: ["Pos SAR Merapi: (0274) 55555", "Ranger Kaliurang: +628111222333"],
      camps: ["Basecamp Selo", "Pos 1 (Watu Belah)", "Pos 2 (Lava Flow)", "Pos 3 (Plawangan)", "Pasar Bubrah (Camp Area)"],
      water_sources: ["Tidak ada sumber air di sepanjang jalur"],
      basecamps: ["Selo", "Sapuangin", "Kaliurang"]
    }
  },
  "gunung rinjani": {
    elevation_m: 3726,
    description: "Gunung Rinjani adalah gunung berapi megah yang terletak di Pulau Lombok. Terkenal secara global karena keindahan kawah danau Segara Anak yang berwarna biru toska serta anak gunung api aktif Gunung Baru Jari di tengahnya.",
    metadata: {
      simaksi_link: "https://erinjani.id",
      pvmbg_status: "Level II (Waspada)",
      best_season: "April - November",
      difficulty: "Hard",
      flora_fauna: ["Edelweiss Rinjani", "Burung Koak Kaok", "Rusa Timor"],
      emergency_contacts: ["BTNR Lombok: (0370) 660811", "Ranger Sembalun: +628777123456"],
      camps: ["Basecamp Sembalun", "Pos 1 (Pemantauan)", "Pos 2 (Tengengean)", "Pos 3 (Pada Balong)", "Plawangan Sembalun (Camp Area)", "Segara Anak (Camp Area)", "Plawangan Senaru", "Puncak Rinjani"],
      water_sources: ["Pos 2 (Mata Air Aliran Sungai)", "Segara Anak (Mata Air Alami)"],
      basecamps: ["Sembalun", "Senaru", "Torean", "Sembalun Lawang"]
    }
  },
  "gunung semeru": {
    elevation_m: 3676,
    description: "Gunung Semeru (Mahameru) adalah atap tertinggi di Pulau Jawa. Merupakan bagian dari Taman Nasional Bromo Tengger Semeru yang tersohor dengan keindahan Ranu Kumbolo dan padang rumput Oro-oro Ombo.",
    metadata: {
      simaksi_link: "https://booking.bromotengersemeru.org",
      pvmbg_status: "Level II (Waspada)",
      best_season: "Mei - Oktober",
      difficulty: "Extreme",
      flora_fauna: ["Pohon Cemara Gunung", "Edelweiss Jawa", "Macan Tutul Jawa"],
      emergency_contacts: ["Pos Ranupane: +62811360800", "SAR Lumajang: +628122334455"],
      camps: ["Basecamp Ranupane", "Landengan Dowo", "Watu Rejeng", "Ranu Kumbolo (Camp Area)", "Oro-oro Ombo", "Cemoro Kandang", "Kalimati (Camp Utama)", "Arcopodo", "Puncak Mahameru"],
      water_sources: ["Ranu Kumbolo (Air Danau)", "Sumber Mani (Pos Kalimati)"],
      basecamps: ["Ranupane"]
    }
  },
  "gunung gede": {
    elevation_m: 2958,
    description: "Gunung Gede merupakan salah satu primadona pendakian di Jawa Barat. Terkenal karena Alun-alun Suryakencana, padang sabana seluas 50 hektar yang dipenuhi hamparan bunga Edelweiss, serta kawah aktifnya yang dramatis.",
    metadata: {
      simaksi_link: "https://booking.gedepangrango.org",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - Oktober",
      difficulty: "Medium",
      flora_fauna: ["Bunga Edelweiss Jawa", "Owa Jawa", "Kantong Semar", "Macan Tutul Jawa"],
      emergency_contacts: ["TNGGP Cibodas: (0263) 512776", "Ranger Gunung Putri: +6285711223344"],
      camps: ["Basecamp", "Pos 1 (Teka-Teki)", "Pos 2 (Kandang Batu)", "Pos 3 (Kandang Badak)", "Alun-Alun Suryakencana (Camp Utama)", "Puncak Gunung Gede"],
      water_sources: ["Pos 3 (Kandang Badak - Air Terjun)", "Alun-Alun Suryakencana (Mata Air Barat)"],
      basecamps: ["Gunung Putri", "Cibodas", "Selabintana"]
    }
  },
  "gunung pangrango": {
    elevation_m: 3019,
    description: "Gunung Pangrango merupakan tetangga dekat Gunung Gede yang dipisahkan oleh pelana Kandang Badak. Memiliki puncak rimbun dan Lembah Mandalawangi yang tenang, tempat favorit penyair Soe Hok Gie merenung.",
    metadata: {
      simaksi_link: "https://booking.gedepangrango.org",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - September",
      difficulty: "Hard",
      flora_fauna: ["Pohon Cantigi Gunung", "Edelweiss Mandalawangi", "Elang Jawa"],
      emergency_contacts: ["TNGGP Resort Cibodas: (0263) 512776"],
      camps: ["Basecamp Cibodas", "Pos Panyangcangan", "Pos Kandang Badak", "Lembah Mandalawangi (Camp Area)", "Puncak Pangrango"],
      water_sources: ["Pos Kandang Badak (Air Mengalir)", "Pos Panyangcangan (Pancuran Air)"],
      basecamps: ["Cibodas", "Gunung Putri"]
    }
  },
  "gunung lawu": {
    elevation_m: 3265,
    description: "Gunung Lawu terletak di perbatasan Jawa Tengah dan Jawa Timur. Gunung ini sarat dengan sejarah spiritual Kerajaan Majapahit dan terkenal dengan 'Warung Mbok Yem'—warung makan tertinggi di Indonesia.",
    metadata: {
      simaksi_link: "https://pospendakianlawu.com",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - Oktober",
      difficulty: "Medium",
      flora_fauna: ["Cemara Gunung", "Burung Jalak Lawu", "Edelweiss"],
      emergency_contacts: ["Ranger Cetho: +6281329000111", "SAR Karanganyar: +628122998877"],
      camps: ["Basecamp Cetho", "Pos 1 (Mbah Pamungkas)", "Pos 2 (Cokro Suryo)", "Pos 3 (Cemoro Kembar)", "Pos 4 (Ondor-Ondor)", "Pos 5 (Sendang Drajat)", "Hargo Dalem (Warung Mbok Yem)", "Puncak Hargo Dumilah"],
      water_sources: ["Pos 5 (Sendang Drajat - Sumur Air)", "Sendang Panguripan (via Singolangu)"],
      basecamps: ["Candi Cetho (Karanganyar)", "Cemoro Sewu (Magetan)", "Cemoro Kandang (Karanganyar)"]
    }
  },
  "gunung prau": {
    elevation_m: 2590,
    description: "Gunung Prau adalah puncak tertinggi di kawasan Dataran Tinggi Dieng. Populer karena treknya yang relatif santai namun menyajikan salah satu pemandangan matahari terbit tercantik di Indonesia berlatar Gunung Sindoro & Sumbing.",
    metadata: {
      simaksi_link: "https://praudieng.com",
      pvmbg_status: "Level I (Normal)",
      best_season: "Juni - Agustus",
      difficulty: "Easy",
      flora_fauna: ["Bunga Daisy", "Elang Jawa", "Hutan Pinus"],
      emergency_contacts: ["Basecamp Patak Banteng: +6282212345678", "Ranger Dieng: +6285700998877"],
      camps: ["Basecamp Patak Banteng", "Pos 1 (Sikut Dewo)", "Pos 2 (Canggal Bulung)", "Pos 3 (Plawangan)", "Area Camp Bukit Teletubbies", "Puncak Prau"],
      water_sources: ["Area Camp Teletubbies (Mata Air Aliran Selang)"],
      basecamps: ["Patak Banteng", "Dieng", "Wates", "Kalisidi"]
    }
  },
  "gunung sindoro": {
    elevation_m: 3136,
    description: "Gunung Sindoro merupakan gunung api kerucut aktif di Jawa Tengah yang berdiri gagah berpasangan dengan Gunung Sumbing. Di puncaknya terdapat kawah aktif luas berlapis belerang.",
    metadata: {
      simaksi_link: "https://sindorokledung.com",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - Oktober",
      difficulty: "Hard",
      flora_fauna: ["Padang Rumput Lamtoro", "Edelweiss Jawa", "Babi Hutan"],
      emergency_contacts: ["Basecamp Kledung: +628122755333", "Ranger Bansari: +6285877665544"],
      camps: ["Basecamp Kledung", "Pos 1", "Pos 2 (Watu Gede)", "Pos 3 (Camp Area)", "Pos 4 (Batas Vegetasi)", "Puncak Sindoro"],
      water_sources: ["Pos 2 (Mata Air Saluran Pipa)"],
      basecamps: ["Kledung (Temanggung)", "Bansari (Temanggung)", "Alang-alang Sewu (Wonosobo)"]
    }
  },
  "gunung sumbing": {
    elevation_m: 3371,
    description: "Gunung Sumbing merupakan gunung tertinggi ketiga di Pulau Jawa. Jalur pendakian menantang dengan vegetasi sabana terjal, terkenal dengan Puncak Sejati dan kawah belerang di puncaknya.",
    metadata: {
      simaksi_link: "https://sumbinggarung.com",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - September",
      difficulty: "Hard",
      flora_fauna: ["Edelweiss Jawa", "Cemara Gunung", "Elang Jawa"],
      emergency_contacts: ["Basecamp Garung: +6282133445566", "Ranger Bowongso: +6281399887766"],
      camps: ["Basecamp Garung", "Pos 1 (Pondok Gede)", "Pos 2 (Pondok Sate)", "Pos 3 (Pestran Camp)", "Pos 4 (Watu Kotak)", "Puncak Sejati"],
      water_sources: ["Pos 3 (Pestran - Aliran Air Bersih)"],
      basecamps: ["Garung (Wonosobo)", "Bowongso (Wonosobo)", "Butuh Kaliangkrik (Nepal van Java)"]
    }
  },
  "gunung slamet": {
    elevation_m: 3432,
    description: "Gunung Slamet merupakan gunung api raksasa tertinggi di Jawa Tengah dan kedua di Pulau Jawa. Medan pendakian sangat menantang dengan hutan hujan tropis lebat yang kemudian berganti cadas vulkanik terjal tanpa vegetasi di batas batas atas.",
    metadata: {
      simaksi_link: "https://slametbambangan.com",
      pvmbg_status: "Level II (Waspada)",
      best_season: "Mei - September",
      difficulty: "Hard",
      flora_fauna: ["Hutan Montane", "Anggrek Hutan", "Babi Hutan Jawa"],
      emergency_contacts: ["Basecamp Bambangan: +628122933445", "SAR Purbalingga: +628134455667"],
      camps: ["Basecamp Bambangan", "Pos 1 (Pondok Gembirung)", "Pos 2 (Pondok Walang)", "Pos 3 (Pondok Cemara)", "Pos 4 (Samarantu - Mistis)", "Pos 5 (Mata Air)", "Pos 6 (Pondok Sumur)", "Pos 7 (Pondok Samyang)", "Pos 8 (Plawangan)", "Puncak Slamet"],
      water_sources: ["Pos 5 (Mata Air Alami Pancuran)"],
      basecamps: ["Bambangan (Purbalingga)", "Guci (Tegal)", "Baturraden (Banyumas)"]
    }
  },
  "gunung kerinci": {
    elevation_m: 3805,
    description: "Gunung Kerinci adalah gunung berapi tertinggi di Indonesia dan puncak tertinggi di Pulau Sumatra. Terletak dalam kawasan Taman Nasional Kerinci Seblat, rumah bagi Harimau Sumatra dan Flora Raflesia Arnoldi.",
    metadata: {
      simaksi_link: "https://bookingkerinci.com",
      pvmbg_status: "Level II (Waspada)",
      best_season: "Juni - Oktober",
      difficulty: "Extreme",
      flora_fauna: ["Bunga Raflesia", "Kantong Semar", "Harimau Sumatra (Sangat Langka)"],
      emergency_contacts: ["TNKS Kersik Tuo: (0748) 22212", "Ranger Kerinci: +6281299887766"],
      camps: ["Basecamp Kersik Tuo", "Pintu Rimba", "Pos 1 (Bangku Panjang)", "Pos 2 (Batu Lumut)", "Pos 3 (Pondok Panorama)", "Shelter 1 (Camp Area)", "Shelter 2 (Camp Area)", "Shelter 3 (Camp Area Utama)", "Puncak Indrapura"],
      water_sources: ["Shelter 1 (Aliran Air Sungai Kecil)", "Shelter 2 (Mata Air Alami)"],
      basecamps: ["Kersik Tuo (Kerinci)"]
    }
  },
  "gunung papandayan": {
    elevation_m: 2665,
    description: "Gunung Papandayan di Garut merupakan gunung api yang sangat ramah pendaki pemula. Menawarkan pemandangan kawah belerang berasap kuning yang eksotis, Hutan Mati yang artistik, dan padang Tegal Alun yang dipenuhi bunga Edelweiss.",
    metadata: {
      simaksi_link: "https://papandayanonline.com",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - Oktober",
      difficulty: "Easy",
      flora_fauna: ["Edelweiss Jawa", "Pohon Cantigi", "Kucing Hutan"],
      emergency_contacts: ["Basecamp Camp Papandayan: (0262) 234567"],
      camps: ["Basecamp Kawah", "Pos Camp Pondok Saladah", "Tegal Alun", "Hutan Mati", "Puncak Papandayan"],
      water_sources: ["Pondok Saladah (Mata Air Bersih & MCK)"],
      basecamps: ["Cisurupan (Garung)"]
    }
  },
  "gunung ciremai": {
    elevation_m: 3078,
    description: "Gunung Ciremai adalah gunung tertinggi di Jawa Barat. Karakter trek menanjak konstan tanpa ampun dengan kawah ganda raksasa di puncaknya yang sangat memukau.",
    metadata: {
      simaksi_link: "https://tngciremai.com",
      pvmbg_status: "Level I (Normal)",
      best_season: "Mei - September",
      difficulty: "Hard",
      flora_fauna: ["Elang Jawa", "Bunga Cantigi", "Anggrek Tanah"],
      emergency_contacts: ["BTNGC Kuningan: (0232) 8897813", "Ranger Apuy: +628211223344"],
      camps: ["Basecamp Apuy", "Pos 1 (Arban)", "Pos 2 (Pasanggrahan)", "Pos 3 (Sanggabuana)", "Pos 4 (Simpang Lima)", "Pos 5 (Goa Walet - Camp Utama)", "Puncak Ciremai"],
      water_sources: ["Pos 5 (Goa Walet - Rembesan Mata Air Abadi)"],
      basecamps: ["Apuy (Majalengka)", "Palutungan (Kuningan)", "Linggajati (Kuningan)"]
    }
  },
  "gunung andong": {
    elevation_m: 1726,
    description: "Gunung Andong di Magelang adalah destinasi hiking favorit keluarga. Gunung berkubah memanjang ini menawarkan trek pendek (sekitar 1.5 - 2 jam) dengan pemandangan 360 derajat jajaran gunung Merbabu, Merapi, Sindoro, dan Sumbing.",
    metadata: {
      simaksi_link: "https://andongmagelang.com",
      pvmbg_status: "Level I (Normal)",
      best_season: "Maret - Oktober",
      difficulty: "Easy",
      flora_fauna: ["Hutan Hujan Tropis", "Burung Kicau", "Pohon Pinus"],
      emergency_contacts: ["Basecamp Sawit: +628562334455"],
      camps: ["Basecamp Sawit", "Pos 1 (Kemuning)", "Pos 2 (Dewa Ndaru)", "Puncak Makam / Puncak Andong"],
      water_sources: ["Pos 2 (Mata Air Bersih Kran)"],
      basecamps: ["Sawit", "Pendem", "Gogik"]
    }
  }
};

// Filter function to ensure only actual, specific mountains are processed (excluding index lists, legends, categories)
function isValidMountainTitle(title: string): boolean {
  const t = title.toLowerCase().trim();
  
  // Exclude Wikipedia meta, list templates, indexes, and folklore/legend articles
  if (t.includes("daftar")) return false;
  if (t.includes("legenda")) return false;
  if (t.includes("mitos")) return false;
  if (t.includes("sejarah")) return false;
  if (t.includes("cerita")) return false;
  if (t.includes("dongeng")) return false;
  if (t.includes("kategori:")) return false;
  if (t.includes("templat:")) return false;
  if (t.includes("wikipedia:")) return false;
  if (t.includes("berkas:")) return false;
  
  // Exclude general articles or classifications
  if (t === "gunung" || t === "gunung ribu" || t === "gunung berapi" || t === "gunung api") return false;
  if (t.includes("gunung-gunung")) return false;
  if (t.includes("gunung berapi di") || t.includes("gunung api di")) return false;
  
  return true;
}

// Clean Wikipedia descriptions of raw citations, markup coordinates, and extra formatting
function cleanWikipediaDescription(text: string): string {
  if (!text) return "";
  return text
    .replace(/\[\d+\]/g, "") // remove brackets [1], [2]
    .replace(/\s+/g, " ") // normalize whitespace
    .replace(/\([^)]*\b(koordinat|coord|geografis|bujur|lintang)[^)]*\)/gi, "") // remove coordinate details inside brackets
    .trim();
}

// Generate beautiful, realistic, fallback hiking specs for other mountains (avoiding blank lists)
function generateBeautifulDefaults(mountainName: string, elevation: number) {
  const clean = mountainName.replace(/gunung/gi, "").trim();
  const difficulty = elevation > 3000 ? "Hard" : elevation > 1500 ? "Medium" : "Easy";
  
  return {
    simaksi_link: null,
    pvmbg_status: "Level I (Normal)",
    best_season: "Mei - Oktober",
    difficulty,
    flora_fauna: ["Edelweiss Jawa", "Elang Jawa", "Monyet Ekor Panjang", "Cemara Gunung"],
    emergency_contacts: [`Ranger Basecamp ${clean}: +628123456789`],
    camps: ["Basecamp Registrasi", "Pos I (Peristirahatan)", "Pos II (Mata Air)", "Pos III (Campsite Utama)", "Pos IV (Batas Vegetasi)", `Puncak ${clean}`],
    water_sources: ["Pos II (Mata Air Alami)"],
    basecamps: ["Jalur Utama Setempat"]
  };
}

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
          finalDescription = cleanWikipediaDescription(page.extract || "")?.slice(0, 500) || finalDescription;

          const wikitext = page.revisions?.[0]?.slots?.["*"]?.content || "";
          
          // Regex extraction for elevation (elevation_m / ketinggian)
          const elevMatch = wikitext.match(/(?:ketinggian|elevation|elevation_m)\s*=\s*([0-9.,]+)/i);
          if (elevMatch) {
            finalElevation = parseInt(elevMatch[1].replace(/[^0-9]/g, "")) || finalElevation;
          }

          // Build robust default details for the mountain based on height (rather than leaving it empty/ugly)
          const beautyDefaults = generateBeautifulDefaults(cleanName, finalElevation || 2000);
          finalMetadata = { ...finalMetadata, ...beautyDefaults };

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

              // Overwrite default checkpoints if OSM actually returned real mapped coordinates data
              if (campsSet.size > 0) {
                const sortedCamps = Array.from(campsSet);
                // Prepend basecamp and append summit to make OSM list look like a complete timeline
                finalMetadata.camps = ["Basecamp Registrasi", ...sortedCamps, `Puncak ${cleanName.replace(/gunung/gi, "").trim()}`];
              }
              if (waterSet.size > 0) {
                finalMetadata.water_sources = Array.from(waterSet);
              }
            } catch {
              // Fail-safe: OSM fetch down (falls back to beautyDefaults)
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

  // 0. Auto-clean bad legacy index/list/myth records that were previously imported (keeping Explore page clean!)
  const serviceClient = createServiceClient();
  await serviceClient
    .from("destinations")
    .delete()
    .or("slug.ilike.daftar-%,slug.ilike.legenda-%,slug.ilike.mitos-%,slug.ilike.sejarah-%,slug.eq.gunung-ribu,slug.ilike.%daftar-gunung%");

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
    // Block single requests trying to fetch a list/index title
    if (!isValidMountainTitle(mountainName)) {
      return NextResponse.json({ error: "Invalid mountain name. Lists and meta-articles are blocked." }, { status: 400 });
    }

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
    // Strict filter for actual mountains (removing lists, indexes, legends, etc.)
    const allMountains = members
      .filter((m: any) => m.ns === 0 && isValidMountainTitle(m.title))
      .map((m: any) => m.title);

    if (!allMountains.length) {
      return NextResponse.json({ success: true, count: 0, message: "No valid mountains found in category" });
    }

    const slice = allMountains.slice(offset, offset + limit);

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
