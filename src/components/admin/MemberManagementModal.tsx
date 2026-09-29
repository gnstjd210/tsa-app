import React, { useState, useEffect } from 'react';
import { Users, X, Shield, Calendar, Filter, ArrowUpDown, Loader2 } from 'lucide-react';
import { useSupabaseData } from '../../context/SupabaseContext';
import { getTeamDetailedStats } from '../../lib/dataService';

interface MemberTeamRow {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt?: string;
  groupName: string;
  stats?: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    points: number;
  };
}

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemberManagementModal: React.FC<MemberManagementModalProps> = ({
  isOpen,
  onClose
}) => {
  const { teams, groups, fetchGroupStandings } = useSupabaseData();
  const [memberRows, setMemberRows] = useState<MemberTeamRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Sorting & Filtering State
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc'); // 최신순 vs 과거순
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all'); // 조별 필터

  useEffect(() => {
    if (!isOpen) return;

    const loadMemberData = async () => {
      try {
        setLoading(true);

        // Build group mapping
        const groupTeamMap: Record<string, string> = {};
        for (const g of groups) {
          const standings = await fetchGroupStandings(g.id);
          standings.forEach(gt => {
            if (gt.team_id) {
              groupTeamMap[gt.team_id] = g.name;
            }
          });
        }

        const rows = await Promise.all(
          teams.map(async (t) => {
            const stats = await getTeamDetailedStats(t.id);
            return {
              id: t.id,
              name: t.name,
              logoUrl: t.logo_url,
              createdAt: t.created_at || new Date().toISOString(),
              groupName: groupTeamMap[t.id] || '미배정',
              stats
            };
          })
        );

        setMemberRows(rows);
      } catch (err) {
        console.error('Error loading member management data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMemberData();
  }, [isOpen, teams, groups]);

  if (!isOpen) return null;

  // Filter by Group
  const filteredRows = memberRows.filter(r => {
    if (selectedGroupFilter === 'all') return true;
    return r.groupName === selectedGroupFilter;
  });

  // Sort by Date
  const sortedRows = [...filteredRows].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return dateSort === 'desc' ? timeB - timeA : timeA - timeB;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-5 border border-red-500/30 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>관리자 전용 회원 & 참가 팀 목록</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-red-500 text-white font-extrabold">
                  ADMIN ONLY
                </span>
              </h3>
              <p className="text-xs text-slate-400">등록된 회원 및 팀 가입 일자/소속 조 현황 관리</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sorting & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs flex-shrink-0">
          {/* Group Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-semibold whitespace-nowrap">소속 조 필터:</span>
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-white font-semibold flex-1 sm:flex-initial"
            >
              <option value="all">전체 소속 조 (1조~6조)</option>
              {groups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
              <option value="미배정">미배정</option>
            </select>
          </div>

          {/* Date Sort Toggle */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 font-semibold whitespace-nowrap">가입 날짜 정렬:</span>
            <button
              onClick={() => setDateSort(dateSort === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-bold hover:bg-slate-800 active-press transition-all whitespace-nowrap"
            >
              {dateSort === 'desc' ? '최신순 ↓' : '과거순 ↑'}
            </button>
          </div>
        </div>

        {/* Member Data Table */}
        <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl glass-panel">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
              <span className="text-xs">회원 및 팀 목록 데이터를 불러오는 중...</span>
            </div>
          ) : sortedRows.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              조건에 일치하는 등록 회원/팀 데이터가 없습니다.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-3">팀명 / 회원</th>
                  <th className="py-3 px-2 text-center">소속 조</th>
                  <th className="py-3 px-2 text-center">등록 일자</th>
                  <th className="py-3 px-2 text-center">전적 (승/무/패)</th>
                  <th className="py-3 px-3 text-center">승점</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sortedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Team Name */}
                    <td className="py-3 px-3 font-bold text-slate-100">
                      <div className="flex items-center space-x-2.5">
                        {row.logoUrl ? (
                          <img
                            src={row.logoUrl}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-slate-700"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                            <Shield className="w-4 h-4" />
                          </div>
                        )}
                        <span>{row.name}</span>
                      </div>
                    </td>

                    {/* Assigned Group */}
                    <td className="py-3 px-2 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-cyan-300 font-extrabold text-[11px]">
                        {row.groupName}
                      </span>
                    </td>

                    {/* Registration Date */}
                    <td className="py-3 px-2 text-center text-slate-400">
                      <div className="flex items-center justify-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{row.createdAt ? new Date(row.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
                      </div>
                    </td>

                    {/* Record */}
                    <td className="py-3 px-2 text-center text-slate-300">
                      {row.stats?.won || 0}승 {row.stats?.drawn || 0}무 {row.stats?.lost || 0}패
                    </td>

                    {/* Points */}
                    <td className="py-3 px-3 text-center font-bold text-amber-400 font-sports text-sm">
                      {row.stats?.points || 0} PTS
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-between items-center text-xs flex-shrink-0">
          <span className="text-slate-400">총 {sortedRows.length}개 팀 회원 등록됨</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
