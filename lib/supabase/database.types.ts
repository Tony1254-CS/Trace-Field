export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      missions: {
        Row: { id: string; user_id: string; title: string; prompt: string; place: string | null; visit_date: string | null; target_lat: number | null; target_lng: number | null; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; user_id: string; title: string; prompt: string; place?: string | null; visit_date?: string | null; target_lat?: number | null; target_lng?: number | null; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["missions"]["Insert"]>;
        Relationships: [];
      };
      observations: {
        Row: { id: string; user_id: string; mission_id: string; answer: "supports" | "contradicts" | "inconclusive" | "not-observable"; note: string; captured_at: string; latitude: number | null; longitude: number | null; accuracy: number | null; photo_path: string | null; verification_state: "awaiting_review"; created_at: string };
        Insert: { id?: string; user_id: string; mission_id: string; answer: "supports" | "contradicts" | "inconclusive" | "not-observable"; note?: string; captured_at: string; latitude?: number | null; longitude?: number | null; accuracy?: number | null; photo_path?: string | null; verification_state?: "awaiting_review"; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["observations"]["Insert"]>;
        Relationships: [
          { foreignKeyName: "observations_mission_id_fkey"; columns: ["mission_id"]; isOneToOne: false; referencedRelation: "missions"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: { restore_trace_records: { Args: { p_missions: Json; p_observations: Json }; Returns: Json } };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
