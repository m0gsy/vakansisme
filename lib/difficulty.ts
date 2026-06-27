export const DIFFICULTIES = [
  { value: "Very Chill", label: "🌱 Very Chill", level: 1, desc: "Super relaxed. For beginners or light activity with no real challenge." },
  { value: "Chill", label: "🍃 Chill", level: 2, desc: "Still easy, but a little challenge starts to creep in." },
  { value: "Easy Going", label: "🌄 Easy Going", level: 3, desc: "Easy trek with mild inclines and a longer duration." },
  { value: "Moderate", label: "🥾 Moderate", level: 4, desc: "Needs decent stamina. For those who've hiked a few times." },
  { value: "Pretty Chaotic", label: "⛰️ Pretty Chaotic", level: 5, desc: "Trail gets tough — long climbs, varied terrain, draining." },
  { value: "Hardcore", label: "🔥 Hardcore", level: 6, desc: "Hard terrain with high physical demand and long duration." },
  { value: "Full Chaos", label: "💀 Full Chaos", level: 7, desc: "Top tier. Extreme technical terrain, unpredictable weather, experience required." },
] as const;

export type Difficulty = (typeof DIFFICULTIES)[number]["value"];

export function getDifficulty(value: string) {
  return DIFFICULTIES.find((d) => d.value === value) ?? null;
}

export function difficultyLabel(value: string) {
  return getDifficulty(value)?.label ?? value;
}
