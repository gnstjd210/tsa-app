import React, { useState } from 'react';
import { Megaphone, Pin, Plus, Search, Trash2, Edit, Sparkles, Loader2, Calendar } from 'lucide-react';
import { useSupabaseData } from '../../context/SupabaseContext';
import type { Announcement } from '../../lib/supabase';

interface AnnouncementsTabProps {
  isAdmin?: boolean;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = ({ isAdmin = false }) => {
  const { announcements, loading, addAnnouncement, editAnnouncement, removeAnnouncement } = useSupabaseData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingItem(null);
    setTitle('');
    setContent('');
    setIsPinned(false);
    setShowModal(true);
  };

  const openEditModal = (item: Announcement) => {
    setEditingItem(item);
    setTitle(item.title);
    setContent(item.content);
    setIsPinned(!!item.is_pinned);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    try {
      setSubmitting(true);
      if (editingItem) {
        await editAnnouncement(editingItem.id, title, content, isPinned);
      } else {
        await addAnnouncement(title, content, isPinned);
      }
      setTitle('');
      setContent('');
      setIsPinned(false);
      setEditingItem(null);
      setShowModal(false);
    } catch (err) {
      console.error('Error saving announcement:', err);
      alert('공지사항 저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await removeAnnouncement(id);
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const filtered = announcements.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Header Banner */}
      <div className="w-full glass-panel rounded-2xl p-5 border-l-4 border-l-orange-500 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>대회 공식 안내</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">공지사항 (Announcements)</h2>
            <p className="text-xs text-slate-400 mt-1">대회 규칙, 대진표 변경 및 주요 공지사항을 실시간 확인하세요.</p>
          </div>

          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 active-press transition-all flex items-center justify-center space-x-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>공지사항 작성 (어드민)</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Filter Box */}
      <div className="w-full relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="공지사항 제목 또는 내용 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
        />
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="w-full py-16 text-center text-slate-400 flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-2" />
          <span className="text-xs">Supabase에서 공지사항을 불러오는 중...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="w-full glass-panel rounded-2xl p-8 text-center border border-slate-800">
          <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">등록된 공지사항이 없습니다.</p>
          <p className="text-xs text-slate-500 mt-1">새로운 공지사항을 확인해 보세요.</p>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {filtered.map((announcement) => (
            <div
              key={announcement.id}
              className={`w-full glass-panel rounded-2xl p-4 transition-all hover:border-slate-700 relative group ${
                announcement.is_pinned
                  ? 'border-orange-500/50 bg-gradient-to-r from-orange-500/10 via-slate-900 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
                    {announcement.is_pinned && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                        <Pin className="w-3 h-3 fill-current" />
                        <span>중요 고정</span>
                      </span>
                    )}
                    <span className="inline-flex items-center space-x-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{announcement.created_at ? new Date(announcement.created_at).toLocaleDateString('ko-KR') : '방금 전'}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {announcement.title}
                  </h3>
                  <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                    {announcement.content}
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(announcement)}
                      className="opacity-70 hover:opacity-100 p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-all flex items-center space-x-1 text-xs font-semibold"
                      title="수정"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="opacity-70 hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all flex items-center space-x-1 text-xs font-semibold"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-orange-500" />
                <span>{editingItem ? '공지사항 수정' : '새 공지사항 작성'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">공지 제목</label>
                <input
                  type="text"
                  required
                  placeholder="예: [안내] 1조 경기장 변경 건"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">상세 내용</label>
                <textarea
                  required
                  rows={4}
                  placeholder="공지할 상세 내용을 입력하세요..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
                <label htmlFor="isPinned" className="text-slate-300 font-medium cursor-pointer">
                  상단에 주요 공지로 고정하기
                </label>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all flex items-center justify-center space-x-1"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{editingItem ? '수정 완료' : '작성 완료'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
