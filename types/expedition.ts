export type Trip = {
  id: string;
  name: string;
  location: string;
  difficulty: string;
  description: string | null;
  price: string;
  date_start: string;
  date_end: string;
  leader_handle: string;
  quota_max: number;
  image_url: string;
  member_count: number;
};
