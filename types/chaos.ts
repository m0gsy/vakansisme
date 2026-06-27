export type ChaosCard = {
  id: string;
  author_handle: string;
  type: string;
  caption: string;
  image_url: string | null;
  rotation: number;
  accent_color: string;
};

export const CHAOS_TYPES = ["failed shot", "absurd quote", "shaky video", "inside joke", "chaos moment"] as const;
