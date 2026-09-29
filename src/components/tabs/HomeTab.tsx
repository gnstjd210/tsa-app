import React, { useState } from 'react';
import { Calendar, ExternalLink, Flame, Sparkles, ChevronRight, Award, Trophy, Users, X, Edit, Trash2, Plus, Megaphone, Loader2, Save } from 'lucide-react';
import { useSupabaseData } from '../../context/SupabaseContext';
import type { Post } from '../../lib/supabase';

interface SponsorItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  bannerBg: string;
  link?: string;
  badge: string;
}

interface HomeTabProps {
  onNavigateTab: (tab: any) => void;
  isAdmin?: boolean;
}

export const HomeTab: React.FC<HomeTabProps> = ({ onNavigateTab, isAdmin = false }) => {
  const { posts, addPost, editPost, removePost } = useSupabaseData();
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorItem | null>(null);

  // Admin CMS Form State
  const [showCmsForm, setShowCmsForm] = useState(false);
  const [cmsCategory, setCmsCategory] = useState<'공지사항' | '향후 대회 일정' | '스폰서/파트너십'>('공지사항');
  const [cmsTitle, setCmsTitle] = useState('');
  const [cmsContent, setCmsContent] = useState('');
  const [cmsPinned, setCmsPinned] = useState(false);
  const [submittingCms, setSubmittingCms] = useState(false);

  // Edit CMS Post Modal State
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editCategory, setEditCategory] = useState<'공지사항' | '향후 대회 일정' | '스폰서/파트너십'>('공지사항');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPinned, setEditPinned] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmsTitle.trim() || !cmsContent.trim()) return;
    try {
      setSubmittingCms(true);
      await addPost({
        category: cmsCategory,
        title: cmsTitle,
        content: cmsContent,
        is_pinned: cmsPinned
      });
      setCmsTitle('');
      setCmsContent('');
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
    setEditPinned(!!post.is_pinned);
  };

  const handleSaveEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost || !editTitle.trim() || !editContent.trim()) return;
    try {
      setSubmittingEdit(true);
      await editPost(editingPost.id, {
        category: editCategory,
        title: editTitle,
        content: editContent,
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

  // Default Mock Schedule
  const upcomingSchedule = [
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

  // Default Sponsor List
  const sponsors: SponsorItem[] = [
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

  return (
    <div className="space-y-6 animate-fadeIn pb-4">
      {/* Hero Welcome Banner */}
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="공지사항">공지사항</option>
                    <option value="향후 대회 일정">향후 대회 일정</option>
                    <option value="스폰서/파트너십">스폰서/파트너십</option>
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

      {/* Dynamic CMS Posts Section (If posts exist in DB) */}
      {posts && posts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-5 bg-orange-500 rounded-full" />
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>최신 게시글 & 소식</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-[10px] font-semibold text-orange-400">
                CMS UPDATES
              </span>
            </h3>
          </div>

          <div className="space-y-2.5">
            {posts.map((post) => (
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

      {/* SECTION 1: 향후 TSA 대회 일정 (Upcoming Schedule Box) */}
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
        </div>

        <div className="space-y-2.5">
          {upcomingSchedule.map((item) => (
            <div
              key={item.id}
              className={`glass-panel rounded-2xl p-4 border transition-all hover:border-slate-700 ${
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

                {item.highlight && (
                  <Flame className="w-5 h-5 text-orange-500 animate-bounce flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: 스폰서 홍보용 게시글/배너 리스트 */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-5 bg-amber-500 rounded-full" />
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>스폰서 홍보 & 파트너십</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
              SPONSORS
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              onClick={() => setSelectedSponsor(sponsor)}
              className={`glass-panel rounded-2xl p-4 border border-slate-800 hover:border-amber-500/50 bg-gradient-to-r ${sponsor.bannerBg} transition-all cursor-pointer group shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                    {sponsor.logo}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase block mb-0.5">
                      {sponsor.badge}
                    </span>
                    <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {sponsor.name}
                    </h4>
                    <p className="text-xs text-slate-300">{sponsor.tagline}</p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit CMS Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
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
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">상세 내용</label>
                <textarea
                  required
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
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

      {/* Sponsor Detail Modal */}
      {selectedSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
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
