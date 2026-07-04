export type Story = {
  id: string;
  slug: string;
  author_handle: string;
  type: string;
  title: string;
  excerpt: string | null;
  image_url: string | null;
  created_at: string;
};
