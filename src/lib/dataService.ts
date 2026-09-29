import { supabase } from './supabase';
import type { Group, Team, GroupTeam, Match, Announcement, Tournament } from './supabase';

// Helper to upload image file/base64 to Supabase Storage 'team-logos' bucket
export async function uploadTeamLogoToStorage(fileOrBase64: File | string): Promise<string> {
  try {
    let fileToUpload: File | Blob;
    let fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;

    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('data:image')) {
        const res = await fetch(fileOrBase64);
        fileToUpload = await res.blob();
      } else {
        return fileOrBase64; // Already a URL
      }
    } else {
      fileToUpload = fileOrBase64;
      fileName = `logo_${Date.now()}_${fileOrBase64.name}`;
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('team-logos')
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.warn('Storage upload notice (using fallback):', uploadError.message);
      return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
    }

    const { data: publicUrlData } = supabase.storage
      .from('team-logos')
      .getPublicUrl(uploadData.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload image to storage:', err);
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
  }
}

// Seed initial data if tables are empty
export async function seedInitialDataIfNeeded() {
  try {
    const { data: tournaments, error: tourneyErr } = await supabase.from('tournaments').select('*');
    if (tourneyErr) {
      console.warn("Table check notice:", tourneyErr.message);
      return false;
    }

    if (tournaments && tournaments.length > 0) {
      return true; // Already seeded
    }

    // Seed 1: Tournament
    const { data: newTourneys, error: tErr } = await supabase.from('tournaments').insert([
      { name: '이데일리컵 1회 women Tournament', start_date: '2026-10-01', end_date: '2026-10-15', status: 'ongoing' }
    ]).select();

    if (tErr || !newTourneys || newTourneys.length === 0) return false;
    const tourneyId = newTourneys[0].id;

    // Seed 2: Groups (1조 ~ 6조)
    const groupNames = ['1조', '2조', '3조', '4조', '5조', '6조'];
    const groupInserts = groupNames.map(name => ({ tournament_id: tourneyId, name }));
    const { data: createdGroups } = await supabase.from('groups').insert(groupInserts).select();

    if (!createdGroups || createdGroups.length === 0) return false;
    const group1 = createdGroups[0].id;

    // Seed 3: Teams
    const sampleTeams = [
      { name: 'TSA 우먼스 FC', logo_url: '' },
      { name: '이데일리 스타즈', logo_url: '' },
      { name: '퀸즈 위너스', logo_url: '' },
      { name: '블랙팬서 우먼스', logo_url: '' },
      { name: '골든이글스 W', logo_url: '' },
      { name: '파닉스 레이디스', logo_url: '' },
    ];

    const { data: createdTeams } = await supabase.from('teams').insert(sampleTeams).select();
    if (!createdTeams || createdTeams.length < 4) return false;

    // Assign Teams to 1조
    const group1Teams = createdTeams.slice(0, 4);
    const groupTeamInserts = group1Teams.map(t => ({ group_id: group1, team_id: t.id }));
    await supabase.from('group_teams').insert(groupTeamInserts);

    // Seed Matches with match_time
    const now = new Date();
    const matchTime1 = new Date(now.getTime() + 86400000).toISOString();
    const matchTime2 = new Date(now.getTime() + 172800000).toISOString();

    const sampleMatches = [
      {
        group_id: group1,
        home_team_id: group1Teams[0].id,
        away_team_id: group1Teams[1].id,
        match_time: matchTime1,
        field_location: '해누리체육공원 1구장',
        home_score: 2,
        away_score: 1,
        status: 'completed'
      },
      {
        group_id: group1,
        home_team_id: group1Teams[2].id,
        away_team_id: group1Teams[3].id,
        match_time: matchTime2,
        field_location: '해누리체육공원 2구장',
        home_score: 0,
        away_score: 0,
        status: 'scheduled'
      }
    ];
    await supabase.from('matches').insert(sampleMatches);

    // Recalculate Group Standings
    await recalculateGroupStandings(group1);

    // Seed Announcements (including home content types)
    const sampleAnnouncements = [
      {
        tournament_id: tourneyId,
        title: '🏆 [1회 women Tournament] 이데일리 컵 대회 개최 안내',
        content: '여성 스포츠 축제 "1회 women Tournament"가 해누리체육공원에서 성대하게 개최됩니다! 참가팀 확인 필수.',
        is_pinned: true
      },
      {
        tournament_id: tourneyId,
        title: '📢 대표자 회의 및 해누리체육공원 주차 안내',
        content: '대회당일 해누리체육공원 주차장이 혼잡할 수 있으니 대중교통 이용을 권장합니다.',
        is_pinned: false
      }
    ];
    await supabase.from('announcements').insert(sampleAnnouncements);

    return true;
  } catch (err) {
    console.error("Seeding error:", err);
    return false;
  }
}

// Tournament API (Instruction 2: Dynamic Sponsor Title Management)
export async function getTournaments() {
  const { data, error } = await supabase.from('tournaments').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Tournament[];
}

export async function updateTournamentTitle(tourneyId: string, titleName: string) {
  const { data, error } = await supabase
    .from('tournaments')
    .update({ name: titleName })
    .eq('id', tourneyId)
    .select();
  if (error) throw error;
  return data[0] as Tournament;
}

// Recalculate group standings based on matches
export async function recalculateGroupStandings(groupId: string) {
  try {
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'completed');

    const { data: groupTeams } = await supabase
      .from('group_teams')
      .select('*')
      .eq('group_id', groupId);

    if (!groupTeams) return;

    const teamStats: Record<string, {
      played: number; won: number; drawn: number; lost: number;
      goals_for: number; goals_against: number; goal_difference: number; points: number;
    }> = {};

    groupTeams.forEach(gt => {
      teamStats[gt.team_id] = {
        played: 0, won: 0, drawn: 0, lost: 0,
        goals_for: 0, goals_against: 0, goal_difference: 0, points: 0
      };
    });

    if (matches) {
      matches.forEach(m => {
        const homeId = m.home_team_id;
        const awayId = m.away_team_id;
        const homeScore = m.home_score || 0;
        const awayScore = m.away_score || 0;

        if (teamStats[homeId]) {
          teamStats[homeId].played += 1;
          teamStats[homeId].goals_for += homeScore;
          teamStats[homeId].goals_against += awayScore;

          if (homeScore > awayScore) {
            teamStats[homeId].won += 1;
            teamStats[homeId].points += 3;
          } else if (homeScore === awayScore) {
            teamStats[homeId].drawn += 1;
            teamStats[homeId].points += 1;
          } else {
            teamStats[homeId].lost += 1;
          }
        }

        if (teamStats[awayId]) {
          teamStats[awayId].played += 1;
          teamStats[awayId].goals_for += awayScore;
          teamStats[awayId].goals_against += homeScore;

          if (awayScore > homeScore) {
            teamStats[awayId].won += 1;
            teamStats[awayId].points += 3;
          } else if (awayScore === homeScore) {
            teamStats[awayId].drawn += 1;
            teamStats[awayId].points += 1;
          } else {
            teamStats[awayId].lost += 1;
          }
        }
      });
    }

    for (const gt of groupTeams) {
      const stats = teamStats[gt.team_id];
      if (stats) {
        const gd = stats.goals_for - stats.goals_against;
        await supabase
          .from('group_teams')
          .update({
            played: stats.played,
            won: stats.won,
            drawn: stats.drawn,
            lost: stats.lost,
            goals_for: stats.goals_for,
            goals_against: stats.goals_against,
            goal_difference: gd,
            points: stats.points
          })
          .eq('id', gt.id);
      }
    }
  } catch (err) {
    console.error("Failed to recalculate standings:", err);
  }
}

// Instruction 5: Manual Group Standings Forced Update
export async function updateGroupTeamStandingsManual(
  groupTeamId: string,
  stats: {
    won: number;
    drawn: number;
    lost: number;
    goal_difference: number;
    points: number;
    played?: number;
  }
) {
  const played = stats.played ?? (stats.won + stats.drawn + stats.lost);
  const { data, error } = await supabase
    .from('group_teams')
    .update({
      played,
      won: stats.won,
      drawn: stats.drawn,
      lost: stats.lost,
      goal_difference: stats.goal_difference,
      points: stats.points
    })
    .eq('id', groupTeamId)
    .select();

  if (error) throw error;
  return data[0] as GroupTeam;
}

// Announcements API
export async function getAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Announcement[];
}

export async function createAnnouncement(title: string, content: string, is_pinned: boolean = false) {
  const { data, error } = await supabase
    .from('announcements')
    .insert([{ title, content, is_pinned }])
    .select();
  if (error) throw error;
  return data[0] as Announcement;
}

export async function deleteAnnouncement(id: string) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}

// Format Group Name to 1조, 2조, etc.
export function formatGroupName(name?: string): string {
  if (!name) return '1조';
  if (name.endsWith('조')) return name;
  const num = parseInt(name, 10);
  if (!isNaN(num)) return `${num}조`;
  const charCode = name.toUpperCase().charCodeAt(0);
  if (charCode >= 65 && charCode <= 90) {
    return `${charCode - 64}조`;
  }
  return `${name}조`;
}

// Groups & Standings API
export async function getGroups() {
  const { data, error } = await supabase.from('groups').select('*').order('name');
  if (error) throw error;
  return data as Group[];
}

export async function createGroup(name: string, tournamentId?: string) {
  let tourneyId = tournamentId;
  if (!tourneyId) {
    const { data: tourneys } = await supabase.from('tournaments').select('*').limit(1);
    if (tourneys && tourneys.length > 0) {
      tourneyId = tourneys[0].id;
    }
  }

  const groupName = name.trim();
  const { data, error } = await supabase
    .from('groups')
    .insert([{ name: groupName, tournament_id: tourneyId }])
    .select();

  if (error) throw error;
  return data[0] as Group;
}

export async function deleteGroup(id: string) {
  const { error } = await supabase.from('groups').delete().eq('id', id);
  if (error) throw error;
}

export async function assignTeamToGroup(teamId: string, groupId: string) {
  const { data: existing } = await supabase
    .from('group_teams')
    .select('*')
    .eq('team_id', teamId);

  if (existing && existing.length > 0) {
    const { data, error } = await supabase
      .from('group_teams')
      .update({ group_id: groupId })
      .eq('id', existing[0].id)
      .select();

    if (error) throw error;
    return data[0] as GroupTeam;
  } else {
    const { data, error } = await supabase
      .from('group_teams')
      .insert([{
        team_id: teamId,
        group_id: groupId,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        goal_difference: 0,
        points: 0
      }])
      .select();

    if (error) throw error;
    return data[0] as GroupTeam;
  }
}

export async function getGroupStandings(groupId: string) {
  const { data, error } = await supabase
    .from('group_teams')
    .select('*, team:teams(*)')
    .eq('group_id', groupId)
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false })
    .order('goals_for', { ascending: false })
    .limit(8);
  if (error) throw error;
  return data as GroupTeam[];
}

// Instruction 6: Get Teams by Group ID (for Cascading Select in Match Creation)
export async function getTeamsByGroupId(groupId: string) {
  const { data, error } = await supabase
    .from('group_teams')
    .select('*, team:teams(*)')
    .eq('group_id', groupId);

  if (error) throw error;
  return (data || []).map(gt => gt.team).filter(Boolean) as Team[];
}

// Instruction 7: Matches API Strictly Ordered by match_time ASCENDING
export async function getMatches(groupId?: string) {
  let query = supabase
    .from('matches')
    .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), group:groups(*)')
    .order('match_time', { ascending: true }); // Instruction 7: Ascending by match_time

  if (groupId && groupId !== 'all') {
    query = query.eq('group_id', groupId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Match[];
}

export async function updateMatchScore(
  matchId: string, 
  homeScore: number, 
  awayScore: number, 
  status: 'scheduled' | 'live' | 'completed',
  groupId: string,
  matchTime?: string
) {
  const updatePayload: Record<string, any> = { home_score: homeScore, away_score: awayScore, status: status };
  if (matchTime) {
    updatePayload.match_time = matchTime;
  }
  const { data, error } = await supabase
    .from('matches')
    .update(updatePayload)
    .eq('id', matchId)
    .select();

  if (error) throw error;
  await recalculateGroupStandings(groupId);
  return data[0] as Match;
}

export async function createMatch(matchData: {
  group_id: string;
  home_team_id: string;
  away_team_id: string;
  match_time: string;
  field_location: string;
}) {
  const { data, error } = await supabase
    .from('matches')
    .insert([{ ...matchData, home_score: 0, away_score: 0, status: 'scheduled' }])
    .select();
  if (error) throw error;
  return data[0] as Match;
}

// Instruction 6: Teams API with Mandatory Group Assignment (INSERT teams & INSERT group_teams)
export async function getTeams() {
  const { data, error } = await supabase.from('teams').select('*').order('name');
  if (error) throw error;
  return data as Team[];
}

export async function createTeam(name: string, logoFileOrBase64?: File | string, groupId?: string) {
  let logo_url = '';
  if (logoFileOrBase64) {
    logo_url = await uploadTeamLogoToStorage(logoFileOrBase64);
  }

  const { data, error } = await supabase.from('teams').insert([{ name, logo_url }]).select();
  if (error) throw error;
  const createdTeam = data[0] as Team;

  // Instruction 6: Insert into group_teams with selected group_id
  if (groupId) {
    await supabase.from('group_teams').insert([
      { group_id: groupId, team_id: createdTeam.id }
    ]);
  } else {
    // Default assign to first group if none specified
    const { data: groups } = await supabase.from('groups').select('*').order('name').limit(1);
    if (groups && groups.length > 0) {
      await supabase.from('group_teams').insert([
        { group_id: groups[0].id, team_id: createdTeam.id }
      ]);
    }
  }

  return createdTeam;
}

export async function deleteTeam(id: string) {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}

// Fetch team matches directly from matches table
export async function getTeamMatches(teamId: string) {
  const { data: home } = await supabase
    .from('matches')
    .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
    .eq('home_team_id', teamId)
    .order('match_time', { ascending: true });
    
  const { data: away } = await supabase
    .from('matches')
    .select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*)')
    .eq('away_team_id', teamId)
    .order('match_time', { ascending: true });

  const all = [...(home || []), ...(away || [])];
  all.sort((a, b) => new Date(a.match_time || 0).getTime() - new Date(b.match_time || 0).getTime());
  return all as Match[];
}

export async function getTeamDetailedStats(teamId: string) {
  const { data: homeMatches } = await supabase.from('matches').select('*').eq('home_team_id', teamId).eq('status', 'completed');
  const { data: awayMatches } = await supabase.from('matches').select('*').eq('away_team_id', teamId).eq('status', 'completed');

  const matches = [...(homeMatches || []), ...(awayMatches || [])];
  
  let played = matches.length;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  matches.forEach(m => {
    const isHome = m.home_team_id === teamId;
    const myScore = isHome ? m.home_score : m.away_score;
    const oppScore = isHome ? m.away_score : m.home_score;

    goalsFor += myScore;
    goalsAgainst += oppScore;

    if (myScore > oppScore) won++;
    else if (myScore === oppScore) drawn++;
    else lost++;
  });

  return {
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDiff: goalsFor - goalsAgainst,
    points: won * 3 + drawn,
    winRate: played > 0 ? Math.round((won / played) * 100) : 0
  };
}

// Profiles API (Instruction 3: Insert user metadata upon signup)
export async function createProfile(email: string, teamName?: string, role: 'user' | 'admin' = 'user') {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ email, team_name: teamName, role }])
      .select();
    if (error) {
      console.warn('Profile table insert notice:', error.message);
    }
    return data ? (data[0] as Profile) : null;
  } catch (err) {
    console.warn('Profile table insert fallback:', err);
    return null;
  }
}

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return null;
    return data[0] as Profile;
  } catch (err) {
    console.warn('Failed to fetch profile by email:', err);
    return null;
  }
}

// Posts / CMS API (Instruction 5: Admin CMS Posts Management)
export async function getPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Posts table query notice:', error.message);
      return [] as Post[];
    }
    return data as Post[];
  } catch (err) {
    console.warn('Posts table query fallback:', err);
    return [] as Post[];
  }
}

export async function createPost(postData: {
  category: '공지사항' | '향후 대회 일정' | '스폰서/파트너십';
  title: string;
  content: string;
  author?: string;
  is_pinned?: boolean;
}) {
  const { data, error } = await supabase
    .from('posts')
    .insert([postData])
    .select();
  if (error) throw error;
  return data[0] as Post;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw error;
}
