import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lyxszzinnjoslgtlurca.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_hkKaBL91rq-xDoibLYrU6w_Vg1J7_e4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Tournament {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  created_at?: string;
}

export interface Group {
  id: string;
  tournament_id: string;
  name: string;
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  logo_url?: string;
  created_at?: string;
}

export interface GroupTeam {
  id: string;
  group_id: string;
  team_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  // Joined table properties
  team?: Team;
  group?: Group;
}

export interface Match {
  id: string;
  group_id: string;
  home_team_id: string;
  away_team_id: string;
  match_time?: string;
  field_location?: string;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'live' | 'completed';
  created_at?: string;
  // Joined table properties
  home_team?: Team;
  away_team?: Team;
  group?: Group;
}

export interface Announcement {
  id: string;
  tournament_id?: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at?: string;
}
