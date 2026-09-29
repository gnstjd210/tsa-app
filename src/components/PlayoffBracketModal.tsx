import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Trophy, GitFork, Shield, Edit3, ArrowUp, ArrowLeftRight } from 'lucide-react';
import { useSupabaseData } from '../context/SupabaseContext';

export interface BracketMatch {
  id: string;
  parentId?: string | null; // 트리 노드 부모 ID (이 경기의 승자가 진출할 상위 경기 ID)
  roundTitle: string;       // 관리자 인라인 직접 수정 가능한 라운드 타이틀 (예: 8강 1경기, 4강 A조)
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  dateStr?: string;
  fieldStr?: string;
  side?: 'left' | 'right' | 'center'; // 가로형 배치 (좌측 wing, 우측 wing, 중앙 결승)
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

  // 뷰 모드: horizontal (가로 양끝→중앙) vs vertical (세로 피라미드)
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('horizontal');

  // 기본 트리 대진표 데이터 (Root Node: 결승전)
  const defaultBoards: BracketBoard[] = [
    {
      id: 'board-1',
      title: '1위~3위 대진표 (상위 토너먼트)',
      matches: [
        {
          id: 'final-1',
          parentId: null,
          side: 'center',
          roundTitle: '🏆 챔피언십 결승전 (Finals)',
          homeTeamName: 'TSA 우먼스',
          awayTeamName: '퀸즈 위너스',
          dateStr: '10월 15일 16:00',
          fieldStr: '해누리 1구장 메인'
        },
        {
          id: 'sf-left-1',
          parentId: 'final-1',
          side: 'left',
          roundTitle: '4강 1경기 (좌측)',
          homeTeamName: 'TSA 우먼스',
          awayTeamName: '파닉스 레이디스',
          homeScore: 1,
          awayScore: 0,
          dateStr: '10월 15일 13:00'
        },
        {
          id: 'qf-left-1',
          parentId: 'sf-left-1',
          side: 'left',
          roundTitle: '8강 1경기',
          homeTeamName: '1조 1위 (TSA 우먼스)',
          awayTeamName: '2조 2위 (이데일리 스타즈)',
          homeScore: 2,
          awayScore: 1,
          dateStr: '10월 14일 14:00'
        },
        {
          id: 'sf-right-1',
          parentId: 'final-1',
          side: 'right',
          roundTitle: '4강 2경기 (우측)',
          homeTeamName: '퀸즈 위너스',
          awayTeamName: '골든이글스 W',
          homeScore: 2,
          awayScore: 1,
          dateStr: '10월 15일 14:00'
        },
        {
          id: 'qf-right-1',
          parentId: 'sf-right-1',
          side: 'right',
          roundTitle: '8강 2경기',
          homeTeamName: '3조 1위 (퀸즈 위너스)',
          awayTeamName: '4조 2위 (블랙팬서 W)',
          homeScore: 3,
          awayScore: 0,
          dateStr: '10월 14일 15:00'
        }
      ]
    },
    {
      id: 'board-2',
      title: '4위~6위 대진표 (순위결정전)',
      matches: [
        {
          id: 'final-2',
          parentId: null,
          side: 'center',
          roundTitle: '4위 순위 결정 최종전',
          homeTeamName: '파닉스 레이디스',
          awayTeamName: '이데일리 스타즈',
          dateStr: '10월 15일 11:00'
        },
        {
          id: 'sf-left-2',
          parentId: 'final-2',
          side: 'left',
          roundTitle: '5위/6위 결정 예선전',
          homeTeamName: '골든이글스 W',
          awayTeamName: '파닉스 레이디스',
          homeScore: 1,
          awayScore: 2,
          dateStr: '10월 14일 16:00'
        }
      ]
    }
  ];

  const [boards, setBoards] = useState<BracketBoard[]>(() => {
    const saved = localStorage.getItem('tsa_node_tree_bracket_boards_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultBoards;
      }
    }
    return defaultBoards;
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(boards[0]?.id || 'board-1');

  useEffect(() => {
    localStorage.setItem('tsa_node_tree_bracket_boards_v2', JSON.stringify(boards));
  }, [boards]);

  if (!isOpen) return null;

  const currentBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  // 1. 대진표 판 추가
  const handleAddBoard = () => {
    const title = prompt('새로운 대진표 이름을 입력하세요 (예: 7위~9위 대진표, 여성부 2부 리그):');
    if (!title || !title.trim()) return;

    const newBoardId = `board_${Date.now()}`;
    const newBoard: BracketBoard = {
      id: newBoardId,
      title: title.trim(),
      matches: [
        {
          id: `final_${Date.now()}`,
          parentId: null,
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
    alert(`[${title.trim()}] 대진표 판이 생성되었습니다!`);
  };

  // 대진표 판 삭제
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

  // 2. [핵심] 박스별 개별 [+] 버튼 클릭 시 하위 라운드 빈 경기 노드 1개 생성 및 1:1 연결
  const handleAddChildNode = (parentId: string, side: 'left' | 'right') => {
    const newMatchId = `node_${Date.now()}`;
    const parentMatch = currentBoard.matches.find(m => m.id === parentId);
    const parentTitle = parentMatch?.roundTitle || '상위 경기';

    const newMatch: BracketMatch = {
      id: newMatchId,
      parentId: parentId,
      side: side,
      roundTitle: `하위 예선 (${parentTitle} 피더)`,
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

  // 3. 노드 삭제 (해당 노드 및 연관된 자식 노드 재귀 삭제)
  const handleDeleteMatchNode = (matchId: string) => {
    if (!window.confirm('이 경기 박스와 하위 연결 노드를 삭제하시겠습니까?')) return;

    const getMatchAndDescendantIds = (id: string, allMatches: BracketMatch[]): string[] => {
      const children = allMatches.filter(m => m.parentId === id);
      let ids = [id];
      for (const child of children) {
        ids = [...ids, ...getMatchAndDescendantIds(child.id, allMatches)];
      }
      return ids;
    };

    const idsToRemove = getMatchAndDescendantIds(matchId, currentBoard.matches);

    setBoards(prev => prev.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          matches: b.matches.filter(m => !idsToRemove.includes(m.id))
        };
      }
      return b;
    }));
  };

  // 4. 라운드 타이틀 인라인 수정 (Inline Editing)
  const handleUpdateTitle = (matchId: string, newTitle: string) => {
    setBoards(prev => prev.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          matches: b.matches.map(m => m.id === matchId ? { ...m, roundTitle: newTitle } : m)
        };
      }
      return b;
    }));
  };

  // 5. 팀 선택 변경
  const handleUpdateTeamInMatch = (matchId: string, teamSide: 'home' | 'away', newTeamName: string) => {
    setBoards(prev => prev.map(b => {
      if (b.id === currentBoard.id) {
        return {
          ...b,
          matches: b.matches.map(m => {
            if (m.id === matchId) {
              return {
                ...m,
                [teamSide === 'home' ? 'homeTeamName' : 'awayTeamName']: newTeamName
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

  // 루트 노드 (결승전)
  const rootMatch = currentBoard.matches.find(m => m.parentId === null || m.side === 'center') || currentBoard.matches[0];

  // 자식 노드 검색 헬퍼
  const getChildrenOf = (parentId: string, sideFilter?: 'left' | 'right') => {
    return currentBoard.matches.filter(m => {
      if (m.parentId !== parentId) return false;
      if (sideFilter && m.side !== sideFilter) return false;
      return true;
    });
  };

  // 단일 경기 카드 컴포넌트 렌더러
  const renderMatchCard = (m: BracketMatch, borderStyle: string = 'border-slate-700') => {
    const isRoot = m.parentId === null || m.side === 'center';
    const isLeft = m.side === 'left';
    const isRight = m.side === 'right';

    return (
      <div
        key={m.id}
        className={`glass-panel rounded-2xl p-3.5 border-2 ${
          isRoot
            ? 'border-amber-400 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 shadow-2xl shadow-amber-500/20'
            : `${borderStyle} bg-slate-900/95 shadow-xl`
        } space-y-2 relative group min-w-[250px] transition-all hover:border-white`}
      >
        {/* 라운드 타이틀 Header (관리자 전용 Inline Edit Input) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
          {isAdmin ? (
            <div className="flex items-center space-x-1 flex-1">
              <Edit3 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
              <input
                type="text"
                value={m.roundTitle}
                onChange={(e) => handleUpdateTitle(m.id, e.target.value)}
                placeholder="라운드명 입력 (예: 8강 1경기)"
                className="bg-slate-950 text-cyan-400 font-bold border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-white w-full"
                title="클릭하여 라운드 명칭을 직접 수정하세요"
              />
            </div>
          ) : (
            <span className={`text-[11px] font-extrabold ${isRoot ? 'text-amber-400' : 'text-cyan-400'}`}>
              {m.roundTitle} {m.dateStr ? `(${m.dateStr})` : ''}
            </span>
          )}

          {isAdmin && !isRoot && (
            <button
              onClick={() => handleDeleteMatchNode(m.id)}
              className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
              title="이 경기 박스 및 하위 노드 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Home Team Select / Text */}
        <div className="flex items-center justify-between text-xs font-bold text-white">
          {isAdmin ? (
            <select
              value={m.homeTeamName}
              onChange={(e) => handleUpdateTeamInMatch(m.id, 'home', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none focus:border-cyan-400 truncate w-full mr-2"
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

        {/* Away Team Select / Text */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-t border-slate-800/80 pt-1.5">
          {isAdmin ? (
            <select
              value={m.awayTeamName}
              onChange={(e) => handleUpdateTeamInMatch(m.id, 'away', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none focus:border-cyan-400 truncate w-full mr-2"
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

        {/* [요구사항 2] 박스에 직접 붙은 개별 [+] 노드 가지치기 버튼 */}
        {isAdmin && (
          <>
            {/* 가로형 뷰 - 좌측 Wing 박스의 [+] 버튼 (왼쪽 방향 하위 라운드 추가) */}
            {viewMode === 'horizontal' && (isLeft || isRoot) && (
              <button
                onClick={() => handleAddChildNode(m.id, 'left')}
                className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-2xl border-2 border-white flex items-center justify-center transition-transform hover:scale-125 z-20"
                title="[+] 좌측 하위 라운드 경기 가지치기 추가"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            )}

            {/* 가로형 뷰 - 우측 Wing 박스의 [+] 버튼 (오른쪽 방향 하위 라운드 추가) */}
            {viewMode === 'horizontal' && (isRight || isRoot) && (
              <button
                onClick={() => handleAddChildNode(m.id, 'right')}
                className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-2xl border-2 border-white flex items-center justify-center transition-transform hover:scale-125 z-20"
                title="[+] 우측 하위 라운드 경기 가지치기 추가"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            )}

            {/* 세로형 뷰 - 박스 하단 [+] 버튼 (아래 방향 하위 라운드 추가) */}
            {viewMode === 'vertical' && (
              <button
                onClick={() => handleAddChildNode(m.id, isLeft ? 'left' : isRight ? 'right' : 'left')}
                className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-2xl border-2 border-white flex items-center justify-center transition-transform hover:scale-125 z-20"
                title="[+] 하위 라운드 경기 가지치기 추가"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  // 재귀적 좌측 트리기지 렌더러 (Left Wing: Left -> Right towards parent)
  const renderLeftWingBranch = (parentMatchId: string): React.ReactNode => {
    const children = getChildrenOf(parentMatchId, 'left');
    if (children.length === 0) return null;

    return (
      <div className="flex items-center gap-0">
        {/* 서브 자식들 (더 외곽 예선) */}
        <div className="flex flex-col space-y-6 justify-center">
          {children.map(child => (
            <div key={child.id} className="flex items-center gap-0">
              {renderLeftWingBranch(child.id)}
              {renderMatchCard(child, 'border-cyan-500/50')}
            </div>
          ))}
        </div>

        {/* [요구사항 1] 뚜렷한 흰색 실선 (Solid White 2.5px Line) */}
        <div className="w-12 h-full flex items-center justify-center text-white flex-shrink-0">
          <svg className="w-full h-full min-h-[80px]" viewBox="0 0 48 100" fill="none" preserveAspectRatio="none">
            {children.length === 1 ? (
              // 1:1 연결 뚜렷한 흰색 실선
              <path d="M 0 50 H 48" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            ) : (
              // 2:1 이상 연결 뚜렷한 흰색 실선 브래킷
              <>
                <path d="M 0 25 H 24 V 75 H 0" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                <path d="M 24 50 H 48" stroke="#ffffff" strokeWidth="2.5" fill="none" />
              </>
            )}
          </svg>
        </div>
      </div>
    );
  };

  // 재귀적 우측 트리기지 렌더러 (Right Wing: Parent -> Right towards children)
  const renderRightWingBranch = (parentMatchId: string): React.ReactNode => {
    const children = getChildrenOf(parentMatchId, 'right');
    if (children.length === 0) return null;

    return (
      <div className="flex items-center gap-0">
        {/* [요구사항 1] 뚜렷한 흰색 실선 (Solid White 2.5px Line) */}
        <div className="w-12 h-full flex items-center justify-center text-white flex-shrink-0">
          <svg className="w-full h-full min-h-[80px]" viewBox="0 0 48 100" fill="none" preserveAspectRatio="none">
            {children.length === 1 ? (
              // 1:1 연결 뚜렷한 흰색 실선
              <path d="M 0 50 H 48" stroke="#ffffff" strokeWidth="2.5" fill="none" />
            ) : (
              // 1:2 이상 연결 뚜렷한 흰색 실선 브래킷
              <>
                <path d="M 0 50 H 24" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                <path d="M 24 25 V 75" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                <path d="M 24 25 H 48 M 24 75 H 48" stroke="#ffffff" strokeWidth="2.5" fill="none" />
              </>
            )}
          </svg>
        </div>

        {/* 서브 자식들 (더 외곽 예선) */}
        <div className="flex flex-col space-y-6 justify-center">
          {children.map(child => (
            <div key={child.id} className="flex items-center gap-0">
              {renderMatchCard(child, 'border-cyan-500/50')}
              {renderRightWingBranch(child.id)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 세로형 뷰 재귀 렌더러 (Vertical Bottom-Up Tree)
  const renderVerticalNodeBranch = (matchId: string): React.ReactNode => {
    const match = currentBoard.matches.find(m => m.id === matchId);
    if (!match) return null;

    const children = currentBoard.matches.filter(m => m.parentId === matchId);

    return (
      <div className="flex flex-col items-center space-y-0">
        {/* 상위 매치 박스 */}
        {renderMatchCard(match, 'border-amber-400')}

        {children.length > 0 && (
          <>
            {/* [요구사항 1] 뚜렷한 흰색 실선 커넥터 */}
            <div className="w-full flex items-center justify-center text-white h-8">
              <svg className="w-48 h-full" viewBox="0 0 100 32" fill="none" preserveAspectRatio="none">
                {children.length === 1 ? (
                  <path d="M 50 0 V 32" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                ) : (
                  <path d="M 25 32 V 16 H 75 V 32 M 50 0 V 16" stroke="#ffffff" strokeWidth="2.5" fill="none" />
                )}
              </svg>
            </div>

            {/* 하위 자식 노드들 배열 */}
            <div className="flex items-start space-x-6">
              {children.map(child => (
                <div key={child.id}>
                  {renderVerticalNodeBranch(child.id)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden animate-fadeIn">
      
      {/* Modal Top Header */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>TSA 수동 노드 레고 빌더 (Node-Based Bracket Builder)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md">
                100% SOLID LINE NODE TREE
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              각 경기 박스의 <span className="text-white font-bold bg-slate-800 px-1 rounded">[+]</span> 버튼을 클릭하여 하얀 실선으로 연결된 하위 라운드를 직접 무한 확장하세요.
            </p>
          </div>
        </div>

        {/* View Switches & Close Button */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('horizontal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'horizontal'
                  ? 'bg-white text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">↔ 가로형 수동 빌더 (양끝→중앙)</span>
              <span className="sm:hidden">가로형</span>
            </button>

            <button
              onClick={() => setViewMode('vertical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                viewMode === 'vertical'
                  ? 'bg-white text-slate-950 shadow-md scale-105'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">↕ 세로형 수동 빌더 (피라미드)</span>
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

      {/* Multiple Brackets Tab Bar */}
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
          <button
            onClick={handleAddBoard}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 text-xs font-bold flex items-center space-x-1 transition-all whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>+ 대진표 판 추가</span>
          </button>
        )}
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 overflow-auto p-8 sm:p-12 bg-slate-950 scrollbar-thin relative flex items-center justify-center">
        
        {/* VIEW 1: HORIZONTAL VIEW (World Cup Style / 양끝 → 중앙) */}
        {viewMode === 'horizontal' && (
          <div className="flex items-center justify-center gap-0 py-8 min-w-max">
            
            {/* 1. 좌측 트리기지 (Left Wing: outer children -> parent) */}
            {rootMatch && renderLeftWingBranch(rootMatch.id)}

            {/* 2. 중앙 결승전 Root Match */}
            <div className="flex flex-col items-center justify-center mx-4">
              <div className="text-center font-black text-sm text-amber-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
                <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
                <span>🏆 챔피언십 결승전 (CENTER FINALS)</span>
              </div>
              {rootMatch && renderMatchCard(rootMatch, 'border-amber-400')}
            </div>

            {/* 3. 우측 트리기지 (Right Wing: parent -> outer children) */}
            {rootMatch && renderRightWingBranch(rootMatch.id)}

          </div>
        )}

        {/* VIEW 2: VERTICAL VIEW (Bottom-to-Top Pyramid / 아래 → 위) */}
        {viewMode === 'vertical' && (
          <div className="py-8 flex flex-col items-center justify-center min-w-max">
            {rootMatch && renderVerticalNodeBranch(rootMatch.id)}
          </div>
        )}

      </div>

      {/* Modal Bottom Footer Status Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span>
            {isAdmin 
              ? '🔒 어드민 빌더: 박스의 [+]로 하얀 실선 가지치기 생성 | 타이틀 직접 텍스트 수정' 
              : '👁️ 일반 사용자: 수동 조립된 본선 대진표 실시간 조회'}
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
