import React, { useEffect, useState } from 'react';
import { CalendarDays, Edit3, Plus, Sparkles, Loader2, MapPin, Clock, Shield, Trash2 } from 'lucide-react';
import type { Match, Team } from '../../lib/supabase';
import { useSupabaseData } from '../../context/SupabaseContext';
import { getTeamsByGroupId, formatGroupName } from '../../lib/dataService';

// Helper to format Date instance into HTML5 datetime-local string (YYYY-MM-DDTHH:mm)
export function toDatetimeLocalString(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface MatchScheduleTabProps {
  isAdmin?: boolean;
}

export const MatchScheduleTab: React.FC<MatchScheduleTabProps> = ({ isAdmin = false }) => {
  const { matches, groups, teams: allTeams, loading, addMatch, editMatchScore } = useSupabaseData();
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  
  // Team Highlight State
  const [highlightedTeamId, setHighlightedTeamId] = useState<string | null>(null);

  // Field Locations List State
  const [locations, setLocations] = useState<string[]>([
    '해누리체육공원 1구장',
    '해누리체육공원 2구장',
    'TSA 메인 에어돔구장',
    '양천 B구장'
  ]);
  const [selectedLocation, setSelectedLocation] = useState<string>('해누리체육공원 1구장');
  const [customLocationInput, setCustomLocationInput] = useState<string>('');
  const [showAddLocation, setShowAddLocation] = useState<boolean>(false);

  // Score & Status Modal State
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [homeScoreSelect, setHomeScoreSelect] = useState<number>(0);
  const [awayScoreSelect, setAwayScoreSelect] = useState<number>(0);
  const [statusSelect, setStatusSelect] = useState<'scheduled' | 'live' | 'completed'>('scheduled');
  const [editMatchTimeInput, setEditMatchTimeInput] = useState<string>('');
  const [submittingScore, setSubmittingScore] = useState(false);

  // New Match Modal State with Cascading Select & Dynamic Datetime Initializer
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [newGroupId, setNewGroupId] = useState('');
  const [cascadedGroupTeams, setCascadedGroupTeams] = useState<Team[]>([]);
  const [newHomeTeamId, setNewHomeTeamId] = useState('');
  const [newAwayTeamId, setNewAwayTeamId] = useState('');
  const [loadingGroupTeams, setLoadingGroupTeams] = useState(false);
  
  // Dynamic Datetime Local Input State (Automatically initialized with today & current time via new Date())
  const [matchTimeInput, setMatchTimeInput] = useState<string>(() => toDatetimeLocalString(new Date()));
  const [creatingMatch, setCreatingMatch] = useState(false);

  // Instruction 6: Cascading Select Logic - Load teams belonging strictly to selected newGroupId
  useEffect(() => {
    if (!newGroupId) return;

    const loadCascadingTeams = async () => {
      try {
        setLoadingGroupTeams(true);
        const filteredTeams = await getTeamsByGroupId(newGroupId);
        setCascadedGroupTeams(filteredTeams);

        if (filteredTeams.length >= 2) {
          setNewHomeTeamId(filteredTeams[0].id);
          setNewAwayTeamId(filteredTeams[1].id);
        } else if (filteredTeams.length === 1) {
          setNewHomeTeamId(filteredTeams[0].id);
          setNewAwayTeamId('');
        } else {
          setNewHomeTeamId('');
          setNewAwayTeamId('');
        }
      } catch (err) {
        console.error('Error fetching group teams for cascading select:', err);
      } finally {
        setLoadingGroupTeams(false);
      }
    };

    loadCascadingTeams();
  }, [newGroupId]);

  const openScoreModal = (match: Match) => {
    setEditingMatch(match);
    setHomeScoreSelect(match.home_score);
    setAwayScoreSelect(match.away_score);
    setStatusSelect(match.status);
    setEditMatchTimeInput(match.match_time ? toDatetimeLocalString(new Date(match.match_time)) : toDatetimeLocalString(new Date()));
  };

  const handleScoreUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    try {
      setSubmittingScore(true);
      const updatedMatchTimeIso = editMatchTimeInput ? new Date(editMatchTimeInput).toISOString() : editingMatch.match_time;
      await editMatchScore(
        editingMatch.id,
        homeScoreSelect,
        awayScoreSelect,
        statusSelect,
        editingMatch.group_id,
        updatedMatchTimeIso
      );
      setEditingMatch(null);
    } catch (err) {
      console.error('Error updating score:', err);
      alert('점수 입력에 실패했습니다.');
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleAddLocation = () => {
    if (!customLocationInput.trim()) return;
    const newLoc = customLocationInput.trim();
    if (!locations.includes(newLoc)) {
      setLocations([...locations, newLoc]);
    }
    setSelectedLocation(newLoc);
    setCustomLocationInput('');
    setShowAddLocation(false);
  };

  const handleDeleteLocation = (locToDelete: string) => {
    if (locations.length <= 1) {
      alert('최소 1개 이상의 구장이 존재해야 합니다.');
      return;
    }
    const updated = locations.filter(l => l !== locToDelete);
    setLocations(updated);
    if (selectedLocation === locToDelete) {
      setSelectedLocation(updated[0]);
    }
  };

  const handleOpenMatchModal = () => {
    if (groups.length > 0 && !newGroupId) {
      setNewGroupId(groups[0].id);
    }
    // Instruction 1: Dynamically initialize match_time with current date & time (new Date())
    setMatchTimeInput(toDatetimeLocalString(new Date()));
    setShowMatchModal(true);
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupId || !newHomeTeamId || !newAwayTeamId) {
      alert('조와 참가 팀을 모두 선택하세요.');
      return;
    }
    if (newHomeTeamId === newAwayTeamId) {
      alert('홈팀과 어웨이팀은 서로 달라야 합니다.');
      return;
    }

    const dateObj = matchTimeInput ? new Date(matchTimeInput) : new Date();
    const matchTimeIso = dateObj.toISOString();

    try {
      setCreatingMatch(true);
      await addMatch({
        group_id: newGroupId,
        home_team_id: newHomeTeamId,
        away_team_id: newAwayTeamId,
        match_time: matchTimeIso,
        field_location: selectedLocation
      });
      setShowMatchModal(false);
      alert('신규 매치가 등록되었습니다!');
    } catch (err) {
      console.error('Error creating match:', err);
    } finally {
      setCreatingMatch(false);
    }
  };

  // Instruction 7: Match Time Ascending Sort (Earliest First)
  const filteredMatches = matches
    .filter(m => {
      if (selectedGroupFilter === 'all') return true;
      return m.group_id === selectedGroupFilter;
    })
    .sort((a, b) => new Date(a.match_time || 0).getTime() - new Date(b.match_time || 0).getTime());

  const scoreOptions = Array.from({ length: 21 }, (_, i) => i);

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="w-full glass-panel rounded-2xl p-5 border-l-4 border-l-blue-500 relative overflow-hidden flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>시간순(ASC) 대진표 & 실시간 연동</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
            경기 일정 (Match Schedule)
          </h2>
          <p className="text-xs text-slate-400 mt-1">팀명을 클릭하면 해당 팀 글자색이 브랜드 오렌지 컬러로 강조됩니다.</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenMatchModal}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 active-press transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>신규 매치 등록</span>
          </button>
        )}
      </div>

      {/* Team Highlight Indicator */}
      {highlightedTeamId && (
        <div className="w-full p-3 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-between text-xs text-orange-300 animate-fadeIn shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <span className="font-extrabold text-orange-400">
              "{allTeams.find(t => t.id === highlightedTeamId)?.name}"
            </span>
            <span>팀 경기 글자색 및 대진 강조 중</span>
          </div>
          <button
            onClick={() => setHighlightedTeamId(null)}
            className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] active-press transition-all"
          >
            강조 해제
          </button>
        </div>
      )}

      {/* Group Filters */}
      <div className="w-full flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedGroupFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedGroupFilter === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          전체 경기
        </button>
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => setSelectedGroupFilter(group.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedGroupFilter === group.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {formatGroupName(group.name)}
          </button>
        ))}
      </div>

      {/* Matches List (Instruction 7: Sorted by match_time Ascending) */}
      {loading ? (
        <div className="w-full py-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <span className="text-xs">Supabase에서 경기 일정을 불러오는 중...</span>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="w-full glass-panel rounded-2xl p-8 text-center border border-slate-800">
          <CalendarDays className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">등록된 경기 일정이 없습니다.</p>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {filteredMatches.map((match) => {
            const isCompleted = match.status === 'completed';
            const isLive = match.status === 'live';

            const isHomeHighlighted = highlightedTeamId === match.home_team_id;
            const isAwayHighlighted = highlightedTeamId === match.away_team_id;
            const isMatchHighlighted = isHomeHighlighted || isAwayHighlighted;

            return (
              <div
                key={match.id}
                className={`w-full glass-panel rounded-2xl p-4 border transition-all relative group shadow-md ${
                  isMatchHighlighted
                    ? 'border-orange-500 ring-2 ring-orange-500/50 bg-gradient-to-r from-orange-500/20 via-slate-900 to-slate-900 scale-[1.01]'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Info Header */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2.5 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-bold text-slate-300">
                      {match.group?.name || '조별리그'}
                    </span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{match.field_location || '해누리체육공원 1구장'}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {isLive ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        LIVE
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        경기 종료
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                        진행 예정
                      </span>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => openScoreModal(match)}
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                        title="점수/상태 수정"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scoreboard Teams Display */}
                <div className="grid grid-cols-7 items-center gap-2 py-1">
                  {/* Home Team */}
                  <div
                    onClick={() => setHighlightedTeamId(match.home_team_id)}
                    className="col-span-3 flex flex-col items-center text-center cursor-pointer group/home"
                  >
                    {match.home_team?.logo_url ? (
                      <img
                        src={match.home_team.logo_url}
                        alt={match.home_team.name}
                        className={`w-10 h-10 rounded-full object-cover border mb-1 transition-transform ${
                          isHomeHighlighted
                            ? 'border-orange-500 ring-4 ring-orange-500/40 scale-110'
                            : 'border-slate-700 group-hover/home:scale-105'
                        }`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-1 ${
                        isHomeHighlighted
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400 ring-4 ring-orange-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                    )}

                    <span
                      className={`font-bold text-xs truncate w-full transition-all ${
                        isHomeHighlighted
                          ? 'text-orange-400 font-black text-sm drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                          : 'text-slate-100 group-hover/home:text-orange-400'
                      }`}
                    >
                      {match.home_team?.name || '홈 팀'}
                    </span>
                  </div>

                  {/* Score Center */}
                  <div className="col-span-1 flex flex-col items-center justify-center text-center">
                    {isCompleted || isLive ? (
                      <div className="flex items-center space-x-1 font-sports text-2xl font-bold">
                        <span className={match.home_score > match.away_score ? 'text-orange-400' : 'text-slate-300'}>
                          {match.home_score}
                        </span>
                        <span className="text-slate-600 text-sm">:</span>
                        <span className={match.away_score > match.home_score ? 'text-orange-400' : 'text-slate-300'}>
                          {match.away_score}
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 font-sports font-bold text-base">
                        VS
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div
                    onClick={() => setHighlightedTeamId(match.away_team_id)}
                    className="col-span-3 flex flex-col items-center text-center cursor-pointer group/away"
                  >
                    {match.away_team?.logo_url ? (
                      <img
                        src={match.away_team.logo_url}
                        alt={match.away_team.name}
                        className={`w-10 h-10 rounded-full object-cover border mb-1 transition-transform ${
                          isAwayHighlighted
                            ? 'border-orange-500 ring-4 ring-orange-500/40 scale-110'
                            : 'border-slate-700 group-hover/away:scale-105'
                        }`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-1 ${
                        isAwayHighlighted
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400 ring-4 ring-orange-500/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                    )}

                    <span
                      className={`font-bold text-xs truncate w-full transition-all ${
                        isAwayHighlighted
                          ? 'text-orange-400 font-black text-sm drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                          : 'text-slate-100 group-hover/away:text-orange-400'
                      }`}
                    >
                      {match.away_team?.name || '어웨이 팀'}
                    </span>
                  </div>
                </div>

                {/* Instruction 7: Match Time Ascending Order Footer Display */}
                {match.match_time && (
                  <div className="mt-2 text-center text-[10px] text-slate-500 flex items-center justify-center space-x-1">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span className="font-semibold text-slate-300">
                      {new Date(match.match_time).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Score & Status Modal */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-500" />
                <span>스코어 & 경기상태 Supabase UPDATE</span>
              </h3>
              <button onClick={() => setEditingMatch(null)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleScoreUpdate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 items-center text-center">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-200 block truncate mb-1.5">
                    {editingMatch.home_team?.name}
                  </span>
                  <select
                    value={homeScoreSelect}
                    onChange={(e) => setHomeScoreSelect(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-center text-xl font-bold text-orange-400 focus:outline-none cursor-pointer"
                  >
                    {scoreOptions.map((s) => (
                      <option key={s} value={s}>
                        {s} 점
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="font-bold text-slate-200 block truncate mb-1.5">
                    {editingMatch.away_team?.name}
                  </span>
                  <select
                    value={awayScoreSelect}
                    onChange={(e) => setAwayScoreSelect(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-center text-xl font-bold text-orange-400 focus:outline-none cursor-pointer"
                  >
                    {scoreOptions.map((s) => (
                      <option key={s} value={s}>
                        {s} 점
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">경기 일시 수정</label>
                <input
                  type="datetime-local"
                  required
                  value={editMatchTimeInput}
                  onChange={(e) => setEditMatchTimeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">경기 진행 상태 선택</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatusSelect('scheduled')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      statusSelect === 'scheduled'
                        ? 'bg-slate-700 text-white border-slate-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    진행 예정
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusSelect('live')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      statusSelect === 'live'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md animate-pulse'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    LIVE 경기중
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusSelect('completed')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                      statusSelect === 'completed'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    경기 종료
                  </button>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMatch(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingScore}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center"
                >
                  {submittingScore ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>DB UPDATE</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instruction 6: Cascading Select Match Registration Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                <span>새 매치 등록 (연쇄 선택 Cascading Select)</span>
              </h3>
              <button onClick={() => setShowMatchModal(false)} className="text-slate-400 hover:text-white text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-3.5 text-xs">
              {/* Step 1: Select Group */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Step 1. 소속 조 선택 (조 선택 후 해당 조 팀들만 필터링)
                </label>
                <select
                  value={newGroupId}
                  onChange={(e) => setNewGroupId(e.target.value)}
                  className="w-full bg-slate-950 border border-blue-500/50 rounded-xl p-2.5 text-white font-bold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {formatGroupName(g.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instruction 6: Step 2. Home & Away Team Select (Filtered strictly by selected newGroupId) */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Step 2. 홈 팀 ({cascadedGroupTeams.length}팀)
                  </label>
                  {loadingGroupTeams ? (
                    <div className="p-2 text-center text-slate-400">팀 불러오는 중...</div>
                  ) : cascadedGroupTeams.length === 0 ? (
                    <div className="p-2 bg-slate-900 text-rose-400 rounded-xl">이 조에 팀이 없습니다.</div>
                  ) : (
                    <select
                      value={newHomeTeamId}
                      onChange={(e) => setNewHomeTeamId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-medium"
                    >
                      {cascadedGroupTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Step 2. 어웨이 팀 ({cascadedGroupTeams.length}팀)
                  </label>
                  {loadingGroupTeams ? (
                    <div className="p-2 text-center text-slate-400">팀 불러오는 중...</div>
                  ) : cascadedGroupTeams.length === 0 ? (
                    <div className="p-2 bg-slate-900 text-rose-400 rounded-xl">이 조에 팀이 없습니다.</div>
                  ) : (
                    <select
                      value={newAwayTeamId}
                      onChange={(e) => setNewAwayTeamId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-medium"
                    >
                      {cascadedGroupTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Dynamic Date & Time Input (datetime-local with new Date() default) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  경기 일시 (현재 날짜 & 시간 자동 동적 세팅)
                </label>
                <input
                  type="datetime-local"
                  required
                  value={matchTimeInput}
                  onChange={(e) => setMatchTimeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">구장 장소 (기본: 해누리체육공원)</label>
                  <button
                    type="button"
                    onClick={() => setShowAddLocation(!showAddLocation)}
                    className="text-[11px] text-blue-400 font-bold hover:underline"
                  >
                    {showAddLocation ? '취소' : '+ 새 구장 추가'}
                  </button>
                </div>

                {showAddLocation ? (
                  <div className="flex space-x-1.5 mb-2">
                    <input
                      type="text"
                      placeholder="신규 구장 이름 입력..."
                      value={customLocationInput}
                      onChange={(e) => setCustomLocationInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddLocation}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-xs"
                    >
                      추가
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                    >
                      {locations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteLocation(selectedLocation)}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400"
                      title="선택된 구장 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowMatchModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={creatingMatch || cascadedGroupTeams.length < 2}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center"
                >
                  {creatingMatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>매치 생성</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
