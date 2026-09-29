import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Trophy, Megaphone, CalendarDays, Edit, Sparkles, Plus, Save, FileText, Trash2, Pin, Users, Shield, Camera, Image as ImageIcon, Crop, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useSupabaseData } from '../../context/SupabaseContext';
import { formatGroupName } from '../../lib/dataService';
import { OfficialTeamModal } from '../OfficialTeamModal';

interface AdminPanelProps {
  onNavigateTab: (tab: any) => void;
  onManualSeed: () => void;
  seeding: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onNavigateTab,
  onManualSeed,
  seeding
}) => {
  const {
    sponsorTitle,
    updateSponsorTitle,
    addAnnouncement,
    posts,
    addPost,
    removePost,
    teams: rawTeams,
    groups,
    addTeam,
    removeTeam,
    addGroup,
    removeGroup,
    mapTeamToGroup
  } = useSupabaseData();

  const [newSponsorInput, setNewSponsorInput] = useState(sponsorTitle || '이데일리 컵');
  const [savingSponsor, setSavingSponsor] = useState(false);

  // Home Content Editing Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [submittingContent, setSubmittingContent] = useState(false);

  // Requirement 5: CMS Post Management Form State
  const [cmsCategory, setCmsCategory] = useState<'공지사항' | '향후 대회 일정' | '스폰서/파트너십'>('공지사항');
  const [cmsTitle, setCmsTitle] = useState('');
  const [cmsContent, setCmsContent] = useState('');
  const [cmsLink, setCmsLink] = useState('');
  const [cmsPinned, setCmsPinned] = useState(false);
  const [submittingCms, setSubmittingCms] = useState(false);

  // Requirement 1: Single Source of Truth Official Team Modal
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [adminTeamName, setAdminTeamName] = useState('');
  const [adminSelectedGroupId, setAdminSelectedGroupId] = useState('');
  const [submittingTeam, setSubmittingTeam] = useState(false);

  // Group Entry Assignment State
  const [showGroupAssignModal, setShowGroupAssignModal] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignGroupId, setAssignGroupId] = useState('');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  // Image Upload State for Admin Team Logo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [croppedImageBase64, setCroppedImageBase64] = useState<string>('');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (groups.length > 0 && !adminSelectedGroupId) {
      setAdminSelectedGroupId(groups[0].id);
    }
  }, [groups]);

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

  const handleCreateOfficialTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTeamName.trim()) return;
    try {
      setSubmittingTeam(true);
      await addTeam(adminTeamName.trim(), croppedImageBase64 || '', adminSelectedGroupId || (groups[0]?.id));
      setAdminTeamName('');
      setUploadedImageSrc(null);
      setCroppedImageBase64('');
      setShowAddTeamModal(false);
      alert(`[${adminTeamName.trim()}] 팀이 공식 참가팀(teams 테이블)으로 등록되었습니다!`);
    } catch (err) {
      console.error('Error creating official team:', err);
      alert('공식 팀 생성에 실패했습니다.');
    } finally {
      setSubmittingTeam(false);
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
      alert(`[${targetTeam?.name || '팀'}] 팀이 [${formatGroupName(targetGroup?.name)}] 조에 성공적으로 배정되었습니다!`);
    } catch (err) {
      console.error('Error assigning team to group:', err);
      alert('팀 조 배정에 실패했습니다.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleSponsorTitleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSponsorInput.trim()) return;
    try {
      setSavingSponsor(true);
      await updateSponsorTitle(newSponsorInput.trim());
      alert(`메인 스폰서 타이틀이 [${newSponsorInput.trim()}] 로 변경 및 Supabase에 반영되었습니다!`);
    } catch (err) {
      console.error(err);
      alert('스폰서 타이틀 업데이트 실패');
    } finally {
      setSavingSponsor(false);
    }
  };

  const handleCreateHomeSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleTitle.trim()) return;
    try {
      setSubmittingContent(true);
      await addAnnouncement(
        `🏆 [향후 대회 일정] ${scheduleTitle}`,
        `일시: ${scheduleDate || '상세일정 추후공지'}\n장소: ${scheduleLocation || '해누리체육공원'}`,
        true
      );
      setScheduleTitle('');
      setScheduleDate('');
      setScheduleLocation('');
      setShowScheduleModal(false);
      alert('홈 향후 대회 일정이 추가되었습니다!');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingContent(false);
    }
  };

  const handleCreateCmsPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmsTitle.trim() || !cmsContent.trim()) return;
    try {
      setSubmittingCms(true);
      await addPost({
        category: cmsCategory,
        title: cmsTitle.trim(),
        content: cmsContent.trim(),
        link: cmsLink.trim() || undefined,
        is_pinned: cmsPinned,
        author: '최고 관리자'
      });
      setCmsTitle('');
      setCmsContent('');
      setCmsLink('');
      setCmsPinned(false);
      alert(`[${cmsCategory}] 게시글이 성공적으로 등록되었습니다!`);
    } catch (err) {
      console.error('Error creating CMS post:', err);
      alert('게시글 등록에 실패했습니다.');
    } finally {
      setSubmittingCms(false);
    }
  };

  const handleDeleteCmsPost = async (id: string) => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;
    try {
      await removePost(id);
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('게시글 삭제 실패');
    }
  };

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Admin Dashboard Header */}
      <div className="w-full glass-panel rounded-2xl p-4 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-500/10 via-slate-900 to-slate-900">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                TSA 관리자 대시보드
              </h2>
              <p className="text-xs text-slate-400">대회 설정 및 콘텐츠를 관리할 수 있습니다.</p>
            </div>
          </div>

          <button
            onClick={onManualSeed}
            disabled={seeding}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 active-press transition-all whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin text-orange-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{seeding ? '동기화 중...' : '데이터 새로고침'}</span>
          </button>
        </div>
      </div>

      {/* Requirement 2: Main Banner Update Only Form (No delete button allowed) */}
      <div className="w-full glass-panel p-4 rounded-2xl border border-orange-500/30 bg-slate-900/90 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-orange-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>[메인 배너 설정] '이데일리컵 공식대회' 타이틀 수정 (수정 전용)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">* 삭제 불가 (설정값 업데이트만 가능)</span>
        </div>

        <form onSubmit={handleSponsorTitleSave} className="flex space-x-2">
          <input
            type="text"
            required
            placeholder="예: 이데일리 컵, TSA 마스터즈 컵"
            value={newSponsorInput}
            onChange={(e) => setNewSponsorInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={savingSponsor}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1 shadow-md shadow-orange-500/20 active-press transition-all whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingSponsor ? '저장 중...' : '배너 텍스트 저장'}</span>
          </button>
        </form>
      </div>

      {/* Requirement 5: Admin CMS (게시물 관리) Form & Live List */}
      <div className="w-full glass-panel p-4 rounded-2xl border border-blue-500/30 bg-slate-900/90 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>[Admin CMS] 게시물 작성 및 카테고리 관리</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">Supabase posts 테이블 연동</span>
        </div>

        <form onSubmit={handleCreateCmsPost} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">카테고리 선택</label>
              <select
                value={cmsCategory}
                onChange={(e) => setCmsCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
              >
                <option value="공지사항">📢 공지사항</option>
                <option value="향후 대회 일정">🏆 향후 대회 일정</option>
                <option value="스폰서/파트너십">🤝 스폰서 / 파트너십</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">게시물 제목</label>
              <input
                type="text"
                required
                placeholder="제목을 입력하세요"
                value={cmsTitle}
                onChange={(e) => setCmsTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          {cmsCategory === '스폰서/파트너십' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>🔗 스폰서 홈페이지 링크 (URL)</span>
                <span className="text-[10px] text-amber-400 font-normal">* 선택 사항 (입력 시 사용자 클릭 시 새 창 열림)</span>
              </label>
              <input
                type="url"
                placeholder="https://www.edaily.co.kr"
                value={cmsLink}
                onChange={(e) => setCmsLink(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">게시물 상세 내용</label>
            <textarea
              required
              rows={3}
              placeholder="내용을 입력하세요..."
              value={cmsContent}
              onChange={(e) => setCmsContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300 text-xs">
              <input
                type="checkbox"
                checked={cmsPinned}
                onChange={(e) => setCmsPinned(e.target.checked)}
                className="rounded accent-orange-500"
              />
              <span className="flex items-center gap-1 font-semibold">
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>상단 고정 (Pinned)</span>
              </span>
            </label>

            <button
              type="submit"
              disabled={submittingCms || !cmsTitle.trim() || !cmsContent.trim()}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md shadow-blue-500/20 active-press transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{submittingCms ? '등록 중...' : '게시물 작성 완료'}</span>
            </button>
          </div>
        </form>

        {/* Live CMS Posts List */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            등록된 CMS 게시물 목록 ({posts.length}건)
          </h4>

          {posts.length === 0 ? (
            <div className="p-4 bg-slate-950 rounded-xl text-center text-slate-500 text-xs">
              등록된 CMS 게시물이 없습니다.
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {posts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-2"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        p.category === '공지사항'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : p.category === '향후 대회 일정'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {p.category}
                      </span>
                      {p.is_pinned && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[9px] font-extrabold">
                          📌 고정됨
                        </span>
                      )}
                      <span className="text-white text-xs font-bold truncate">{p.title}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] line-clamp-2 leading-relaxed">
                      {p.content}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteCmsPost(p.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                    title="게시물 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Requirement 1: Official Team Management Section (Only accessible via /admin) */}
      <div className="w-full glass-panel p-4 rounded-2xl border border-purple-500/30 bg-slate-900/90 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-400">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span>[공식 참가팀 관리] 팀 등록 & 조별 엔트리 배정</span>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">teams & group_teams 테이블</span>
        </div>

        <div className="w-full">
          <button
            onClick={() => setShowOfficialModal(true)}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold flex items-center justify-center space-x-1.5 shadow-md shadow-purple-500/20 active-press transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>[공식 참가팀 등록]</span>
          </button>
        </div>

        <OfficialTeamModal
          isOpen={showOfficialModal}
          onClose={() => setShowOfficialModal(false)}
        />

        {/* List of Registered Teams */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            등록된 공식 참가팀 목록 ({rawTeams.length}팀)
          </h4>

          {rawTeams.length === 0 ? (
            <div className="p-4 bg-slate-950 rounded-xl text-center text-slate-500 text-xs">
              등록된 공식 팀이 없습니다. 위 버튼을 클릭해 추가하세요.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {rawTeams.map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {t.logo_url ? (
                      <img src={t.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover bg-slate-900 border border-slate-700" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <span className="font-bold text-white truncate">{t.name}</span>
                  </div>

                  <button
                    onClick={async () => {
                      if (!window.confirm(`[${t.name}] 팀을 정말 삭제하시겠습니까?`)) return;
                      await removeTeam(t.id);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="팀 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Quick Action Cards */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <button
          onClick={() => onNavigateTab('schedule')}
          className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-blue-500/50 text-left space-y-2 group transition-all"
        >
          <CalendarDays className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-slate-100 text-sm">신규 매치 & 점수 입력</h3>
          <p className="text-slate-400 text-[11px]">경기 스코어 등록, LIVE 중계, 구장 변경 관리</p>
        </button>

        <button
          onClick={() => onNavigateTab('teams')}
          className="glass-panel p-4 rounded-2xl border border-slate-800 hover:border-purple-500/50 text-left space-y-2 group transition-all"
        >
          <Trophy className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
          <h3 className="font-bold text-slate-100 text-sm">공식 팀 목록 조회</h3>
          <p className="text-slate-400 text-[11px]">일반 유저용 팀 리스트 & 승률 통계 보기</p>
        </button>
      </div>

      {/* Admin Official Team Registration Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-purple-500/30 bg-slate-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>공식 참가 팀 등록 (is_admin 전용)</span>
              </h3>
              <button onClick={() => setShowAddTeamModal(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOfficialTeam} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">공식 팀 이름</label>
                <input
                  type="text"
                  required
                  placeholder="예: TSA 우먼스 FC"
                  value={adminTeamName}
                  onChange={(e) => setAdminTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">소속 조 지정 (필수)</label>
                <select
                  required
                  value={adminSelectedGroupId}
                  onChange={(e) => setAdminSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {formatGroupName(g.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Photo Upload */}
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
                  className="w-full py-3 rounded-xl bg-slate-950 border-2 border-dashed border-slate-700 hover:border-purple-500 text-slate-300 font-semibold flex items-center justify-center space-x-2 active-press transition-all"
                >
                  <ImageIcon className="w-5 h-5 text-purple-400" />
                  <span>{uploadedImageSrc ? '다른 사진 선택하기' : '로고 이미지 파일 선택'}</span>
                </button>

                {uploadedImageSrc && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-center py-2 bg-slate-900 rounded-xl border border-slate-800">
                      <canvas
                        ref={canvasRef}
                        className="w-28 h-28 rounded-2xl border-2 border-purple-500/60 shadow-lg object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingTeam}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center space-x-1"
                >
                  {submittingTeam ? '등록 중...' : '공식 팀 생성 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Group Entry Assignment Modal */}
      {showGroupAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md glass-panel rounded-2xl p-5 border border-orange-500/30 bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-orange-400 font-bold text-sm">
                <Users className="w-4.5 h-4.5 text-amber-400" />
                <span>팀 조별 등록 (엔트리 배정)</span>
              </div>
              <button onClick={() => setShowGroupAssignModal(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignTeamToGroup} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">참가 팀 선택</label>
                <select
                  required
                  value={assignTeamId}
                  onChange={(e) => setAssignTeamId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-medium"
                >
                  {rawTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">배정할 소속 조 선택</label>
                <select
                  required
                  value={assignGroupId}
                  onChange={(e) => setAssignGroupId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {formatGroupName(g.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGroupAssignModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !assignTeamId || !assignGroupId}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-lg active-press transition-all"
                >
                  {submittingAssign ? '배정 중...' : '조 배정 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Home Schedule Addition Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>향후 대회 일정 콘텐츠 추가</span>
              </h3>
              <button onClick={() => setShowScheduleModal(false)} className="text-slate-400 text-xs">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHomeSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">대회 타이틀</label>
                <input
                  type="text"
                  required
                  placeholder="예: TSA 윈터 마스터즈 챔피언십"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">대회 기간</label>
                <input
                  type="text"
                  placeholder="예: 2026. 12. 05 ~ 12. 20"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">장소</label>
                <input
                  type="text"
                  placeholder="예: 해누리체육공원 특설구장"
                  value={scheduleLocation}
                  onChange={(e) => setScheduleLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingContent}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center justify-center"
                >
                  {submittingContent ? '저장 중...' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
