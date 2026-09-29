import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Trophy, Megaphone, CalendarDays, Edit, Sparkles, Plus, Save } from 'lucide-react';
import { useSupabaseData } from '../../context/SupabaseContext';

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
  const { sponsorTitle, updateSponsorTitle, addAnnouncement } = useSupabaseData();
  const [newSponsorInput, setNewSponsorInput] = useState(sponsorTitle || '이데일리 컵');
  const [savingSponsor, setSavingSponsor] = useState(false);

  // Instruction 4: Home Content Editing Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleLocation, setScheduleLocation] = useState('');
  const [submittingContent, setSubmittingContent] = useState(false);

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

      {/* Instruction 2: Sponsor Title Dynamic Management Form */}
      <div className="w-full glass-panel p-4 rounded-2xl border border-orange-500/30 bg-slate-900/90 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-bold text-orange-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>[동적 관리] 메인 스폰서 타이틀 수정 (Supabase tournaments 연동)</span>
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
            <span>{savingSponsor ? '저장 중...' : '타이틀 저장'}</span>
          </button>
        </form>
      </div>

      {/* Instruction 4: Home Content Editing Buttons */}
      <div className="w-full glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <Edit className="w-4 h-4 text-blue-400" />
          <span>홈 화면(Home) 콘텐츠 편집 & 게시글 관리</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl font-bold text-slate-200 flex items-center justify-center space-x-1.5 active-press transition-all"
          >
            <Plus className="w-4 h-4 text-orange-400" />
            <span>향후 대회 일정 추가</span>
          </button>

          <button
            onClick={() => onNavigateTab('announcements')}
            className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl font-bold text-slate-200 flex items-center justify-center space-x-1.5 active-press transition-all"
          >
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>스폰서 홍보글 작성</span>
          </button>
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
          <h3 className="font-bold text-slate-100 text-sm">참가 팀 등록 (1조~6조 배정)</h3>
          <p className="text-slate-400 text-[11px]">소속 조 선택 필수 지정 & 갤러리 업로드</p>
        </button>
      </div>

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
