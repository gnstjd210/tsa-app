import React, { useState, useRef, useEffect } from 'react';
import { Plus, Users, X, Loader2, Camera, Image as ImageIcon, Shield, CheckCircle2 } from 'lucide-react';
import { useSupabaseData } from '../context/SupabaseContext';
import { formatGroupName } from '../lib/dataService';

interface OfficialTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialTeamModal: React.FC<OfficialTeamModalProps> = ({ isOpen, onClose }) => {
  const { teams: rawTeams, groups, addTeam, addGroup, mapTeamToGroup } = useSupabaseData();

  // Mode Selection: 'create' (New Team) vs 'assign' (Assign Existing Team) vs 'emptyGroup' (Empty Group Creation)
  const [selectedTeamMode, setSelectedTeamMode] = useState<'create' | 'assign' | 'none'>('create');
  
  // State for team creation
  const [teamName, setTeamName] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(''); // For existing team
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  
  // State for new empty group creation
  const [showAddGroupInput, setShowAddGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingGroup, setSubmittingGroup] = useState(false);

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [croppedImageBase64, setCroppedImageBase64] = useState<string>('');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
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

  // Requirement 1: Empty Group Creation First logic
  const handleAddNewGroupOnly = async () => {
    if (!newGroupName.trim()) return;
    try {
      setSubmittingGroup(true);
      const formattedName = formatGroupName(newGroupName.trim());
      const createdGroup = await addGroup(formattedName);
      setNewGroupName('');
      setShowAddGroupInput(false);
      if (createdGroup) {
        setSelectedGroupId(createdGroup.id);
      }
      alert(`[${formattedName}] 빈 조가 성공적으로 생성되었습니다! (팀은 나중에 배정 가능합니다)`);
    } catch (err) {
      console.error('Error adding empty group:', err);
      alert('조 생성에 실패했습니다.');
    } finally {
      setSubmittingGroup(false);
    }
  };

  // Submit Official Team Registration or Assignment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      if (selectedTeamMode === 'none') {
        // Only adding empty group if input filled
        if (newGroupName.trim()) {
          await handleAddNewGroupOnly();
          onClose();
          return;
        } else {
          alert('생성할 신규 조 이름을 입력해주세요 (예: 7조)');
          return;
        }
      }

      if (selectedTeamMode === 'create') {
        if (!teamName.trim()) {
          alert('등록할 신규 팀 이름을 입력하세요.');
          return;
        }
        await addTeam(teamName.trim(), croppedImageBase64 || '', selectedGroupId || (groups[0]?.id));
        alert(`[${teamName.trim()}] 공식 참가팀이 생성되고 [${formatGroupName(groups.find(g => g.id === selectedGroupId)?.name)}]에 등록되었습니다!`);
      } else if (selectedTeamMode === 'assign') {
        if (!selectedTeamId || !selectedGroupId) {
          alert('배정할 팀과 조를 선택해주세요.');
          return;
        }
        await mapTeamToGroup(selectedTeamId, selectedGroupId);
        const targetTeam = rawTeams.find(t => t.id === selectedTeamId);
        const targetGroup = groups.find(g => g.id === selectedGroupId);
        alert(`[${targetTeam?.name || '팀'}] 이(가) [${formatGroupName(targetGroup?.name)}] 조에 배정되었습니다!`);
      }

      setTeamName('');
      setUploadedImageSrc(null);
      setCroppedImageBase64('');
      onClose();
    } catch (err) {
      console.error('Error submitting official team form:', err);
      alert('공식 참가팀 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-2xl p-5 border border-purple-500/40 shadow-2xl space-y-4 bg-slate-900 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-purple-400 font-bold text-base">
            <Users className="w-5 h-5 text-purple-400" />
            <span>공식 참가팀 등록 & 조 생성</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Requirement 1: Mode Selection (Create New Team / Assign Existing Team / Empty Group First) */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-bold">참가팀 선택 방식</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTeamMode('create')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                  selectedTeamMode === 'create'
                    ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                + 새 팀 등록
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeamMode('assign')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                  selectedTeamMode === 'assign'
                    ? 'bg-amber-600 text-white border-amber-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                기존 팀 조 배정
              </button>
              <button
                type="button"
                onClick={() => setSelectedTeamMode('none')}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all text-center ${
                  selectedTeamMode === 'none'
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                해당 없음 (빈 조만 생성)
              </button>
            </div>
          </div>

          {/* Mode 1: Create New Team */}
          {selectedTeamMode === 'create' && (
            <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-purple-500/30">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">신규 팀 이름</label>
                <input
                  type="text"
                  required
                  placeholder="예: TSA 우먼스 FC"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Logo Photo Upload */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-purple-400" />
                  <span>팀 로고 업로드</span>
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
                  className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500 text-slate-300 font-semibold flex items-center justify-center space-x-2 active-press transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <span>{uploadedImageSrc ? '다른 사진 선택' : '사진첩에서 로고 선택'}</span>
                </button>

                {uploadedImageSrc && (
                  <div className="p-2 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center">
                    <canvas
                      ref={canvasRef}
                      className="w-24 h-24 rounded-2xl border-2 border-purple-500/60 shadow-lg object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Existing Team Selection */}
          {selectedTeamMode === 'assign' && (
            <div className="p-3 bg-slate-950 rounded-xl border border-amber-500/30 space-y-2">
              <label className="block text-slate-300 font-semibold">기존 팀 목록 선택</label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
              >
                <option value="">-- 참가팀 선택 --</option>
                {rawTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode 3: Empty Group Only (No Team) */}
          {selectedTeamMode === 'none' && (
            <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 text-cyan-300">
              <p className="text-[11px] leading-relaxed">
                💡 <strong>해당 없음 선택됨:</strong> 팀 선택 없이 먼저 1조, 2조, 7조 등 빈 조(Group)만 자유롭게 생성할 수 있습니다. 팀 배정은 나중에 언제든지 진행하실 수 있습니다.
              </p>
            </div>
          )}

          {/* Group Selection & Empty Group Creation First (Requirement 1) */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">소속 조 선택 및 생성</label>
              <button
                type="button"
                onClick={() => setShowAddGroupInput(!showAddGroupInput)}
                className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[11px] font-extrabold flex items-center space-x-1 active-press transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ 빈 조 신규 추가</span>
              </button>
            </div>

            {/* Empty Group Creation Input */}
            {showAddGroupInput && (
              <div className="flex space-x-2 p-2 bg-slate-950 rounded-xl border border-amber-500/50 animate-fadeIn">
                <input
                  type="text"
                  placeholder="예: 7조, 8조"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  disabled={submittingGroup || !newGroupName.trim()}
                  onClick={handleAddNewGroupOnly}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-extrabold text-xs flex items-center space-x-1"
                >
                  {submittingGroup ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>+ 조 생성</span>}
                </button>
              </div>
            )}

            {selectedTeamMode !== 'none' && (
              <select
                required
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-bold"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {formatGroupName(g.name)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition-all flex items-center justify-center space-x-1 shadow-md"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>공식 참가팀 등록 완료</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
