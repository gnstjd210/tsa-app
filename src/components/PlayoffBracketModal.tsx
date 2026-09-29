import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Trophy, GitFork, Shield, ChevronDown, Sparkles, Save, Edit, RefreshCw } from 'lucide-react';
import { useSupabaseData } from '../context/SupabaseContext';

export interface BracketMatch {
  id: string;
  round: number; // 1: 예선/bottom, 2: 준결승/middle, 3: 결승/top
  roundTitle: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  dateStr?: string;
  fieldStr?: string;
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

  // Requirement 4: Multiple Brackets (Array Structure) & Persistence
  const defaultBoards: BracketBoard[] = [
    {
      id: 'board-1',
      title: '1위~3위 대진표 (상위 토너먼트)',
      matches: [
        {
          id: 'b1-m1',
          round: 1,
          roundTitle: '4강 1경기 (예선)',
          homeTeamName: '1조 1위 (TSA 우먼스)',
          awayTeamName: '2조 2위 (이데일리 스타즈)',
          homeScore: 2,
          awayScore: 1,
          dateStr: '10월 14일 14:00'
        },
        {
          id: 'b1-m2',
          round: 1,
          roundTitle: '4강 2경기 (예선)',
          homeTeamName: '3조 1위 (퀸즈 위너스)',
          awayTeamName: '4조 2위 (블랙팬서 W)',
          homeScore: 3,
          awayScore: 0,
          dateStr: '10월 14일 15:00'
        },
        {
          id: 'b1-m3',
          round: 2,
          roundTitle: '준결승전 (Semi-Finals)',
          homeTeamName: 'TSA 우먼스',
          awayTeamName: '퀸즈 위너스',
          homeScore: 1,
          awayScore: 0,
          dateStr: '10월 15일 13:00'
        },
        {
          id: 'b1-m4',
          round: 3,
          roundTitle: '🏆 챔피언십 결승전 (Finals)',
          homeTeamName: 'TSA 우먼스',
          awayTeamName: '골든이글스 W',
          dateStr: '10월 15일 16:00',
          fieldStr: '해누리 1구장'
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

  // Requirement 4: Admin Add New Bracket Board
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
          roundTitle: '예선 1경기',
          homeTeamName: '참가팀 선택',
          awayTeamName: '참가팀 선택',
          dateStr: '일정 미정'
        },
        {
          id: `m_${Date.now()}_2`,
          round: 2,
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

  // Requirement 4: Admin Delete Bracket Board
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

  // Requirement 2 & 3: Admin Add Match Slot to Bottom Round
  const handleAddMatchToBoard = () => {
    if (!currentBoard) return;
    const newMatchId = `match_${Date.now()}`;
    const newMatch: BracketMatch = {
      id: newMatchId,
      round: 1, // Bottom round
      roundTitle: `예선 경기 (${currentBoard.matches.length + 1})`,
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

  // Requirement 3: Admin Delete Match Slot from Bracket
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

  // Requirement 3: Update Team Name in Bracket Match Box
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

  // Sorted DB teams for dropdown
  const sortedTeams = [...rawTeams].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

  // Requirement 2: Separate matches into Bottom (Round 1), Middle (Round 2), Top (Round 3+)
  const round1Matches = currentBoard.matches.filter(m => m.round === 1);
  const round2Matches = currentBoard.matches.filter(m => m.round === 2);
  const round3Matches = currentBoard.matches.filter(m => m.round >= 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-fadeIn">
      {/* Requirement 1: Large Modal (Screen Occupying 90%+ Width & Height) */}
      <div className="glass-panel w-full max-w-6xl h-[90vh] rounded-3xl p-5 border border-cyan-500/40 shadow-2xl flex flex-col bg-slate-950/95 overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-shrink-0 gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>TSA 본선 사다리형 대진표 시스템</span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md">
                  BOTTOM-UP BRACKET
                </span>
              </h2>
              <p className="text-xs text-slate-400">아래(예선)에서 위(결승)로 연결되는 토너먼트 사다리 대진표입니다.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Requirement 4: Multiple Brackets Tab Menu */}
        <div className="flex items-center justify-between border-b border-slate-800 py-3 flex-shrink-0 overflow-x-auto gap-2 scrollbar-none">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
            {boards.map((b) => {
              const isActive = b.id === activeBoardId;
              return (
                <div key={b.id} className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => setActiveBoardId(b.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center space-x-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20 scale-105'
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
                      title="이 대진표 탭 삭제"
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
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 text-xs font-bold flex items-center space-x-1 transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>+ 대진표 판 추가</span>
              </button>

              <button
                onClick={handleAddMatchToBoard}
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md shadow-cyan-500/20 active-press transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>+ 팀/경기 추가</span>
              </button>
            </div>
          )}
        </div>

        {/* Requirement 2: Bottom-to-Top (아래에서 위로 올라가는 사다리형) Tree Area */}
        <div className="flex-1 overflow-auto py-6 px-4 scrollbar-thin">
          <div className="max-w-4xl mx-auto flex flex-col-reverse space-y-reverse space-y-8 items-center justify-center min-h-[500px]">
            
            {/* LEVEL 1 (BOTTOM): 예선 / 4강 (Round 1) */}
            <div className="w-full space-y-3">
              <div className="text-center font-bold text-xs text-cyan-400 border-b border-cyan-500/30 pb-1 uppercase tracking-widest flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>1 단계: 예선 및 4강 라운드 (BOTTOM LEVEL)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {round1Matches.length === 0 ? (
                  <div className="col-span-2 text-center p-6 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                    등록된 하위 예선 경기가 없습니다. 상단의 [+ 팀/경기 추가] 버튼으로 등록해주세요.
                  </div>
                ) : (
                  round1Matches.map((m) => (
                    <div
                      key={m.id}
                      className="glass-panel rounded-2xl p-4 border border-slate-800 bg-slate-900/90 shadow-xl space-y-2 relative hover:border-cyan-500/50 transition-all group"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] font-bold text-cyan-400">
                          {m.roundTitle} ({m.dateStr})
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
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white text-xs font-bold focus:outline-none focus:border-cyan-500 truncate max-w-[200px]"
                          >
                            <option value={m.homeTeamName}>{m.homeTeamName}</option>
                            {sortedTeams.map(t => (
                              <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="truncate">{m.homeTeamName}</span>
                        )}
                        <span className="text-orange-400 font-extrabold ml-2">{m.homeScore ?? '-'}</span>
                      </div>

                      {/* Away Team Slot */}
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-t border-slate-800/80 pt-1.5">
                        {isAdmin ? (
                          <select
                            value={m.awayTeamName}
                            onChange={(e) => handleUpdateTeamInMatch(m.id, 'away', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white text-xs font-bold focus:outline-none focus:border-cyan-500 truncate max-w-[200px]"
                          >
                            <option value={m.awayTeamName}>{m.awayTeamName}</option>
                            {sortedTeams.map(t => (
                              <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="truncate">{m.awayTeamName}</span>
                        )}
                        <span className="text-slate-400 ml-2">{m.awayScore ?? '-'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* VERTICAL TREE CONNECTOR (Bottom to Middle: Inverted U-shape |_|) */}
            <div className="w-full flex items-center justify-center my-2">
              <div className="w-3/4 h-8 border-l-2 border-r-2 border-t-2 border-cyan-500/50 rounded-t-xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full h-4 w-0.5 bg-cyan-500/60" />
              </div>
            </div>

            {/* LEVEL 2 (MIDDLE): 준결승전 (Round 2) */}
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
                  round2Matches.map((m) => (
                    <div
                      key={m.id}
                      className="glass-panel rounded-2xl p-4 border border-amber-500/40 bg-slate-900/90 shadow-xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-[10px] font-bold text-amber-400">
                          {m.roundTitle} ({m.dateStr})
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
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white text-xs font-bold focus:outline-none focus:border-amber-500 truncate max-w-[200px]"
                          >
                            <option value={m.homeTeamName}>{m.homeTeamName}</option>
                            {sortedTeams.map(t => (
                              <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="truncate">{m.homeTeamName}</span>
                        )}
                        <span className="text-amber-400 font-extrabold ml-2">{m.homeScore ?? '-'}</span>
                      </div>

                      {/* Away Team Slot */}
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-t border-slate-800/80 pt-1.5">
                        {isAdmin ? (
                          <select
                            value={m.awayTeamName}
                            onChange={(e) => handleUpdateTeamInMatch(m.id, 'away', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white text-xs font-bold focus:outline-none focus:border-amber-500 truncate max-w-[200px]"
                          >
                            <option value={m.awayTeamName}>{m.awayTeamName}</option>
                            {sortedTeams.map(t => (
                              <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="truncate">{m.awayTeamName}</span>
                        )}
                        <span className="text-slate-400 ml-2">{m.awayScore ?? '-'}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* VERTICAL TREE CONNECTOR (Middle to Top) */}
            <div className="w-full flex items-center justify-center my-2">
              <div className="w-1/2 h-8 border-l-2 border-r-2 border-t-2 border-amber-500/60 rounded-t-xl relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full h-4 w-0.5 bg-amber-500/70" />
              </div>
            </div>

            {/* LEVEL 3 (TOP): 결승전 (Round 3 / TOP LEVEL) */}
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
                  round3Matches.map((m) => (
                    <div
                      key={m.id}
                      className="bg-gradient-to-b from-orange-500/25 via-slate-900 to-slate-950 border-2 border-orange-500/70 rounded-3xl p-5 text-center space-y-3 shadow-2xl relative"
                    >
                      <span className="px-3 py-1 bg-orange-500 text-slate-950 font-black rounded-full text-xs shadow-md tracking-wider uppercase inline-block">
                        CHAMPIONSHIP MATCH
                      </span>

                      <div className="space-y-2 text-sm pt-1">
                        {isAdmin ? (
                          <div className="space-y-2 max-w-xs mx-auto">
                            <select
                              value={m.homeTeamName}
                              onChange={(e) => handleUpdateTeamInMatch(m.id, 'home', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs font-bold text-center"
                            >
                              <option value={m.homeTeamName}>{m.homeTeamName}</option>
                              {sortedTeams.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                            <span className="text-orange-400 font-extrabold text-sm block">VS</span>
                            <select
                              value={m.awayTeamName}
                              onChange={(e) => handleUpdateTeamInMatch(m.id, 'away', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-white text-xs font-bold text-center"
                            >
                              <option value={m.awayTeamName}>{m.awayTeamName}</option>
                              {sortedTeams.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="font-sports text-xl font-extrabold text-white">
                            {m.homeTeamName} vs {m.awayTeamName}
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-orange-300 font-semibold border-t border-orange-500/30 pt-2">
                        {m.dateStr} ({m.fieldStr || '해누리 1구장 특설무대'})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span className="hidden sm:inline">
            {isAdmin ? '🔒 관리자 권한: 각 슬롯 클릭 시 팀 배정 및 [- 삭제] 가능' : '👁️ 일반 사용자: 본선 대진표 조회 전용'}
          </span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
