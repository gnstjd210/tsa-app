import React, { useEffect, useState } from 'react';
import { Shield, Plus, Sparkles, Loader2, Trash2, Trophy, Percent, Users } from 'lucide-react';
import type { Team } from '../../lib/supabase';
import { useSupabaseData } from '../../context/SupabaseContext';
import { getTeamDetailedStats } from '../../lib/dataService';
import { OfficialTeamModal } from '../OfficialTeamModal';

interface TeamWithStats extends Team {
  stats?: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
    winRate: number;
  };
}

interface TeamInfoTabProps {
  isAdmin?: boolean;
}

export const TeamInfoTab: React.FC<TeamInfoTabProps> = ({ isAdmin = false }) => {
  const { teams: rawTeams, loading, removeTeam } = useSupabaseData();
  const [teamsWithStats, setTeamsWithStats] = useState<TeamWithStats[]>([]);

  // RBAC Admin authorization state check
  const isUserAdmin =
    isAdmin ||
    sessionStorage.getItem('tsa_admin_auth') === 'true' ||
    localStorage.getItem('tsa_admin_auth') === 'true';

  const [selectedTeam, setSelectedTeam] = useState<TeamWithStats | null>(null);

  // Unified Official Team Modal State (Requirement 1: Single Source of Truth)
  const [showOfficialModal, setShowOfficialModal] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      const list = await Promise.all(
        rawTeams.map(async (t) => {
          const stats = await getTeamDetailedStats(t.id);
          return { ...t, stats };
        })
      );
      setTeamsWithStats(list);
    };

    if (rawTeams.length > 0) {
      loadStats();
    } else {
      setTeamsWithStats([]);
    }
  }, [rawTeams]);

  const handleDeleteTeam = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 공식 팀을 삭제하시겠습니까? 관련 데이터가 제거됩니다.')) return;
    try {
      await removeTeam(id);
    } catch (err) {
      console.error('Error deleting team:', err);
      alert('팀 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Header Banner with Unified Admin Button (Requirement 1) */}
      <div className="w-full glass-panel rounded-2xl p-5 border-l-4 border-l-purple-500 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>1회 women Tournament</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">공식 참가 팀 프로필 & 전적</h2>
          <p className="text-xs text-slate-400 mt-1">소속 조(1조~6조)를 지정하거나 참가 팀의 전적을 실시간 확인할 수 있습니다.</p>
        </div>

        {/* Requirement 1: Unified Button Naming [공식 참가팀 등록] */}
        {isUserAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOfficialModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold shadow-lg shadow-purple-500/25 active-press transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>[공식 참가팀 등록]</span>
            </button>
          </div>
        )}
      </div>

      {/* Official Teams Grid List */}
      {loading ? (
        <div className="w-full py-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs">공식 팀 목록을 불러오는 중...</span>
        </div>
      ) : teamsWithStats.length === 0 ? (
        <div className="w-full glass-panel rounded-2xl p-8 text-center border border-slate-800">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">등록된 공식 팀이 없습니다.</p>
          <p className="text-xs text-slate-500 mt-1">대회 주최측 관리자가 승인한 공식 참가 팀이 노출됩니다.</p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 gap-3">
          {teamsWithStats.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTeam(t)}
              className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer group shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  {t.logo_url ? (
                    <img
                      src={t.logo_url}
                      alt={t.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md group-hover:scale-105 transition-transform bg-slate-900"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Shield className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">
                      {t.name}
                    </h3>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span>{t.stats?.played || 0}전 {t.stats?.won || 0}승 {t.stats?.drawn || 0}무 {t.stats?.lost || 0}패</span>
                      <span>•</span>
                      <span className="text-purple-400 font-bold">승률 {t.stats?.winRate || 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">승점</span>
                    <span className="text-lg font-extrabold text-amber-400 font-sports">
                      {t.stats?.points || 0} PTS
                    </span>
                  </div>

                  {/* Admin Only Delete Team Button */}
                  {isUserAdmin && (
                    <button
                      onClick={(e) => handleDeleteTeam(t.id, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="공식 팀 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                {selectedTeam.logo_url && (
                  <img src={selectedTeam.logo_url} alt="" className="w-8 h-8 rounded-full" />
                )}
                <h3 className="text-base font-bold text-white">{selectedTeam.name} 상세 전적</h3>
              </div>
              <button onClick={() => setSelectedTeam(null)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">총 승점</span>
                    <span className="text-base font-bold text-white">{selectedTeam.stats?.points} 점</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center space-x-3">
                  <Percent className="w-5 h-5 text-purple-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">승률</span>
                    <span className="text-base font-bold text-purple-400">{selectedTeam.stats?.winRate}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>총 경기 수</span>
                  <span className="font-bold">{selectedTeam.stats?.played} 경기</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>승 / 무 / 패</span>
                  <span className="font-bold">{selectedTeam.stats?.won}승 {selectedTeam.stats?.drawn}무 {selectedTeam.stats?.lost}패</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>총 득점 / 실점</span>
                  <span className="font-bold">{selectedTeam.stats?.goalsFor}득 / {selectedTeam.stats?.goalsAgainst}실</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedTeam(null)}
                className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirement 1: Unified Official Team Modal */}
      <OfficialTeamModal
        isOpen={showOfficialModal}
        onClose={() => setShowOfficialModal(false)}
      />
    </div>
  );
};
