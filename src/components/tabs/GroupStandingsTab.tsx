import React, { useEffect, useState } from 'react';
import { Award, RefreshCw, Sparkles, Loader2, Trophy, Shield, GitFork, X, Calendar, Edit, Save } from 'lucide-react';
import type { GroupTeam, Match } from '../../lib/supabase';
import { useSupabaseData } from '../../context/SupabaseContext';
import { getTeamMatches, getTeamDetailedStats, formatGroupName } from '../../lib/dataService';

export const GroupStandingsTab: React.FC = () => {
  const { groups, fetchGroupStandings, refreshAllData, manualEditStandings, loading } = useSupabaseData();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [standings, setStandings] = useState<GroupTeam[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Tournament Ladder Modal State
  const [showLadderModal, setShowLadderModal] = useState(false);

  // Team Specific Detail Modal State
  const [selectedTeamData, setSelectedTeamData] = useState<{
    groupTeamId: string;
    teamId: string;
    teamName: string;
    logoUrl?: string;
    stats: any;
    matches: Match[];
  } | null>(null);

  // Instruction 5: Manual Standings Edit Mode State
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [wonInput, setWonInput] = useState<number>(0);
  const [drawnInput, setDrawnInput] = useState<number>(0);
  const [lostInput, setLostInput] = useState<number>(0);
  const [gdInput, setGdInput] = useState<number>(0);
  const [ptsInput, setPtsInput] = useState<number>(0);
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    if (groups.length > 0) {
      const initialGroup = selectedGroupId || groups[0].id;
      setSelectedGroupId(initialGroup);
      loadStandings(initialGroup);
    }
  }, [groups]);

  const loadStandings = async (groupId: string) => {
    try {
      setRefreshing(true);
      const data = await fetchGroupStandings(groupId);
      setStandings(data);
    } catch (err) {
      console.error('Error fetching standings:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    loadStandings(groupId);
  };

  const handleRecalculate = async () => {
    if (!selectedGroupId) return;
    try {
      setRefreshing(true);
      await refreshAllData();
      await loadStandings(selectedGroupId);
    } catch (err) {
      console.error('Error recalculating:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Instruction 5: Fetch real live matches from Supabase matches table
  const handleTeamClick = async (gt: GroupTeam) => {
    const teamId = gt.team_id;
    const teamName = gt.team?.name || '팀';
    const logoUrl = gt.team?.logo_url;

    try {
      const [stats, matches] = await Promise.all([
        getTeamDetailedStats(teamId),
        getTeamMatches(teamId) // Real live matches from Supabase
      ]);
      setSelectedTeamData({
        groupTeamId: gt.id,
        teamId,
        teamName,
        logoUrl,
        stats,
        matches
      });

      // Init manual edit values
      setWonInput(gt.won);
      setDrawnInput(gt.drawn);
      setLostInput(gt.lost);
      setGdInput(gt.goal_difference);
      setPtsInput(gt.points);
      setShowManualEdit(false);
    } catch (err) {
      console.error('Error fetching team detail:', err);
    }
  };

  // Instruction 5: Force UPDATE group_teams in Supabase
  const handleSaveManualStandings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamData) return;
    try {
      setSubmittingManual(true);
      await manualEditStandings(selectedTeamData.groupTeamId, {
        won: wonInput,
        drawn: drawnInput,
        lost: lostInput,
        goal_difference: gdInput,
        points: ptsInput
      });
      setShowManualEdit(false);
      await loadStandings(selectedGroupId);
      alert(`[${selectedTeamData.teamName}] 팀의 승점/득실차가 Supabase에 수동 업데이트 되었습니다!`);
    } catch (err) {
      console.error('Manual edit error:', err);
      alert('성적 수동 수정에 실패했습니다.');
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="w-full glass-panel rounded-2xl p-5 border-l-4 border-l-cyan-500 relative overflow-hidden flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">1조 ~ 6조 순위표 (최대 8개팀)</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight whitespace-nowrap">
            조별 순위 (Group Standings)
          </h2>
          <p className="text-xs text-slate-400 mt-1">팀명을 클릭하면 해당 팀 전용 성적 & 수동 수정 기능을 이용할 수 있습니다.</p>
        </div>

        <div className="flex items-center space-x-2 flex-shrink-0">
          <button
            onClick={() => setShowLadderModal(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-slate-950 font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 active-press transition-all whitespace-nowrap"
          >
            <GitFork className="w-4 h-4" />
            <span className="whitespace-nowrap">본선 대진표</span>
          </button>

          <button
            onClick={handleRecalculate}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 text-xs font-semibold active-press transition-all flex items-center space-x-1 whitespace-nowrap"
            title="순위 재산출"
          >
            <RefreshCw className={`w-4 h-4 flex-shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline whitespace-nowrap">새로고침</span>
          </button>
        </div>
      </div>

      {/* Group Selector Pills (1조 ~ 6조) */}
      {groups.length > 0 && (
        <div className="w-full flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {groups.map((group) => {
            const isSelected = selectedGroupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => handleGroupSelect(group.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {formatGroupName(group.name)}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Standings Table */}
      {loading ? (
        <div className="w-full py-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500 mb-2" />
          <span className="text-xs">Supabase에서 순위표 데이터를 불러오는 중...</span>
        </div>
      ) : standings.length === 0 ? (
        <div className="w-full glass-panel rounded-2xl p-8 text-center border border-slate-800">
          <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">선택한 조에 배정된 팀이 없습니다.</p>
        </div>
      ) : (
        <div className="w-full glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-2 text-center whitespace-nowrap">#</th>
                  <th className="py-3 px-3 whitespace-nowrap">팀명 (클릭 상세)</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">경기</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">승</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">무</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">패</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell whitespace-nowrap">득</th>
                  <th className="py-3 px-2 text-center hidden sm:table-cell whitespace-nowrap">실</th>
                  <th className="py-3 px-2 text-center whitespace-nowrap">득실</th>
                  <th className="py-3 px-3 text-center font-bold text-cyan-400 whitespace-nowrap">승점</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {standings.map((gt, idx) => {
                  const rank = idx + 1;
                  const isQualified = rank <= 2;
                  const teamName = gt.team?.name || '팀';

                  return (
                    <tr
                      key={gt.id}
                      className={`transition-colors hover:bg-cyan-500/10 ${
                        isQualified ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-2 text-center">
                        <div className="flex items-center justify-center">
                          {rank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold text-[11px]">
                              1
                            </span>
                          ) : rank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/30 flex items-center justify-center font-bold text-[11px]">
                              2
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px] font-bold">{rank}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleTeamClick(gt)}
                          className="flex items-center space-x-2 text-left group text-slate-100 hover:text-cyan-400 font-bold transition-colors"
                        >
                          {gt.team?.logo_url ? (
                            <img
                              src={gt.team.logo_url}
                              alt={teamName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-700 bg-slate-800"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                              <Shield className="w-4 h-4" />
                            </div>
                          )}
                          <div>
                            <span className="block underline decoration-cyan-500/30 group-hover:decoration-cyan-400 truncate max-w-[120px] sm:max-w-none">
                              {teamName}
                            </span>
                            {isQualified && (
                              <span className="text-[9px] text-cyan-400 font-bold tracking-tight">
                                토너먼트 진출
                              </span>
                            )}
                          </div>
                        </button>
                      </td>

                      <td className="py-3.5 px-2 text-center text-slate-300">{gt.played}</td>
                      <td className="py-3.5 px-2 text-center text-emerald-400 font-bold">{gt.won}</td>
                      <td className="py-3.5 px-2 text-center text-amber-400">{gt.drawn}</td>
                      <td className="py-3.5 px-2 text-center text-rose-400">{gt.lost}</td>
                      <td className="py-3.5 px-2 text-center text-slate-400 hidden sm:table-cell">{gt.goals_for}</td>
                      <td className="py-3.5 px-2 text-center text-slate-400 hidden sm:table-cell">{gt.goals_against}</td>
                      <td className="py-3.5 px-2 text-center font-semibold text-slate-200">
                        {gt.goal_difference > 0 ? `+${gt.goal_difference}` : gt.goal_difference}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 font-extrabold text-sm border border-cyan-500/30">
                          {gt.points}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>조당 최대 8팀 제한 (상위 2팀 본선 토너먼트 진출)</span>
            </span>
          </div>
        </div>
      )}

      {/* 8강/4강/결승 토너먼트 대진표 모달 */}
      {showLadderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel w-full max-w-2xl rounded-2xl p-5 border border-cyan-500/30 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <GitFork className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">1회 women Tournament - 본선 토너먼트 대진표</h3>
              </div>
              <button
                onClick={() => setShowLadderModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 flex items-center gap-1 flex-shrink-0">
              <span>👉 모바일 기기에서는 좌우로 스크롤하여 8강, 4강, 결승 대진표를 확인하실 수 있습니다.</span>
            </p>

            <div className="overflow-x-auto py-4 px-2 space-x-6 flex items-center min-h-[300px] scrollbar-thin">
              <div className="flex-shrink-0 w-48 space-y-6">
                <div className="text-center font-bold text-xs text-cyan-400 border-b border-cyan-500/30 pb-1 uppercase">
                  8강전 (Quarter-Finals)
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5 shadow-md">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
                      <span>1조 1위 (TSA 우먼스)</span>
                      <span className="text-orange-400 font-bold">2</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800 pt-1">
                      <span>2조 2위 (이데일리 스타즈)</span>
                      <span>1</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1.5 shadow-md">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
                      <span>3조 1위 (퀸즈 위너스)</span>
                      <span className="text-orange-400 font-bold">3</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400 border-t border-slate-800 pt-1">
                      <span>4조 2위 (블랙팬서 W)</span>
                      <span>0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-slate-600 font-bold">➔</div>

              <div className="flex-shrink-0 w-48 space-y-6">
                <div className="text-center font-bold text-xs text-amber-400 border-b border-amber-500/30 pb-1 uppercase">
                  준결승전 (Semi-Finals)
                </div>

                <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-2.5 space-y-1.5 shadow-lg">
                  <div className="flex justify-between items-center text-xs font-bold text-white">
                    <span>TSA 우먼스</span>
                    <span className="text-amber-400 font-bold">1</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-300 border-t border-slate-800 pt-1">
                    <span>퀸즈 위너스</span>
                    <span>0</span>
                  </div>
                </div>
              </div>

              <div className="text-slate-600 font-bold">➔</div>

              <div className="flex-shrink-0 w-52 space-y-4">
                <div className="text-center font-extrabold text-xs text-orange-400 border-b border-orange-500/40 pb-1 uppercase flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>결승전 (Finals)</span>
                </div>

                <div className="bg-gradient-to-b from-orange-500/20 to-slate-900 border-2 border-orange-500/60 rounded-2xl p-3 text-center space-y-2 shadow-2xl">
                  <span className="px-2 py-0.5 bg-orange-500 text-white rounded text-[10px] font-bold">
                    CHAMPIONSHIP MATCH
                  </span>
                  <div className="font-sports text-lg font-bold text-white">
                    TSA 우먼스 vs TBD
                  </div>
                  <div className="text-[11px] text-orange-300 font-semibold">
                    10월 15일 (일) 16:00 해누리 1구장
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex-shrink-0">
              <button
                onClick={() => setShowLadderModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 팀 전용 상세 성적 & 수동 수정 모달 (Instruction 5) */}
      {selectedTeamData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-cyan-500/40 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                {selectedTeamData.logoUrl ? (
                  <img src={selectedTeamData.logoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <Shield className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTeamData.teamName} 상세 기록</h3>
                  <span className="text-[10px] text-cyan-400 font-semibold">Supabase 실시간 데이터 동기화</span>
                </div>
              </div>
              <button onClick={() => setSelectedTeamData(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction 5: Manual Standings Edit Toggle Form */}
            {showManualEdit ? (
              <form onSubmit={handleSaveManualStandings} className="p-3.5 bg-slate-900/90 rounded-2xl border border-cyan-500/50 space-y-3 animate-fadeIn text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="font-bold text-cyan-300 flex items-center gap-1">
                    <Edit className="w-3.5 h-3.5 text-cyan-400" />
                    <span>[성적 수동 수정] group_teams 강제 UPDATE</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualEdit(false)}
                    className="text-slate-400 text-[11px]"
                  >
                    취소
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-semibold mb-1">승 (Won)</label>
                    <input
                      type="number"
                      min="0"
                      value={wonInput}
                      onChange={(e) => setWonInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-semibold mb-1">무 (Drawn)</label>
                    <input
                      type="number"
                      min="0"
                      value={drawnInput}
                      onChange={(e) => setDrawnInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-semibold mb-1">패 (Lost)</label>
                    <input
                      type="number"
                      min="0"
                      value={lostInput}
                      onChange={(e) => setLostInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-rose-400 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-semibold mb-1">득실차 (Goal Diff)</label>
                    <input
                      type="number"
                      value={gdInput}
                      onChange={(e) => setGdInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-semibold mb-1">승점 (Points)</label>
                    <input
                      type="number"
                      value={ptsInput}
                      onChange={(e) => setPtsInput(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-center text-cyan-400 font-bold text-base"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingManual}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl flex items-center justify-center space-x-1 shadow-lg shadow-cyan-500/20 active-press transition-all mt-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{submittingManual ? '저장 중...' : 'Supabase 강제 UPDATE 저장'}</span>
                </button>
              </form>
            ) : (
              <div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">경기</span>
                    <span className="font-bold text-white">{selectedTeamData.stats.played}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">승/무/패</span>
                    <span className="font-bold text-emerald-400">{selectedTeamData.stats.won}/{selectedTeamData.stats.drawn}/{selectedTeamData.stats.lost}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">득실차</span>
                    <span className="font-bold text-amber-400">{selectedTeamData.stats.goalDiff}</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">승점</span>
                    <span className="font-bold text-cyan-400">{selectedTeamData.stats.points} PTS</span>
                  </div>
                </div>

                {/* Instruction 5: Manual Standings Edit Trigger Button */}
                <button
                  onClick={() => setShowManualEdit(true)}
                  className="w-full mt-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-bold text-xs flex items-center justify-center space-x-1 active-press transition-all"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>성적 수동 수정 (관리자 전용 UPDATE)</span>
                </button>
              </div>
            )}

            {/* Instruction 5: Real Live Matches from Supabase matches table */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>해당 팀 경기 일정 & 결과 (Supabase matches)</span>
              </h4>

              {selectedTeamData.matches.length === 0 ? (
                <div className="p-4 bg-slate-900/60 rounded-xl text-center text-xs text-slate-400">
                  아직 배정된 경기 일정이 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedTeamData.matches.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center font-bold text-slate-200">
                        <span>{m.home_team?.name} vs {m.away_team?.name}</span>
                        <span className="text-orange-400 font-sports text-sm">
                          {m.status === 'completed' ? `${m.home_score} : ${m.away_score}` : 'VS'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{m.field_location}</span>
                        <span>{m.status === 'completed' ? '경기 종료' : '진행 예정'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTeamData(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-200 font-semibold text-xs"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
