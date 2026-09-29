import React, { useState } from 'react';
import { Calendar, ExternalLink, Flame, Sparkles, ChevronRight, Award, Trophy, Users, X, Edit, Trash2, Plus, Megaphone, Loader2, Save, Link as LinkIcon, ShieldCheck } from 'lucide-react';
import { useSupabaseData } from '../../context/SupabaseContext';
import type { Post } from '../../lib/supabase';

interface SponsorItem {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  logo: string;
  bannerBg: string;
  link?: string;
  badge: string;
  dbPostId?: string;
}

interface ScheduleItem {
  id: string;
  dbPostId?: string;
  title: string;
  date: string;
  location: string;
  status: string;
  participants: string;
  highlight?: boolean;
}

interface HomeTabProps {
  onNavigateTab: (tab: any) => void;
  isAdmin?: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onNavigateTab, isAdmin = false }) => {
  const { posts, addPost, editPost, removePost } = useSupabaseData();

  // Regular User Detail Modal State for Sponsor
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorItem | null>(null);

  // Admin Sponsor Inline CRUD Modal State
  const [adminSponsorModal, setAdminSponsorModal] = useState<SponsorItem | null>(null);
  const [sponsorEditName, setSponsorEditName] = useState('');
  const [sponsorEditBadge, setSponsorEditBadge] = useState('OFFICIAL SPONSOR');
  const [sponsorEditDescription, setSponsorEditDescription] = useState('');
  const [sponsorEditLink, setSponsorEditLink] = useState('');
  const [savingSponsorEdit, setSavingSponsorEdit] = useState(false);

  // Requirement 1: Admin Schedule Inline CRUD Modal State
  const [adminScheduleModal, setAdminScheduleModal] = useState<ScheduleItem | null>(null);
  const [scheduleEditTitle, setScheduleEditTitle] = useState('');
  const [scheduleEditDate, setScheduleEditDate] = useState('');
  const [scheduleEditLocation, setScheduleEditLocation] = useState('');
  const [scheduleEditStatus, setScheduleEditStatus] = useState('진행 중');
  const [scheduleEditParticipants, setScheduleEditParticipants] = useState('');
  const [scheduleEditHighlight, setScheduleEditHighlight] = useState(false);
  const [savingScheduleEdit, setSavingScheduleEdit] = useState(false);

  // Admin CMS Form State
  const [showCmsForm, setShowCmsForm] = useState(false);
  const [cmsCategory, setCmsCategory] = useState<'공지사항' | '향후 대회 일정' | '스폰서/파트너십'>('공지사항');
  const [cmsTitle, setCmsTitle] = useState('');
  const [cmsContent, setCmsContent] = useState('');
  const [cmsLink, setCmsLink] = useState('');
  const [cmsPinned, setCmsPinned] = useState(false);
  const [submittingCms, setSubmittingCms] = useState(false);

  // General CMS Post Edit Modal State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editCategory, setEditCategory] = useState<'공지사항' | '향후 대회 일정' | '스폰서/파트너십'>('공지사항');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Default Sponsor Items
  const defaultSponsors: SponsorItem[] = [
    {
      id: 'edaily',
      name: '이데일리 (eDaily)',
      tagline: '대한민국 대표 종합 경제지',
      description: '이데일리 컵 "1회 women Tournament"의 메인 후원사로, 대한민국 여성 스포츠 저변 확대 및 건강한 스포츠 문화 조성을 지원합니다.',
      logo: '📰',
      bannerBg: 'from-amber-600/30 to-orange-900/40',
      badge: 'MAIN SPONSOR',
      link: 'https://www.edaily.co.kr'
    },
    {
      id: 'tsa-gear',
      name: 'TSA SPORT GEAR',
      tagline: '공식 스포츠 용품 & 유니폼 파트너',
      description: 'TSA 전용 최고급 여성 스포츠웨어 및 대회 공식 경기구를 제공합니다. 참가팀 전원 20% 유니폼 할인 쿠폰 제공!',
      logo: '⚽',
      bannerBg: 'from-blue-600/30 to-slate-900/40',
      badge: 'OFFICIAL PARTNER',
      link: 'https://tntsports.co.kr'
    },
    {
      id: 'haenuri',
      name: '해누리체육공원',
      tagline: '최상급 인조잔디 특설 구장',
      description: '쾌적한 관람석과 주차 시설, 최첨단 조명 시설을 갖춘 "1회 women Tournament" 지정 경기장입니다.',
      logo: '🏟️',
      bannerBg: 'from-emerald-600/30 to-slate-900/40',
      badge: 'VENUE PARTNER'
    }
  ];

  // Merge DB Sponsor Posts into Sponsor Items
  const dbSponsorPosts = (posts || []).filter(p => p.category === '스폰서/파트너십');
  const mergedSponsors: SponsorItem[] = [
    ...defaultSponsors,
    ...dbSponsorPosts.map(p => ({
      id: p.id,
      dbPostId: p.id,
      name: p.title,
      tagline: '공식 후원 및 파트너사',
      description: p.content,
      logo: '🤝',
      bannerBg: 'from-orange-600/30 to-slate-900/40',
      badge: 'SPONSOR PARTNER',
      link: p.link
    }))
  ];

  // Default Schedule Items
  const defaultSchedule: ScheduleItem[] = [
    {
      id: '1',
      title: '1회 women Tournament (이데일리 컵)',
      date: '2026. 10. 01 ~ 10. 15',
      location: '해누리체육공원 풋살장',
      status: '진행 중',
      participants: '총 48개 팀 (1조 ~ 6조)',
      highlight: true
    },
    {
      id: '2',
      title: 'TSA 윈터 마스터즈 챔피언십',
      date: '2026. 12. 05 ~ 12. 20',
      location: 'TSA 메인 실내 에어돔구장',
      status: '접수 예정',
      participants: '선착순 32개 팀 모집 예정',
      highlight: false
    },
    {
      id: '3',
      title: '2027 TSA 전국 아마추어 유소년/여성 리그',
      date: '2027. 03. 10 ~ 04. 30',
      location: '서울/경기 주요 체육공원',
      status: '기획 중',
      participants: '전국 단위 클럽 대항전',
      highlight: false
    }
  ];

  // Merge DB Schedule Posts into Schedule Items
  const dbSchedulePosts = (posts || []).filter(p => p.category === '향후 대회 일정');
  const mergedSchedule: ScheduleItem[] = [
    ...defaultSchedule,
    ...dbSchedulePosts.map(p => ({
      id: p.id,
      dbPostId: p.id,
      title: p.title,
      date: '일정 확인',
      location: 'TSA 지정 구장',
      status: p.is_pinned ? '주요 대회' : '접수 예정',
      participants: p.content,
      highlight: !!p.is_pinned
    }))
  ];

  // Requirement 1: Click Handler for Schedule Box (Admin Inline CRUD)
  const handleScheduleClick = (item: ScheduleItem) => {
    if (isAdmin) {
      setAdminScheduleModal(item);
      setScheduleEditTitle(item.title);
      setScheduleEditDate(item.date);
      setScheduleEditLocation(item.location);
      setScheduleEditStatus(item.status);
      setScheduleEditParticipants(item.participants);
      setScheduleEditHighlight(!!item.highlight);
    }
  };

  // Save Admin Schedule Edit
  const handleSaveAdminSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminScheduleModal || !scheduleEditTitle.trim()) return;

    try {
      setSavingScheduleEdit(true);
      const combinedContent = `일시: ${scheduleEditDate}\n장소: ${scheduleEditLocation}\n참가: ${scheduleEditParticipants}`;

      if (adminScheduleModal.dbPostId) {
        await editPost(adminScheduleModal.dbPostId, {
          category: '향후 대회 일정',
          title: scheduleEditTitle.trim(),
          content: combinedContent,
          is_pinned: scheduleEditHighlight
        });
      } else {
        await addPost({
          category: '향후 대회 일정',
          title: scheduleEditTitle.trim(),
          content: combinedContent,
          is_pinned: scheduleEditHighlight
        });
      }
      setAdminScheduleModal(null);
      alert(`[${scheduleEditTitle.trim()}] 대회 일정이 저장되었습니다!`);
    } catch (err) {
      console.error('Error saving schedule edit:', err);
      alert('대회 일정 저장에 실패했습니다.');
    } finally {
      setSavingScheduleEdit(false);
    }
  };

  // Delete Admin Schedule with Browser confirm()
  const handleDeleteAdminSchedule = async () => {
    if (!adminScheduleModal) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      setSavingScheduleEdit(true);
      if (adminScheduleModal.dbPostId) {
        await removePost(adminScheduleModal.dbPostId);
      }
      setAdminScheduleModal(null);
      alert('대회 일정이 완전 삭제되었습니다.');
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('대회 일정 삭제에 실패했습니다.');
    } finally {
      setSavingScheduleEdit(false);
    }
  };

  // Click Handler for Sponsor Box based on role
  const handleSponsorClick = (sponsor: SponsorItem) => {
    if (isAdmin) {
      setAdminSponsorModal(sponsor);
      setSponsorEditName(sponsor.name);
      setSponsorEditBadge(sponsor.badge || 'OFFICIAL SPONSOR');
      setSponsorEditDescription(sponsor.description);
      setSponsorEditLink(sponsor.link || '');
    } else {
      if (sponsor.link && sponsor.link.trim() !== '') {
        window.open(sponsor.link, '_blank', 'noopener,noreferrer');
      } else {
        setSelectedSponsor(sponsor);
      }
    }
  };

  // Save Admin Sponsor Edit
  const handleSaveAdminSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSponsorModal || !sponsorEditName.trim() || !sponsorEditDescription.trim()) return;

    try {
      setSavingSponsorEdit(true);
      if (adminSponsorModal.dbPostId) {
        await editPost(adminSponsorModal.dbPostId, {
          category: '스폰서/파트너십',
          title: sponsorEditName.trim(),
          content: sponsorEditDescription.trim(),
          link: sponsorEditLink.trim() || undefined
        });
      } else {
        await addPost({
          category: '스폰서/파트너십',
          title: sponsorEditName.trim(),
          content: sponsorEditDescription.trim(),
          link: sponsorEditLink.trim() || undefined
        });
      }
      setAdminSponsorModal(null);
      alert(`[${sponsorEditName.trim()}] 스폰서 정보가 저장되었습니다!`);
    } catch (err) {
      console.error('Error saving sponsor edit:', err);
      alert('스폰서 정보 저장에 실패했습니다.');
    } finally {
      setSavingSponsorEdit(false);
    }
  };

  // Delete Admin Sponsor with Browser confirm()
  const handleDeleteAdminSponsor = async () => {
    if (!adminSponsorModal) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      setSavingSponsorEdit(true);
      if (adminSponsorModal.dbPostId) {
        await removePost(adminSponsorModal.dbPostId);
      }
      setAdminSponsorModal(null);
      alert('스폰서 정보가 완전 삭제되었습니다.');
    } catch (err) {
      console.error('Error deleting sponsor:', err);
      alert('스폰서 삭제에 실패했습니다.');
    } finally {
      setSavingSponsorEdit(false);
    }
  };

  // Create CMS Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmsTitle.trim() || !cmsContent.trim()) return;
    try {
      setSubmittingCms(true);
      await addPost({
        category: cmsCategory,
        title: cmsTitle.trim(),
        content: cmsContent.trim(),
        link: cmsLink.trim() || undefined,
        is_pinned: cmsPinned
      });
      setCmsTitle('');
      setCmsContent('');
      setCmsLink('');
      setCmsPinned(false);
      setShowCmsForm(false);
      alert('CMS 게시글이 등록되었습니다!');
    } catch (err) {
      console.error('Error adding CMS post:', err);
      alert('게시글 등록에 실패했습니다.');
    } finally {
      setSubmittingCms(false);
    }
  };

  const handleOpenEditPost = (post: Post) => {
    setEditingPost(post);
    setEditCategory((post.category as any) || '공지사항');
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditLink(post.link || '');
    setEditPinned(!!post.is_pinned);
  };

  const handleSaveEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editTitle.trim() || !editContent.trim()) return;
    try {
      setSubmittingEdit(true);
      await editPost(editingPost.id, {
        category: editCategory,
        title: editTitle.trim(),
        content: editContent.trim(),
        link: editLink.trim() || undefined,
        is_pinned: editPinned
      });
      setEditingPost(null);
      alert('게시글이 성공적으로 수정되었습니다.');
    } catch (err) {
      console.error('Error editing post:', err);
      alert('게시글 수정에 실패했습니다.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await removePost(id);
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-4">
      {/* Requirement 2: Hero Welcome Banner rendered on Regular User Home Screen */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-6 border border-orange-500/30 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/30">
        <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-15">
          <Trophy className="w-48 h-48 text-orange-500" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md">
              이데일리 컵
            </span>
            <span className="text-xs text-orange-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> OFFICIAL PLATFORM
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight font-sports">
            1회 women Tournament
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
            TSA 공식 스포츠 대회 플랫폼에 오신 것을 환영합니다! 조별 순위, 경기 일정 및 팀 전적을 실시간으로 확인하세요.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('standings')}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/25 active-press transition-all flex items-center space-x-1.5"
            >
              <Award className="w-4 h-4" />
              <span>조별 순위 보기</span>
            </button>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 active-press transition-all flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>경기 일정 확인</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin CMS Creation Box (Persists for Admin User across all tab switches) */}
      {isAdmin && (
        <div className="glass-panel rounded-2xl p-5 border border-orange-500/40 bg-slate-900/90 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-orange-400" />
                <span>[어드민] 홈 CMS 게시글 등록 폼</span>
              </h3>
            </div>
            <button
              onClick={() => setShowCmsForm(!showCmsForm)}
              className="px-3 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-bold transition-all border border-orange-500/30 flex items-center gap-1"
            >
              {showCmsForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{showCmsForm ? '닫기' : '새 게시글 작성'}</span>
            </button>
          </div>

          {showCmsForm && (
            <form onSubmit={handleCreatePost} className="space-y-3 text-xs pt-2 border-t border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">카테고리</label>
                  <select
                    value={cmsCategory}
                    onChange={(e) => setCmsCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="공지사항">📢 공지사항</option>
                    <option value="향후 대회 일정">🏆 향후 대회 일정</option>
                    <option value="스폰서/파트너십">🤝 스폰서/파트너십</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">게시글 제목</label>
                  <input
                    type="text"
                    required
                    placeholder="제목을 입력하세요..."
                    value={cmsTitle}
                    onChange={(e) => setCmsTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {cmsCategory === '스폰서/파트너십' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-amber-400">
                      <LinkIcon className="w-3.5 h-3.5" /> 스폰서 홈페이지 링크 (URL)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">* 클릭 시 이동할 URL</span>
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
                <label className="block text-slate-300 font-semibold mb-1">상세 내용</label>
                <textarea
                  required
                  rows={3}
                  placeholder="게시글 상세 내용을 입력하세요..."
                  value={cmsContent}
                  onChange={(e) => setCmsContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={cmsPinned}
                    onChange={(e) => setCmsPinned(e.target.checked)}
                    className="w-4 h-4 accent-orange-500 rounded"
                  />
                  <span>상단 중요 고정</span>
                </label>

                <button
                  type="submit"
                  disabled={submittingCms}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all flex items-center space-x-1.5 shadow-md"
                >
                  {submittingCms ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>게시글 등록</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Requirement 1: SECTION 1: 향후 TSA 대회 일정 (Upcoming Schedule Box with Admin Inline CRUD) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-5 bg-orange-500 rounded-full" />
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>향후 TSA 대회 일정</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-400">
                SCHEDULE
              </span>
            </h3>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-bold text-orange-400 bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded-full">
              관리자 모드: 일정 박스 클릭 시 수정/삭제
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {mergedSchedule.map((item) => (
            <div
              key={item.id}
              onClick={() => handleScheduleClick(item)}
              className={`glass-panel rounded-2xl p-4 border transition-all ${
                isAdmin ? 'cursor-pointer hover:border-orange-500/60' : 'hover:border-slate-700'
              } ${
                item.highlight
                  ? 'border-orange-500/40 bg-gradient-to-r from-orange-500/10 via-slate-900 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.highlight
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 mt-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{item.participants} ({item.location})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isAdmin ? (
                    <span className="px-2.5 py-1 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold flex items-center gap-1 shadow-md">
                      <Edit className="w-3.5 h-3.5" />
                      <span>수정/삭제</span>
                    </span>
                  ) : item.highlight ? (
                    <Flame className="w-5 h-5 text-orange-500 animate-bounce flex-shrink-0" />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: 스폰서 홍보용 게시글/배너 리스트 (Role-based actions & Inline CRUD) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-5 bg-amber-500 rounded-full" />
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>스폰서 홍보 & 파트너십</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                SPONSORS
              </span>
            </h3>
          </div>
          {isAdmin && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
              관리자 모드: 박스 클릭 시 수정/삭제
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {mergedSponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              onClick={() => handleSponsorClick(sponsor)}
              className={`glass-panel rounded-2xl p-4 border border-slate-800 hover:border-amber-500/50 bg-gradient-to-r ${sponsor.bannerBg} transition-all cursor-pointer group shadow-lg relative`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform flex-shrink-0">
                    {sponsor.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase block">
                        {sponsor.badge}
                      </span>
                      {sponsor.link && (
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                          <LinkIcon className="w-2.5 h-2.5 text-amber-400" />
                          <span>링크보유</span>
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                      {sponsor.name}
                    </h4>
                    <p className="text-xs text-slate-300 truncate">{sponsor.tagline || sponsor.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {isAdmin ? (
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md">
                      <Edit className="w-3.5 h-3.5" />
                      <span>수정/삭제</span>
                    </span>
                  ) : sponsor.link ? (
                    <span className="p-2 rounded-xl bg-slate-900/80 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-400 transition-all">
                      <ExternalLink className="w-4 h-4" />
                    </span>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic CMS Posts Section (for General / Announcement posts) */}
      {posts && posts.filter(p => p.category !== '스폰서/파트너십' && p.category !== '향후 대회 일정').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-5 bg-orange-500 rounded-full" />
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>최신 공지 및 기타 소식</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-[10px] font-semibold text-orange-400">
                CMS UPDATES
              </span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {posts.filter(p => p.category !== '스폰서/파트너십' && p.category !== '향후 대회 일정').map((post) => (
              <div
                key={post.id}
                className="glass-panel rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all space-y-2 relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white">
                        {post.category || '공지'}
                      </span>
                      <span className="text-xs font-bold text-white">{post.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditPost(post)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                        title="수정"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Requirement 1: Admin Schedule Inline CRUD Modal Popup */}
      {adminScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-orange-500/40 shadow-2xl space-y-4 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-orange-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">[어드민] 향후 대회 일정 수정 / 삭제</h3>
              </div>
              <button
                onClick={() => setAdminScheduleModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">대회 명칭 / 제목</label>
                <input
                  type="text"
                  required
                  value={scheduleEditTitle}
                  onChange={(e) => setScheduleEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">대회 일시</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 2026. 10. 01 ~ 10. 15"
                    value={scheduleEditDate}
                    onChange={(e) => setScheduleEditDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">진행 상태</label>
                  <select
                    value={scheduleEditStatus}
                    onChange={(e) => setScheduleEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="진행 중">🔥 진행 중</option>
                    <option value="접수 예정">📢 접수 예정</option>
                    <option value="기획 중">📝 기획 중</option>
                    <option value="종료">🏁 종료</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">경기 장소</label>
                <input
                  type="text"
                  required
                  placeholder="예: 해누리체육공원 풋살장"
                  value={scheduleEditLocation}
                  onChange={(e) => setScheduleEditLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">참가 규모 및 안내사항</label>
                <textarea
                  required
                  rows={3}
                  placeholder="예: 선착순 32개 팀 모집 예정"
                  value={scheduleEditParticipants}
                  onChange={(e) => setScheduleEditParticipants(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="scheduleHighlight"
                  checked={scheduleEditHighlight}
                  onChange={(e) => setScheduleEditHighlight(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
                <label htmlFor="scheduleHighlight" className="text-slate-300 font-medium cursor-pointer">
                  주요 대회 강조 (불꽃 애니메이션 표시)
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleDeleteAdminSchedule}
                  disabled={savingScheduleEdit}
                  className="px-3 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold flex items-center space-x-1 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>일정 삭제</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAdminScheduleModal(null)}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={savingScheduleEdit}
                    className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center space-x-1 shadow-md"
                  >
                    {savingScheduleEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>수정 완료</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Sponsor Inline CRUD Modal Popup */}
      {adminSponsorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-amber-500/40 shadow-2xl space-y-4 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">[어드민] 스폰서 수정 / 삭제</h3>
              </div>
              <button
                onClick={() => setAdminSponsorModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminSponsor} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">스폰서 명칭 / 제목</label>
                <input
                  type="text"
                  required
                  value={sponsorEditName}
                  onChange={(e) => setSponsorEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">뱃지 (예: MAIN SPONSOR, OFFICIAL PARTNER)</label>
                <input
                  type="text"
                  value={sponsorEditBadge}
                  onChange={(e) => setSponsorEditBadge(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <LinkIcon className="w-3.5 h-3.5" /> 홈페이지 링크 (URL)
                  </span>
                  <span className="text-[10px] text-slate-400">* 유저 클릭 시 새 창 이동</span>
                </label>
                <input
                  type="url"
                  placeholder="예: https://www.edaily.co.kr"
                  value={sponsorEditLink}
                  onChange={(e) => setSponsorEditLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">상세 소개 / 설명 내용</label>
                <textarea
                  required
                  rows={3}
                  value={sponsorEditDescription}
                  onChange={(e) => setSponsorEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-between pt-3 gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleDeleteAdminSponsor}
                  disabled={savingSponsorEdit}
                  className="px-3 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold flex items-center space-x-1 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>스폰서 삭제</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setAdminSponsorModal(null)}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={savingSponsorEdit}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center space-x-1 shadow-md"
                  >
                    {savingSponsorEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>수정 완료</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* General CMS Post Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-orange-500" />
                <span>CMS 게시글 수정</span>
              </h3>
              <button
                onClick={() => setEditingPost(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPost} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">카테고리</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="공지사항">공지사항</option>
                  <option value="향후 대회 일정">향후 대회 일정</option>
                  <option value="스폰서/파트너십">스폰서/파트너십</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {editCategory === '스폰서/파트너십' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <LinkIcon className="w-3.5 h-3.5" /> 홈페이지 링크 (URL)
                    </span>
                    <span className="text-[10px] text-slate-400">* 선택 사항</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.edaily.co.kr"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">상세 내용</label>
                <textarea
                  required
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="editPinned"
                  checked={editPinned}
                  onChange={(e) => setEditPinned(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
                <label htmlFor="editPinned" className="text-slate-300 font-medium cursor-pointer">
                  상단 중요 고정
                </label>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all flex items-center justify-center space-x-1"
                >
                  {submittingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>수정 저장</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regular User Sponsor Detail Modal */}
      {selectedSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">{selectedSponsor.logo}</span>
                <div>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">
                    {selectedSponsor.badge}
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedSponsor.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedSponsor(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedSponsor.description}
              </p>

              {selectedSponsor.link && (
                <a
                  href={selectedSponsor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md mt-2"
                >
                  <span>스폰서 공식 홈페이지 방문</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={() => setSelectedSponsor(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
