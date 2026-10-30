export type Mission = {
  id: string;
  title: string;
  prompt: string;
  place: string | null;
  visit_date: string | null;
  target_lat: number | null;
  target_lng: number | null;
  target: { lat: number; lng: number } | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  observationCount: number;
};

export type MissionPayload = { title: string; prompt: string; place: string | null; visitDate: string | null; target: { lat: number; lng: number } | null };
