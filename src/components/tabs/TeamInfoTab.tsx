import React, { useEffect, useState, useRef } from 'react';
import { Shield, Plus, Sparkles, Loader2, Trash2, Trophy, Percent, Camera, Image as ImageIcon, Crop, Users, X, ChevronDown } from 'lucide-react';
import type { Team } from '../../lib/supabase';
import { useSupabaseData } from '../../context/SupabaseContext';
import { formatGroupName, getTeamDetailedStats } from '../../lib/dataService';

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
  const { teams: rawTeams, groups, loading, addTeam, removeTeam, addGroup, removeGroup, mapTeamToGroup } = useSupabaseData();
  const [teamsWithStats, setTeamsWithStats] = useState<TeamWithStats[]>([]);

  // RBAC Admin authorization state check
  const isUserAdmin =
    isAdmin ||
    sessionStorage.getItem('tsa_admin_auth') === 'true' ||
    localStorage.getItem('tsa_admin_auth') === 'true';
  const [showModal, setShowModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithStats | null>(null);

  // New Team Form State (Instruction 6: Mandatory Group Selection 1조~6조)
  const [teamName, setTeamName] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Group Assignment Modal State (Instruction 2 & 3)
  const [showGroupAssignModal, setShowGroupAssignModal] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignGroupId, setAssignGroupId] = useState('');
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [submittingNewGroup, setSubmittingNewGroup] = useState(false);

  // Image Upload & Client Crop/Resize State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [croppedImageBase64, setCroppedImageBase64] = useState<string>('');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [rawTeams, groups]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedImageSrc(result);
      setCroppedImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!uploadedImageSrc || !canvasRef.current) return;

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = uploadedImageSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 160;
      canvas.width = size;
      canvas.height = size;

      ctx.clearRect(0, 0, size, size);
      
      const sw = img.width / zoomScale;
      const sh = img.height / zoomScale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);

      const base64 = canvas.toDataURL('image/png');
      setCroppedImageBase64(base64);
    };
  }, [uploadedImageSrc, zoomScale]);

  // Instruction 6: Insert into teams & group_teams with mandatory selectedGroupId
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    try {
      setSubmitting(true);
      await addTeam(teamName, croppedImageBase64 || '', selectedGroupId || (groups[0]?.id));
      setTeamName('');
      setUploadedImageSrc(null);
      setCroppedImageBase64('');
      setShowModal(false);
      alert(`[${teamName}] 팀이 생성되었으며 순위표에 자동 배치되었습니다!`);
    } catch (err) {
      console.error('Error creating team:', err);
      alert('팀 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeam = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 팀을 삭제하시겠습니까?')) return;
    try {
      await removeTeam(id);
    } catch (err) {
      console.error('Error deleting team:', err);
    }
  };

  const handleAssignTeamToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTeamId || !assignGroupId) return;
    try {
      setSubmittingAssign(true);
      await mapTeamToGroup(assignTeamId, assignGroupId);
      const targetTeam = rawTeams.find(t => t.id === assignTeamId);
      const targetGroup = groups.find(g => g.id === assignGroupId);
      setShowGroupAssignModal(false);
      setShowAddGroupInput(false);
      alert(`[${targetTeam?.name || '팀'}] 팀이 [${formatGroupName(targetGroup?.name)}] 에 성공적으로 배정되었습니다!`);
    } catch (err) {
      console.error('Error mapping team to group:', err);
      alert('팀 조 배정에 실패했습니다.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleAddNewGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      setSubmittingNewGroup(true);
      const formattedName = formatGroupName(newGroupName.trim());
      const created = await addGroup(formattedName);
      setNewGroupName('');
      setShowAddGroupInput(false);
      if (created) {
        setAssignGroupId(created.id);
      }
      alert(`[${formattedName}] 조가 성공적으로 추가되었습니다!`);
    } catch (err) {
      console.error('Error adding new group:', err);
      alert('조 추가에 실패했습니다.');
    } finally {
      setSubmittingNewGroup(false);
    }
  };

  const handleDeleteGroupItem = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Instruction 2: Prevent dropdown option selection
    if (!window.confirm('이 조를 삭제하시겠습니까? 등록된 팀의 조 배정도 함께 초기화됩니다.')) return;
    try {
      await removeGroup(groupId);
      if (assignGroupId === groupId) {
        const remaining = groups.filter(g => g.id !== groupId);
        setAssignGroupId(remaining.length > 0 ? remaining[0].id : '');
      }
    } catch (err) {
      console.error('Error deleting group:', err);
      alert('조 삭제 실패');
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="w-full glass-panel rounded-2xl p-5 border-l-4 border-l-purple-500 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>1회 women Tournament</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">참가 팀 프로필 & 로고</h2>
          <p className="text-xs text-slate-400 mt-1">소속 조(1조~6조)를 지정하거나 기존 팀의 조별 엔트리를 개별 배정할 수 있습니다.</p>
        </div>

        {/* RBAC: Only render action buttons for authenticated admins */}
        {isUserAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setUploadedImageSrc(null);
                setCroppedImageBase64('');
                if (groups.length > 0) setSelectedGroupId(groups[0].id);
                setShowModal(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-500/20 active-press transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>팀 추가</span>
            </button>

            <button
              onClick={() => {
                if (rawTeams.length > 0) setAssignTeamId(rawTeams[0].id);
                if (groups.length > 0) setAssignGroupId(groups[0].id);
                setShowGroupAssignModal(true);
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold shadow-lg shadow-orange-500/20 active-press transition-all whitespace-nowrap border border-orange-400/30"
            >
              <Users className="w-4 h-4" />
              <span>조별 등록(엔트리 배정)</span>
            </button>
          </div>
        )}
      </div>

      {/* Teams Grid List */}
      {loading ? (
        <div className="w-full py-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mb-2" />
          <span className="text-xs">Supabase에서 팀 목록을 불러오는 중...</span>
        </div>
      ) : teamsWithStats.length === 0 ? (
        <div className="w-full glass-panel rounded-2xl p-8 text-center border border-slate-800">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">등록된 팀이 없습니다.</p>
          <p className="text-xs text-slate-500 mt-1">대회에 등록된 참가팀 목록이 표시됩니다.</p>
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

                  {isUserAdmin && (
                    <button
                      onClick={(e) => handleDeleteTeam(t.id, e)}
                      className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="팀 삭제"
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

      {/* Register Team Modal with Mandatory Group Assignment (Instruction 6) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-500" />
                <span>새 참가 팀 등록 & 소속 조 지정</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">팀 이름</label>
                <input
                  type="text"
                  required
                  placeholder="예: TSA 우먼스 FC"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              {/* Instruction 6: Mandatory Group Select (1조~6조) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  소속 조 선택 (1조 ~ 6조 필수 지정)
                </label>
                <select
                  required
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-purple-400 mt-1 block">
                  * 팀 등록 시 선택한 조의 group_teams에 즉시 INSERT 되어 조별 순위표에 나타납니다.
                </span>
              </div>

              {/* Photo Gallery Input */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>팀 로고 업로드 (Storage team-logos)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-slate-900 border-2 border-dashed border-slate-700 hover:border-purple-500 text-slate-300 font-semibold flex items-center justify-center space-x-2 active-press transition-all"
                >
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  <span>{uploadedImageSrc ? '다른 사진 선택하기' : '사진첩에서 로고 선택하기'}</span>
                </button>

                {uploadedImageSrc && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span className="flex items-center gap-1 font-bold">
                        <Crop className="w-3.5 h-3.5 text-purple-400" />
                        <span>이미지 크기 & 줌 조절 (160x160px)</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-center py-2 bg-slate-900 rounded-xl border border-slate-800">
                      <canvas
                        ref={canvasRef}
                        className="w-32 h-32 rounded-2xl border-2 border-purple-500/60 shadow-lg object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>확대/축소 (Zoom)</span>
                        <span>{zoomScale.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={zoomScale}
                        onChange={(e) => setZoomScale(parseFloat(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center space-x-1"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>팀 업로드 & 조 배정 저장</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Assignment Modal (Instruction 3 & 4) */}
      {showGroupAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md glass-panel rounded-2xl p-5 border border-orange-500/30 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-orange-400 font-bold text-sm">
                <Users className="w-4.5 h-4.5 text-amber-400" />
                <span>팀 조별 등록 (엔트리 배정)</span>
              </div>
              <button
                onClick={() => {
                  setShowGroupAssignModal(false);
                  setShowAddGroupInput(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignTeamToGroup} className="space-y-4">
              {/* Field 1: Participating Team Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                  <span>참가 팀 선택 (teams 테이블)</span>
                  <span className="text-orange-400">*</span>
                </label>
                <select
                  required
                  value={assignTeamId}
                  onChange={(e) => setAssignTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500 font-medium"
                >
                  {rawTeams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: Assigned Group Select + Compact [+ 조 추가] Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                    <span>소속 조 선택 (groups 테이블)</span>
                    <span className="text-orange-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddGroupInput(!showAddGroupInput)}
                    className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/40 text-[11px] font-extrabold flex items-center space-x-1 active-press transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 조 추가</span>
                  </button>
                </div>

                {/* Inline New Group Name Input */}
                {showAddGroupInput && (
                  <div className="flex space-x-2 p-2 bg-slate-950 rounded-xl border border-amber-500/50 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="신규 조 이름 (예: 7조, 여성부 A조)"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      disabled={submittingNewGroup || !newGroupName.trim()}
                      onClick={handleAddNewGroup}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs flex items-center space-x-1 whitespace-nowrap active-press"
                    >
                      {submittingNewGroup ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <span>추가</span>
                      )}
                    </button>
                  </div>
                )}

                {/* Custom Group Dropdown UI (Instruction 1 & 2) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsGroupDropdownOpen(!isGroupDropdownOpen)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white flex items-center justify-between font-bold focus:outline-none focus:border-orange-500 hover:border-slate-700 transition-all"
                  >
                    <span>
                      {assignGroupId
                        ? formatGroupName(groups.find(g => g.id === assignGroupId)?.name)
                        : '소속 조 선택'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isGroupDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isGroupDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-2xl max-h-48 overflow-y-auto space-y-0.5 animate-fadeIn">
                      {groups.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500 text-center">등록된 조가 없습니다.</div>
                      ) : (
                        groups.map((group) => {
                          const isSelected = assignGroupId === group.id;
                          return (
                            <div
                              key={group.id}
                              onClick={() => {
                                setAssignGroupId(group.id);
                                setIsGroupDropdownOpen(false);
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold'
                                  : 'hover:bg-slate-800/80 text-slate-200'
                              }`}
                            >
                              <span>{formatGroupName(group.name)}</span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteGroupItem(group.id, e)}
                                title="조 삭제"
                                className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 active-press transition-all flex items-center justify-center"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGroupAssignModal(false);
                    setShowAddGroupInput(false);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !assignTeamId || !assignGroupId}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-orange-500/20 active-press transition-all"
                >
                  {submittingAssign ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>완료 (엔트리 배정)</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
