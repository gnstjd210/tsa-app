import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Announcement, Team, Match, Group, GroupTeam, Tournament, Post } from '../lib/supabase';
import {
  getAnnouncements,
  getTeams,
  getMatches,
  getGroups,
  getGroupStandings,
  getTournaments,
  updateTournamentTitle,
  createAnnouncement,
  updateAnnouncement,
  createTeam,
  createMatch,
  updateMatchScore,
  updateGroupTeamStandingsManual,
  deleteAnnouncement,
  deleteTeam,
  createGroup,
  deleteGroup,
  assignTeamToGroup,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  seedInitialDataIfNeeded
} from '../lib/dataService';

interface SupabaseContextType {
  announcements: Announcement[];
  teams: Team[];
  matches: Match[];
  groups: Group[];
  tournament: Tournament | null;
  sponsorTitle: string;
  loading: boolean;
  refreshing: boolean;
  refreshAllData: () => Promise<void>;
  updateSponsorTitle: (newTitle: string) => Promise<void>;
  addAnnouncement: (title: string, content: string, isPinned?: boolean) => Promise<void>;
  editAnnouncement: (id: string, title: string, content: string, isPinned?: boolean) => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;
  addTeam: (name: string, logoFileOrBase64?: File | string, groupId?: string) => Promise<Team>;
  removeTeam: (id: string) => Promise<void>;
  addGroup: (name: string) => Promise<Group>;
  removeGroup: (id: string) => Promise<void>;
  mapTeamToGroup: (teamId: string, groupId: string) => Promise<void>;
  addMatch: (matchData: {
    group_id: string;
    home_team_id: string;
    away_team_id: string;
    match_time: string;
    field_location: string;
  }) => Promise<void>;
  editMatchScore: (
    matchId: string,
    homeScore: number,
    awayScore: number,
    status: 'scheduled' | 'live' | 'completed',
    groupId: string,
    matchTime?: string
  ) => Promise<void>;
  manualEditStandings: (
    groupTeamId: string,
    stats: {
      won: number;
      drawn: number;
      lost: number;
      goal_difference: number;
      points: number;
      played?: number;
    }
  ) => Promise<void>;
  posts: Post[];
  addPost: (postData: {
    category: '공지사항' | '향후 대회 일정' | '스폰서/파트너십';
    title: string;
    content: string;
    author?: string;
    link?: string;
    is_pinned?: boolean;
  }) => Promise<void>;
  editPost: (
    id: string,
    postData: {
      category?: '공지사항' | '향후 대회 일정' | '스폰서/파트너십';
      title?: string;
      content?: string;
      author?: string;
      link?: string;
      is_pinned?: boolean;
    }
  ) => Promise<void>;
  removePost: (id: string) => Promise<void>;
  fetchGroupStandings: (groupId: string) => Promise<GroupTeam[]>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [sponsorTitle, setSponsorTitle] = useState<string>('이데일리컵');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refreshAllData = async () => {
    try {
      setRefreshing(true);
      await seedInitialDataIfNeeded();

      const [annData, teamData, matchData, groupData, tourneyData, postData] = await Promise.all([
        getAnnouncements(),
        getTeams(),
        getMatches(),
        getGroups(),
        getTournaments(),
        getPosts()
      ]);

      setAnnouncements(annData);
      setTeams(teamData);
      setMatches(matchData);
      setGroups(groupData);
      setPosts(postData);
      
      if (tourneyData && tourneyData.length > 0) {
        setTournament(tourneyData[0]);
        setSponsorTitle(tourneyData[0].name || '이데일리컵');
      }
    } catch (err) {
      console.error('Error fetching global Supabase data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Supabase Realtime Subscriptions
    const announcementsSub = supabase
      .channel('public:announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        getAnnouncements().then(setAnnouncements).catch(console.error);
      })
      .subscribe();

    const matchesSub = supabase
      .channel('public:matches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        getMatches().then(setMatches).catch(console.error);
      })
      .subscribe();

    const teamsSub = supabase
      .channel('public:teams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        getTeams().then(setTeams).catch(console.error);
      })
      .subscribe();

    const tourneysSub = supabase
      .channel('public:tournaments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => {
        getTournaments().then(tList => {
          if (tList && tList.length > 0) {
            setTournament(tList[0]);
            setSponsorTitle(tList[0].name || '이데일리컵');
          }
        }).catch(console.error);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsSub);
      supabase.removeChannel(matchesSub);
      supabase.removeChannel(teamsSub);
      supabase.removeChannel(tourneysSub);
    };
  }, []);

  // Instruction 2: Update Dynamic Sponsor Title in Supabase
  const updateSponsorTitle = async (newTitle: string) => {
    setSponsorTitle(newTitle);
    if (tournament) {
      await updateTournamentTitle(tournament.id, newTitle);
    }
    await refreshAllData();
  };

  const addAnnouncement = async (title: string, content: string, isPinned: boolean = false) => {
    await createAnnouncement(title, content, isPinned);
    await refreshAllData();
  };

  const editAnnouncement = async (id: string, title: string, content: string, isPinned: boolean = false) => {
    await updateAnnouncement(id, title, content, isPinned);
    await refreshAllData();
  };

  const removeAnnouncement = async (id: string) => {
    await deleteAnnouncement(id);
    await refreshAllData();
  };

  // Instruction 6: Add team with selected group assignment
  const addTeam = async (name: string, logoFileOrBase64?: File | string, groupId?: string) => {
    const newTeam = await createTeam(name, logoFileOrBase64, groupId);
    await refreshAllData();
    return newTeam;
  };

  const removeTeam = async (id: string) => {
    await deleteTeam(id);
    await refreshAllData();
  };

  const addGroup = async (name: string) => {
    const newGrp = await createGroup(name, tournament?.id);
    await refreshAllData();
    return newGrp;
  };

  const removeGroup = async (id: string) => {
    await deleteGroup(id);
    await refreshAllData();
  };

  const mapTeamToGroup = async (teamId: string, groupId: string) => {
    await assignTeamToGroup(teamId, groupId);
    await refreshAllData();
  };

  const addMatch = async (matchData: {
    group_id: string;
    home_team_id: string;
    away_team_id: string;
    match_time: string;
    field_location: string;
  }) => {
    await createMatch(matchData);
    await refreshAllData();
  };

  const editMatchScore = async (
    matchId: string,
    homeScore: number,
    awayScore: number,
    status: 'scheduled' | 'live' | 'completed',
    groupId: string,
    matchTime?: string
  ) => {
    await updateMatchScore(matchId, homeScore, awayScore, status, groupId, matchTime);
    await refreshAllData();
  };

  // Instruction 5: Manual Group Standings Forced Update
  const manualEditStandings = async (
    groupTeamId: string,
    stats: {
      won: number;
      drawn: number;
      lost: number;
      goal_difference: number;
      points: number;
      played?: number;
    }
  ) => {
    await updateGroupTeamStandingsManual(groupTeamId, stats);
    await refreshAllData();
  };

  const addPost = async (postData: {
    category: '공지사항' | '향후 대회 일정' | '스폰서/파트너십';
    title: string;
    content: string;
    author?: string;
    link?: string;
    is_pinned?: boolean;
  }) => {
    await createPost(postData);
    await refreshAllData();
  };

  const editPost = async (
    id: string,
    postData: {
      category?: '공지사항' | '향후 대회 일정' | '스폰서/파트너십';
      title?: string;
      content?: string;
      author?: string;
      link?: string;
      is_pinned?: boolean;
    }
  ) => {
    await updatePost(id, postData);
    await refreshAllData();
  };

  const removePost = async (id: string) => {
    await deletePost(id);
    await refreshAllData();
  };

  const fetchGroupStandings = async (groupId: string) => {
    return await getGroupStandings(groupId);
  };

  return (
    <SupabaseContext.Provider
      value={{
        announcements,
        teams,
        matches,
        groups,
        posts,
        tournament,
        sponsorTitle,
        loading,
        refreshing,
        refreshAllData,
        updateSponsorTitle,
        addAnnouncement,
        editAnnouncement,
        removeAnnouncement,
        addTeam,
        removeTeam,
        addGroup,
        removeGroup,
        mapTeamToGroup,
        addMatch,
        editMatchScore,
        manualEditStandings,
        addPost,
        editPost,
        removePost,
        fetchGroupStandings
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabaseData = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabaseData must be used within a SupabaseProvider');
  }
  return context;
};
