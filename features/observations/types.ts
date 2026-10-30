export type ResponseKind = "supports" | "contradicts" | "inconclusive" | "not-observable";
export type LocationEvidence = { lat: number; lng: number; accuracy: number; capturedAt: string };
export type Observation = {
  id: string;
  mission_id: string;
  answer: ResponseKind;
  note: string;
  captured_at: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  photo_path: string | null;
  photo_url: string | null;
  verification_state: "awaiting_review";
  mission?: { title: string; prompt: string; place: string | null };
};

export type ObservationPage = { data: Observation[]; count: number; limit: number; offset: number };
