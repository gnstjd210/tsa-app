import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Trophy, GitFork, Shield, ChevronRight, Sparkles, LayoutGrid, ArrowUp, ArrowLeftRight } from 'lucide-react';
import { useSupabaseData } from '../context/SupabaseContext';

export interface BracketMatch {
  id: string;
  round: number; // 1: 예선/8강, 2: 준결승/4강, 3: 결승전
  roundTitle: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  dateStr?: string;
  fieldStr?: string;
  side?: 'left' | 'right' | 'center'; // 가로형 뷰를 위한 좌/우/중앙 구분
}

export interface BracketBoard {
  id: string;
  title: string;
  matches: BracketMatch[];
}

interface PlayoffBracketModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export const PlayoffBracketModal: React.FC<PlayoffBracketModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false
}) => {
  const { teams: rawTeams } = useSupabaseData();

  // Requirement 2: View Mode Toggle State (horizontal vs vertical)
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');

  // Requirement 1 & 4: Multiple Bracket Boards State with LocalStorage Persistence
  const defaultBoards: BracketBoard[] = [
    {
      id: 'board-1',
      title: '1위~3위 대진표 (상위 토너먼트)',
      matches: [
        {
          id: 'b1-m1',
          round: 1,
          side: 'left',
          roundTitle: '예선 A조 (좌측 1경기)',
          homeTeamName: '1조 1위 (TSA 우먼스)',
          awayTeamName: '2조 2위 (이데일리 스타즈)',
          homeScore: 2,
          awayScore: 1,
          dateStr: '10월 14일 14:00'
        },
        {
          id: 'b1-m2',
          round: 1,
          side: 'right',
          roundTitle: '예선 B조 (우측 1경기)',
          homeTeamName: '3조 1위 (퀸즈 위너스)',
          awayTeamName: '4조 2위 (블랙팬서 W)',
          homeScore: 3,
          awayScore: 0,
          dateStr: '10월 14일 15:00'
        },
        {
          id: 'b1-m3',
          round: 2,
          side: 'left',
          roundTitle: '준결승 1경기 (Left Wing)',
          homeTeamName: 'TSA 우먼스',
          awayTeamName: '파닉스 레이디스',
          homeScore: 1,
          awayScore: 0,
          dateStr: '10월 15일 13:00'
        },
        {
          id: 'b1-m4',
          round: 2,
          side: 'right',
          roundTitle: '준결승 2경기 (Right Wing)',
          homeTeamName: '퀸즈 위너스',
          awayTeamName: '골든이글스 W',
          homeScore: 2,
          awayScore: 1,
          dateStr: '10월 15일 14:00'
        },
        {
          id: 'b1-m5',
          round: 3,
          side: 'center',
          roundTitle: '🏆 챔피언십 결승전 (Finals)',
          homeTeamName: 'TSA 우먼스',
          awayTeamName: '퀸즈 위너스',
          dateStr: '10월 15일 16:00',
          fieldStr: '해누리 1구장 메인'
        }
      ]
    },
    {
      id: 'board-2',
      title: '4위~6위 대진표 (순위결정전)',
      matches: [
        {
          id: 'b2-m1',
          round: 1,
          side: 'left',
          roundTitle: '5위/6위 결정 예선전',
          homeTeamName: '골든이글스 W',
          awayTeamName: '파닉스 레이디스',
          homeScore: 1,
          awayScore: 2,
          dateStr: '10월 14일 16:00'
        },
        {
          id: 'b2-m2',
          round: 2,
          side: 'center',
          roundTitle: '4위 순위 결정 최종전',
          homeTeamName: '파닉스 레이디스',
          awayTeamName: '이데일리 스타즈',
          dateStr: '10월 15일 11:00'
        }
      ]
    }
  ];

  const [boards, setBoards] = useState<BracketBoard[]>(() => {
    const saved = localStorage.getItem('tsa_multiple_bracket_boards');
    return saved ? JSON.parse(saved) : defaultBoards;
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(boards[0]?.id || 'board-1');

  useEffect(() => {
    localStorage.setItem('tsa_multiple_bracket_boards', JSON.stringify(boards));
  }, [boards]);

  if (!isOpen) return null;

  const currentBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  // Requirement 4: Add New Bracket Board
  const handleAddBoard = () => {
    const title = prompt('새로운 대진표 이름을 입력하세요 (예: 7위~9위 대진표, 여성부 2부 리그):');
    if (!title || !title.trim()) return;

    const newBoardId = `board_${Date.now()}`;
    const newBoard: BracketBoard = {
      id: newBoardId,
      title: title.trim(),
      matches: [
        {
          id: `m_${Date.now()}_1`,
          round: 1,
          side: 'left',
          roundTitle: '예선 1경기',
          homeTeamName: '참가팀 선택',
          awayTeamName: '참가팀 선택',
          dateStr: '일정 미정'
        },
        {
          id: `m_${Date.now()}_2`,
          round: 3,
          side: 'center',
          roundTitle: '🏆 결승전',
          homeTeamName: '참가팀 선택',
          awayTeamName: '참가팀 선택',
          dateStr: '일정 미정'
        }
      ]
    };

    setBoards([...boards, newBoard]);
    setActiveBoardId(newBoardId);
    alert(`[${title.trim()}] 대진표 판이 새롭게 생성되었습니다!`);
  };

  // Delete Bracket Board
  const handleDeleteBoard = (boardId: string) => {
    if (boards.length <= 1) {
      alert('최소 1개 이상의 대진표는 유지되어야 합니다.');
      return;
    }
    if (!window.confirm('이 대진표 판 전체를 삭제하시겠습니까?')) return;

    const updated = boards.filter(b => b.id !== boardId);
    setBoards(updated);
    setActiveBoardId(updated[0].id);
  };

  // Requirement 3: Auto-Balancing Add Team/Match Node Slot
  const handleAddMatchToBoard = () => {
    if (!currentBoard) return;

    // Calculate left vs right counts to auto-balance
    const leftMatches = currentBoard.matches.filter(m => m.side === 'left');
    const rightMatches = currentBoard.matches.filter(m => m.side === 'right');
    const assignedSide: 'left' | 'right' = leftMatches.length <= rightMatches.length ? 'left' : 'right';

    const newMatchId = `match_${Date.now()}`;
    const matchCount = currentBoard.matches.length + 1;

    const newMatch: BracketMatch = {
      id: newMatchId,
      round: 1,
      side: assignedSide,
      roundTitle: `예선 경기 (${assignedSide === 'left' ? '좌측' : '우측'} #${matchCount})`,
      homeTeamName: '참가팀 선택',
      awayTeamName: '참가팀 선택',
      dateStr: '일정 미정'
    };

    setBoards(prev => prev.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          matches: [...b.matches, newMatch]
        };
      }
      return b;
    }));
  };

  // Requirement 4: Delete Match Node
  const handleDeleteMatch = (matchId: string) => {
    if (!window.confirm('이 경기를 대진표에서 삭제하시겠습니까?')) return;
    setBoards(prev => prev.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          matches: b.matches.filter(m => m.id !== matchId)
        };
      }
      return b;
    }));
  };

  // Requirement 4: Update Team in Match
  const handleUpdateTeamInMatch = (matchId: string, side: 'home' | 'away', newTeamName: string) => {
    setBoards(prev => prev.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          matches: b.matches.map(m => {
            if (m.id === matchId) {
              return {
                ...m,
                [side === 'home' ? 'homeTeamName' : 'awayTeamName']: newTeamName
              };
            }
            return m;
          })
        };
      }
      return b;
    }));
  };

  const sortedTeams = [...rawTeams].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  // Split matches for layout
  const leftMatches = currentBoard.matches.filter(m => m.side === 'left');
  const rightMatches = currentBoard.matches.filter(m => m.side === 'right');
  const centerMatches = currentBoard.matches.filter(m => m.side === 'center' || m.round >= 3);

  // Vertical layout rounds
  const round1Matches = currentBoard.matches.filter(m => m.round === 1);
  const round2Matches = currentBoard.matches.filter(m => m.round === 2);
  const round3Matches = currentBoard.matches.filter(m => m.round >= 3);

  // Render a match card component
  const renderMatchCard = (m: BracketMatch, borderStyle: string = 'border-slate-800') => {
    const isFinal = m.round >= 3 || m.side === 'center';

    return (
      <div
        key={m.id}
        className={`glass-panel rounded-2xl p-3.5 border ${
          isFinal
            ? 'border-amber-500/70 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-950 shadow-2xl shadow-amber-500/10'
            : `${borderStyle} bg-slate-900/90 shadow-xl`
        } space-y-2 relative group min-w-[240px] transition-all hover:scale-[1.02]`}
      >
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
          <span className={`text-[10px] font-bold ${isFinal ? 'text-amber-400' : 'text-cyan-400'}`}>
            {m.roundTitle} {m.dateStr ? `(${m.dateStr})` : ''}
          </span>

          {isAdmin && (
            <button
              onClick={() => handleDeleteMatch(m.id)}
              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-colors"
              title="경기 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Home Team Slot */}
        <div className="flex items-center justify-between text-xs font-bold text-white">
          {isAdmin ? (
            <select
              value={m.homeTeamName}
              onChange={(e) => handleUpdateTeamInMatch(m.id, 'home', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none focus:border-cyan-500 truncate w-full mr-2"
            >
              <option value={m.homeTeamName}>{m.homeTeamName}</option>
              {sortedTeams.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          ) : (
            <span className="truncate flex-1">{m.homeTeamName}</span>
          )}
          <span className="text-orange-400 font-extrabold ml-1 flex-shrink-0">{m.homeScore ?? '-'}</span>
        </div>

        {/* Away Team Slot */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-t border-slate-800/60 pt-1.5">
          {isAdmin ? (
            <select
              value={m.awayTeamName}
              onChange={(e) => handleUpdateTeamInMatch(m.id, 'away', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none focus:border-cyan-500 truncate w-full mr-2"
            >
              <option value={m.awayTeamName}>{m.awayTeamName}</option>
              {sortedTeams.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          ) : (
            <span className="truncate flex-1">{m.awayTeamName}</span>
          )}
          <span className="text-slate-400 ml-1 flex-shrink-0">{m.awayScore ?? '-'}</span>
        </div>

        {m.fieldStr && (
          <div className="text-[9px] text-amber-300/80 text-center font-medium pt-1">
            📍 {m.fieldStr}
          </div>
        )}
      </div>
    );
  };

  return (
    // Requirement 1: Full-Screen Viewport Modal Popup (100% width & height)
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden animate-fadeIn">
      
      {/* Modal Top Navigation Header */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>TSA 공식 본선 대진표 풀스크린 시스템</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-extrabold text-[10px] tracking-wider uppercase">
                FULLSCREEN BUILDER
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {viewMode === 'horizontal' ? '월드컵 스타일: 좌/우 양끝 예선에서 중앙 결승전으로 집결' : '피라미드 스타일: 아래 예선에서 위 결승전으로 상승'}
            </p>
          </div>
        </div>

        {/* View Switch & Close */}
        <div className="flex items-center space-x-3">
          {/* Requirement 2: Dual View Mode Switch Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('horizontal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'horizontal'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">↔ 가로형 보기 (양끝→중앙)</span>
              <span className="sm:hidden">가로형</span>
            </button>

            <button
              onClick={() => setViewMode('vertical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'vertical'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">↕ 세로형 보기 (피라미드)</span>
              <span className="sm:hidden">세로형</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Requirement 4: Multiple Brackets Tabs Toolbar */}
      <div className="w-full bg-slate-900/50 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between flex-shrink-0 overflow-x-auto gap-3 scrollbar-none">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {boards.map((b) => {
            const isActive = b.id === activeBoardId;
            return (
              <div key={b.id} className="flex items-center space-x-1 flex-shrink-0">
                <button
                  onClick={() => setActiveBoardId(b.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>{b.title}</span>
                </button>

                {isAdmin && boards.length > 1 && isActive && (
                  <button
                    onClick={() => handleDeleteBoard(b.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="대진표 탭 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={handleAddBoard}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 text-xs font-bold flex items-center space-x-1 transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>+ 대진표 판 추가</span>
            </button>

            <button
              onClick={handleAddMatchToBoard}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md shadow-cyan-500/20 active-press transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ 팀/경기 추가</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Bracket Interactive Workspace */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950 scrollbar-thin relative flex items-center justify-center">
        
        {/* VIEW 1: HORIZONTAL VIEW (World Cup Style / 양끝 → 중앙) */}
        {viewMode === 'horizontal' && (
          <div className="min-w-[900px] w-full max-w-7xl flex items-center justify-between gap-4 py-8 relative">
            
            {/* LEFT WING COLUMN (Round 1 & Round 2 Left Matches) */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center font-bold text-xs text-cyan-400 uppercase tracking-widest border-b border-cyan-500/30 pb-1 w-full">
                👈 좌측 예선/준결승 (LEFT WING)
              </div>
              
              {leftMatches.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60 w-full">
                  좌측 경기 슬롯이 없습니다.
                </div>
              ) : (
                <div className="space-y-4 w-full flex flex-col items-center">
                  {leftMatches.map(m => renderMatchCard(m, 'border-cyan-500/30'))}
                </div>
              )}
            </div>

            {/* LEFT SVG CONNECTOR LINE */}
            <div className="w-16 h-48 flex items-center justify-center text-cyan-500/60 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 64 120" fill="none" preserveAspectRatio="none">
                <path d="M 0 30 H 32 V 90 H 0 M 32 60 H 64" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" />
              </svg>
            </div>

            {/* CENTER COLUMN (Championship Finals) */}
            <div className="w-80 flex-shrink-0 flex flex-col items-center justify-center space-y-6">
              <div className="text-center font-extrabold text-sm text-amber-400 uppercase tracking-widest border-b border-amber-500/40 pb-1 w-full flex items-center justify-center gap-1.5">
                <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
                <span>🏆 챔피언십 결승전 (CENTER FINALS)</span>
              </div>

              {centerMatches.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60 w-full">
                  결승전 매치가 설정되지 않았습니다.
                </div>
              ) : (
                <div className="space-y-4 w-full flex flex-col items-center">
                  {centerMatches.map(m => renderMatchCard(m, 'border-amber-500/80'))}
                </div>
              )}
            </div>

            {/* RIGHT SVG CONNECTOR LINE */}
            <div className="w-16 h-48 flex items-center justify-center text-cyan-500/60 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 64 120" fill="none" preserveAspectRatio="none">
                <path d="M 64 30 H 32 V 90 H 64 M 32 60 H 0" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" />
              </svg>
            </div>

            {/* RIGHT WING COLUMN (Round 1 & Round 2 Right Matches) */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center font-bold text-xs text-cyan-400 uppercase tracking-widest border-b border-cyan-500/30 pb-1 w-full">
                👉 우측 예선/준결승 (RIGHT WING)
              </div>

              {rightMatches.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-900/40 rounded-2xl border border-slate-800/60 w-full">
                  우측 경기 슬롯이 없습니다.
                </div>
              ) : (
                <div className="space-y-4 w-full flex flex-col items-center">
                  {rightMatches.map(m => renderMatchCard(m, 'border-cyan-500/30'))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* VIEW 2: VERTICAL VIEW (Bottom-to-Top Pyramid / 아래 → 위) */}
        {viewMode === 'vertical' && (
          <div className="max-w-4xl mx-auto flex flex-col-reverse space-y-reverse space-y-8 items-center justify-center min-h-[500px] w-full py-8">
            
            {/* LEVEL 1 (BOTTOM): 예선 라운드 */}
            <div className="w-full space-y-3">
              <div className="text-center font-bold text-xs text-cyan-400 border-b border-cyan-500/30 pb-1 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>1 단계: 예선 및 8강 라운드 (BOTTOM LEVEL)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {round1Matches.length === 0 ? (
                  <div className="col-span-2 text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                    등록된 하위 예선 경기가 없습니다. 상단의 [+ 팀/경기 추가] 버튼으로 등록해주세요.
                  </div>
                ) : (
                  round1Matches.map(m => renderMatchCard(m, 'border-cyan-500/40'))
                )}
              </div>
            </div>

            {/* SVG CONNECTOR (Bottom to Middle: Inverted U-shape) */}
            <div className="w-full flex items-center justify-center my-2 text-cyan-500/60 h-8">
              <svg className="w-3/4 h-full" viewBox="0 0 100 32" fill="none" preserveAspectRatio="none">
                <path d="M 20 32 V 16 H 80 V 32 M 50 16 V 0" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" />
              </svg>
            </div>

            {/* LEVEL 2 (MIDDLE): 준결승전 */}
            <div className="w-full space-y-3">
              <div className="text-center font-bold text-xs text-amber-400 border-b border-amber-500/30 pb-1 uppercase tracking-widest">
                2 단계: 준결승전 (SEMI-FINALS)
              </div>

              <div className="max-w-md mx-auto space-y-3">
                {round2Matches.length === 0 ? (
                  <div className="text-center p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    준결승 경기가 아직 지정되지 않았습니다.
                  </div>
                ) : (
                  round2Matches.map(m => renderMatchCard(m, 'border-amber-500/50'))
                )}
              </div>
            </div>

            {/* SVG CONNECTOR (Middle to Top) */}
            <div className="w-full flex items-center justify-center my-2 text-amber-500/60 h-8">
              <svg className="w-1/2 h-full" viewBox="0 0 100 32" fill="none" preserveAspectRatio="none">
                <path d="M 25 32 V 16 H 75 V 32 M 50 16 V 0" stroke="currentColor" strokeWidth="2.5" strokeDasharray="4 2" />
              </svg>
            </div>

            {/* LEVEL 3 (TOP): 🏆 결승전 */}
            <div className="w-full space-y-3">
              <div className="text-center font-extrabold text-sm text-orange-400 border-b border-orange-500/40 pb-1.5 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
                <span>최상단: 🏆 챔피언십 결승전 (TOP FINALS)</span>
              </div>

              <div className="max-w-md mx-auto">
                {round3Matches.length === 0 ? (
                  <div className="text-center p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 text-xs">
                    결승전 매치가 설정되지 않았습니다.
                  </div>
                ) : (
                  round3Matches.map(m => renderMatchCard(m, 'border-amber-500/80'))
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Modal Bottom Status Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            {isAdmin ? '🔒 어드민 편집 모드: 각 슬롯 선택으로 팀 변경 & [- 삭제] 가능' : '👁️ 일반 사용자: 본선 대진표 실시간 조회 전용'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
        >
          닫기
        </button>
      </div>

    </div>
  );
};
