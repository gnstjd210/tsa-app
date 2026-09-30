import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  BackgroundVariant
} from 'reactflow';
import type { Node, Edge, Connection, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';
import { X, Plus, Trash2, Trophy, GitFork, Edit3, Save } from 'lucide-react';
import { useSupabaseData } from '../context/SupabaseContext';

// Node data interface
export interface MatchNodeData {
  roundTitle: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  dateStr?: string;
  fieldStr?: string;
  isFinal?: boolean;
  isAdmin?: boolean;
  rawTeams?: Array<{ id: string; name: string }>;
  onUpdateTitle?: (id: string, newTitle: string) => void;
  onUpdateTeam?: (id: string, side: 'home' | 'away', name: string) => void;
  onUpdateScore?: (id: string, side: 'home' | 'away', score: number) => void;
  onDeleteNode?: (id: string) => void;
  onAddChildNode?: (parentId: string, direction: 'left' | 'right' | 'bottom') => void;
}

// React Flow Figma-style Custom Node Component
const MatchNodeCard: React.FC<NodeProps<MatchNodeData>> = ({ id, data, selected }) => {
  const isFinal = data.isFinal || data.roundTitle?.includes('결승');
  const isAdmin = data.isAdmin;

  return (
    <div
      className={`glass-panel rounded-2xl p-4 border-2 ${
        isFinal
          ? 'border-amber-400 bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 shadow-2xl shadow-amber-500/30'
          : selected
          ? 'border-white bg-slate-900 shadow-2xl scale-105'
          : 'border-slate-700 bg-slate-900/95 shadow-xl'
      } space-y-2.5 relative min-w-[270px] max-w-[300px] transition-all group hover:border-white`}
    >
      {/* Target & Source Handles for React Flow Automatic Connecting Lines */}
      <Handle type="target" position={Position.Left} id="target-left" className="!bg-white !w-3 !h-3 !border-2 !border-slate-950" />
      <Handle type="target" position={Position.Right} id="target-right" className="!bg-white !w-3 !h-3 !border-2 !border-slate-950" />
      <Handle type="target" position={Position.Top} id="target-top" className="!bg-white !w-3 !h-3 !border-2 !border-slate-950" />

      <Handle type="source" position={Position.Left} id="source-left" className="!bg-white !w-3 !h-3 !border-2 !border-slate-950" />
      <Handle type="source" position={Position.Right} id="source-right" className="!bg-white !w-3 !h-3 !border-2 !border-slate-950" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!bg-white !w-3 !h-3 !border-2 !border-slate-950" />

      {/* Node Header: Round Title (Inline Editable for Admin) + Delete Button */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2">
        {isAdmin ? (
          <div className="flex items-center space-x-1 flex-1">
            <Edit3 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <input
              type="text"
              value={data.roundTitle || ''}
              onChange={(e) => data.onUpdateTitle?.(id, e.target.value)}
              placeholder="라운드명 입력 (예: 8강 1경기)"
              className="bg-slate-950 text-cyan-400 font-bold border border-cyan-500/40 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-white w-full nodrag"
              title="클릭하여 라운드 명칭을 직접 수정하세요"
            />
          </div>
        ) : (
          <span className={`text-xs font-black ${isFinal ? 'text-amber-400' : 'text-cyan-400'}`}>
            {data.roundTitle} {data.dateStr ? `(${data.dateStr})` : ''}
          </span>
        )}

        {isAdmin && (
          <button
            onClick={() => data.onDeleteNode?.(id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0 nodrag"
            title="이 경기 노드 및 연결선 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Home Team Slot: Dropdown + Score Input */}
      <div className="flex items-center justify-between text-xs font-bold text-white gap-2">
        {isAdmin ? (
          <select
            value={data.homeTeamName || ''}
            onChange={(e) => data.onUpdateTeam?.(id, 'home', e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none focus:border-cyan-400 truncate flex-1 nodrag"
          >
            <option value={data.homeTeamName}>{data.homeTeamName || '참가팀 선택'}</option>
            {data.rawTeams?.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        ) : (
          <span className="truncate flex-1">{data.homeTeamName}</span>
        )}

        {isAdmin ? (
          <input
            type="number"
            min="0"
            value={data.homeScore ?? ''}
            onChange={(e) => data.onUpdateScore?.(id, 'home', parseInt(e.target.value) || 0)}
            placeholder="점수"
            className="w-12 bg-slate-950 border border-slate-800 text-orange-400 font-extrabold text-center rounded py-1 text-xs nodrag"
          />
        ) : (
          <span className="text-orange-400 font-extrabold ml-1 flex-shrink-0">{data.homeScore ?? '-'}</span>
        )}
      </div>

      {/* Away Team Slot: Dropdown + Score Input */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-t border-slate-800/80 pt-2 gap-2">
        {isAdmin ? (
          <select
            value={data.awayTeamName || ''}
            onChange={(e) => data.onUpdateTeam?.(id, 'away', e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white text-xs font-bold focus:outline-none focus:border-cyan-400 truncate flex-1 nodrag"
          >
            <option value={data.awayTeamName}>{data.awayTeamName || '참가팀 선택'}</option>
            {data.rawTeams?.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        ) : (
          <span className="truncate flex-1">{data.awayTeamName}</span>
        )}

        {isAdmin ? (
          <input
            type="number"
            min="0"
            value={data.awayScore ?? ''}
            onChange={(e) => data.onUpdateScore?.(id, 'away', parseInt(e.target.value) || 0)}
            placeholder="점수"
            className="w-12 bg-slate-950 border border-slate-800 text-slate-300 font-extrabold text-center rounded py-1 text-xs nodrag"
          />
        ) : (
          <span className="text-slate-400 ml-1 flex-shrink-0">{data.awayScore ?? '-'}</span>
        )}
      </div>

      {/* Per-Node [+] Branch Buttons (Left, Right, Bottom) */}
      {isAdmin && (
        <>
          {/* [+] Button Left */}
          <button
            onClick={() => data.onAddChildNode?.(id, 'left')}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-2xl border-2 border-white flex items-center justify-center transition-transform hover:scale-125 z-30 nodrag"
            title="[+] 좌측 하위 라운드 경기 노드 추가"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>

          {/* [+] Button Right */}
          <button
            onClick={() => data.onAddChildNode?.(id, 'right')}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-2xl border-2 border-white flex items-center justify-center transition-transform hover:scale-125 z-30 nodrag"
            title="[+] 우측 하위 라운드 경기 노드 추가"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>

          {/* [+] Button Bottom */}
          <button
            onClick={() => data.onAddChildNode?.(id, 'bottom')}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-2xl border-2 border-white flex items-center justify-center transition-transform hover:scale-125 z-30 nodrag"
            title="[+] 하단 하위 라운드 경기 노드 추가"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
          </button>
        </>
      )}
    </div>
  );
};

export interface BoardData {
  id: string;
  title: string;
  nodes: Node<MatchNodeData>[];
  edges: Edge[];
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

  // Register custom node type
  const nodeTypes = useMemo(() => ({ matchNode: MatchNodeCard }), []);

  // Default initial boards
  const defaultInitialBoards: BoardData[] = [
    {
      id: 'board-1',
      title: '1위~3위 대진표 (상위 토너먼트)',
      nodes: [
        {
          id: 'final-1',
          type: 'matchNode',
          position: { x: 500, y: 250 },
          data: {
            roundTitle: '🏆 챔피언십 결승전 (Finals)',
            homeTeamName: 'TSA 우먼스',
            awayTeamName: '퀸즈 위너스',
            dateStr: '10월 15일 16:00',
            isFinal: true
          }
        },
        {
          id: 'sf-left-1',
          type: 'matchNode',
          position: { x: 100, y: 150 },
          data: {
            roundTitle: '4강 1경기 (좌측)',
            homeTeamName: 'TSA 우먼스',
            awayTeamName: '파닉스 레이디스',
            homeScore: 1,
            awayScore: 0,
            dateStr: '10월 15일 13:00'
          }
        },
        {
          id: 'qf-left-1',
          type: 'matchNode',
          position: { x: -300, y: 150 },
          data: {
            roundTitle: '8강 1경기',
            homeTeamName: '1조 1위 (TSA 우먼스)',
            awayTeamName: '2조 2위 (이데일리 스타즈)',
            homeScore: 2,
            awayScore: 1,
            dateStr: '10월 14일 14:00'
          }
        },
        {
          id: 'sf-right-1',
          type: 'matchNode',
          position: { x: 900, y: 150 },
          data: {
            roundTitle: '4강 2경기 (우측)',
            homeTeamName: '퀸즈 위너스',
            awayTeamName: '골든이글스 W',
            homeScore: 2,
            awayScore: 1,
            dateStr: '10월 15일 14:00'
          }
        },
        {
          id: 'qf-right-1',
          type: 'matchNode',
          position: { x: 1300, y: 150 },
          data: {
            roundTitle: '8강 2경기',
            homeTeamName: '3조 1위 (퀸즈 위너스)',
            awayTeamName: '4조 2위 (블랙팬서 W)',
            homeScore: 3,
            awayScore: 0,
            dateStr: '10월 14일 15:00'
          }
        }
      ],
      edges: [
        {
          id: 'e_qf_left_1_to_sf_left_1',
          source: 'qf-left-1',
          target: 'sf-left-1',
          type: 'smoothstep',
          style: { stroke: '#ffffff', strokeWidth: 2.5 }
        },
        {
          id: 'e_sf_left_1_to_final_1',
          source: 'sf-left-1',
          target: 'final-1',
          type: 'smoothstep',
          style: { stroke: '#ffffff', strokeWidth: 2.5 }
        },
        {
          id: 'e_sf_right_1_to_final_1',
          source: 'sf-right-1',
          target: 'final-1',
          type: 'smoothstep',
          style: { stroke: '#ffffff', strokeWidth: 2.5 }
        },
        {
          id: 'e_qf_right_1_to_sf_right_1',
          source: 'qf-right-1',
          target: 'sf-right-1',
          type: 'smoothstep',
          style: { stroke: '#ffffff', strokeWidth: 2.5 }
        }
      ]
    },
    {
      id: 'board-2',
      title: '4위~6위 대진표 (순위결정전)',
      nodes: [
        {
          id: 'final-2',
          type: 'matchNode',
          position: { x: 400, y: 200 },
          data: {
            roundTitle: '4위 순위 결정 최종전',
            homeTeamName: '파닉스 레이디스',
            awayTeamName: '이데일리 스타즈',
            dateStr: '10월 15일 11:00',
            isFinal: true
          }
        },
        {
          id: 'sf-left-2',
          type: 'matchNode',
          position: { x: 0, y: 200 },
          data: {
            roundTitle: '5위/6위 결정 예선전',
            homeTeamName: '골든이글스 W',
            awayTeamName: '파닉스 레이디스',
            homeScore: 1,
            awayScore: 2,
            dateStr: '10월 14일 16:00'
          }
        }
      ],
      edges: [
        {
          id: 'e_sf_left_2_to_final_2',
          source: 'sf-left-2',
          target: 'final-2',
          type: 'smoothstep',
          style: { stroke: '#ffffff', strokeWidth: 2.5 }
        }
      ]
    }
  ];

  const [boards, setBoards] = useState<BoardData[]>(() => {
    const saved = localStorage.getItem('tsa_reactflow_bracket_boards_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultInitialBoards;
      }
    }
    return defaultInitialBoards;
  });

  const [activeBoardId, setActiveBoardId] = useState<string>(boards[0]?.id || 'board-1');

  const currentBoard = boards.find(b => b.id === activeBoardId) || boards[0];

  const [nodes, setNodes, onNodesChange] = useNodesState(currentBoard?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(currentBoard?.edges || []);

  // When active board changes, update nodes and edges
  useEffect(() => {
    if (currentBoard) {
      setNodes(currentBoard.nodes || []);
      setEdges(currentBoard.edges || []);
    }
  }, [activeBoardId]);

  // Persist nodes and edges back to boards state and localStorage
  const saveCurrentBoardState = useCallback((updatedNodes: Node[], updatedEdges: Edge[]) => {
    setBoards(prevBoards => {
      const updated = prevBoards.map(b => {
        if (b.id === activeBoardId) {
          return {
            ...b,
            nodes: updatedNodes,
            edges: updatedEdges
          };
        }
        return b;
      });
      localStorage.setItem('tsa_reactflow_bracket_boards_v3', JSON.stringify(updated));
      return updated;
    });
  }, [activeBoardId]);

  // Handle edge connects manually drawn by admin
  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => {
      const newEdge: Edge = {
        ...connection,
        id: `e_${connection.source}_to_${connection.target}_${Date.now()}`,
        type: 'smoothstep',
        style: { stroke: '#ffffff', strokeWidth: 2.5 }
      } as Edge;
      const updated = addEdge(newEdge, eds);
      saveCurrentBoardState(nodes, updated);
      return updated;
    });
  }, [nodes, saveCurrentBoardState, setEdges]);

  // Handlers for Node Data Updates
  const handleUpdateTitle = useCallback((nodeId: string, newTitle: string) => {
    setNodes(nds => {
      const updated = nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, roundTitle: newTitle } } : n);
      saveCurrentBoardState(updated, edges);
      return updated;
    });
  }, [edges, saveCurrentBoardState, setNodes]);

  const handleUpdateTeam = useCallback((nodeId: string, side: 'home' | 'away', name: string) => {
    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              [side === 'home' ? 'homeTeamName' : 'awayTeamName']: name
            }
          };
        }
        return n;
      });
      saveCurrentBoardState(updated, edges);
      return updated;
    });
  }, [edges, saveCurrentBoardState, setNodes]);

  const handleUpdateScore = useCallback((nodeId: string, side: 'home' | 'away', score: number) => {
    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              [side === 'home' ? 'homeScore' : 'awayScore']: score
            }
          };
        }
        return n;
      });
      saveCurrentBoardState(updated, edges);
      return updated;
    });
  }, [edges, saveCurrentBoardState, setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (!window.confirm('이 경기 노드와 연결선을 삭제하시겠습니까?')) return;
    setNodes(nds => {
      const updatedNodes = nds.filter(n => n.id !== nodeId);
      setEdges(eds => {
        const updatedEdges = eds.filter(e => e.source !== nodeId && e.target !== nodeId);
        saveCurrentBoardState(updatedNodes, updatedEdges);
        return updatedEdges;
      });
      return updatedNodes;
    });
  }, [saveCurrentBoardState, setEdges, setNodes]);

  // [+] Button handler to spawn child node & auto-connect solid white edge
  const handleAddChildNode = useCallback((parentId: string, direction: 'left' | 'right' | 'bottom') => {
    const parentNode = nodes.find(n => n.id === parentId);
    const parentPos = parentNode ? parentNode.position : { x: 400, y: 200 };

    let offsetX = 0;
    let offsetY = 0;

    if (direction === 'left') {
      offsetX = -360;
      offsetY = 40;
    } else if (direction === 'right') {
      offsetX = 360;
      offsetY = 40;
    } else {
      offsetX = 0;
      offsetY = 220;
    }

    const newNodeId = `node_${Date.now()}`;
    const newNode: Node<MatchNodeData> = {
      id: newNodeId,
      type: 'matchNode',
      position: {
        x: parentPos.x + offsetX,
        y: parentPos.y + offsetY
      },
      data: {
        roundTitle: '하위 예선 경기',
        homeTeamName: '참가팀 선택',
        awayTeamName: '참가팀 선택',
        dateStr: '일정 미정'
      }
    };

    const newEdge: Edge = {
      id: `e_${newNodeId}_to_${parentId}`,
      source: direction === 'left' ? newNodeId : parentId,
      target: direction === 'left' ? parentId : newNodeId,
      type: 'smoothstep',
      style: { stroke: '#ffffff', strokeWidth: 2.5 }
    };

    const updatedNodes = [...nodes, newNode];
    const updatedEdges = [...edges, newEdge];

    setNodes(updatedNodes);
    setEdges(updatedEdges);
    saveCurrentBoardState(updatedNodes, updatedEdges);
  }, [nodes, edges, setNodes, setEdges, saveCurrentBoardState]);

  // Inject callback functions & teams into node data
  const enrichedNodes = useMemo(() => {
    const sortedTeams = [...rawTeams].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        isAdmin,
        rawTeams: sortedTeams,
        onUpdateTitle: handleUpdateTitle,
        onUpdateTeam: handleUpdateTeam,
        onUpdateScore: handleUpdateScore,
        onDeleteNode: handleDeleteNode,
        onAddChildNode: handleAddChildNode
      }
    }));
  }, [nodes, isAdmin, rawTeams, handleUpdateTitle, handleUpdateTeam, handleUpdateScore, handleDeleteNode, handleAddChildNode]);

  // Add new Bracket Board
  const handleAddBoard = () => {
    const title = prompt('새로운 대진표 이름을 입력하세요 (예: 7위~9위 대진표, 여성부 2부 리그):');
    if (!title || !title.trim()) return;

    const newBoardId = `board_${Date.now()}`;
    const rootNodeId = `final_${Date.now()}`;

    const newBoard: BoardData = {
      id: newBoardId,
      title: title.trim(),
      nodes: [
        {
          id: rootNodeId,
          type: 'matchNode',
          position: { x: 400, y: 200 },
          data: {
            roundTitle: '🏆 챔피언십 결승전',
            homeTeamName: '참가팀 선택',
            awayTeamName: '참가팀 선택',
            dateStr: '일정 미정',
            isFinal: true
          }
        }
      ],
      edges: []
    };

    const updated = [...boards, newBoard];
    setBoards(updated);
    setActiveBoardId(newBoardId);
    localStorage.setItem('tsa_reactflow_bracket_boards_v3', JSON.stringify(updated));
    alert(`[${title.trim()}] 대진표 판이 생성되었습니다!`);
  };

  // Delete Board
  const handleDeleteBoard = (boardId: string) => {
    if (boards.length <= 1) {
      alert('최소 1개 이상의 대진표는 유지되어야 합니다.');
      return;
    }
    if (!window.confirm('이 대진표 판 전체를 삭제하시겠습니까?')) return;

    const updated = boards.filter(b => b.id !== boardId);
    setBoards(updated);
    setActiveBoardId(updated[0].id);
    localStorage.setItem('tsa_reactflow_bracket_boards_v3', JSON.stringify(updated));
  };

  // Add standalone Root Node
  const handleAddRootNode = () => {
    const newRootId = `root_${Date.now()}`;
    const newRoot: Node<MatchNodeData> = {
      id: newRootId,
      type: 'matchNode',
      position: { x: 500, y: 300 },
      data: {
        roundTitle: '🏆 신규 토너먼트 결승',
        homeTeamName: '참가팀 선택',
        awayTeamName: '참가팀 선택',
        dateStr: '일정 미정',
        isFinal: true
      }
    };

    const updatedNodes = [...nodes, newRoot];
    setNodes(updatedNodes);
    saveCurrentBoardState(updatedNodes, edges);
  };

  // Save JSON
  const handleSaveToLocalStorage = () => {
    saveCurrentBoardState(nodes, edges);
    alert('대진표 무한 캔버스 데이터(노드 좌표 및 연결선)가 성공적으로 저장되었습니다!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden animate-fadeIn">
      
      {/* Modal Top Header Bar */}
      <div className="w-full bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between flex-shrink-0 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              <span>TSA 피그마형 무한 캔버스 대진표 빌더 (React Flow)</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-md">
                FIGMA INFINITE CANVAS
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              마우스 드래그 이동(Pan) & 휠 줌(Zoom), 노드 자유 이동, 고무줄 하얀 실선 자동 연동 지원
            </p>
          </div>
        </div>

        {/* Top Action Buttons & Close */}
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <>
              <button
                onClick={handleAddRootNode}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 text-xs font-bold flex items-center space-x-1 transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>+ 결승 노드 추가</span>
              </button>

              <button
                onClick={handleSaveToLocalStorage}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-md shadow-cyan-500/20 active-press transition-all whitespace-nowrap"
              >
                <Save className="w-4 h-4" />
                <span>💾 저장</span>
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Multiple Brackets Tabs Navigation */}
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

      {/* Main React Flow Infinite Canvas Workspace */}
      <div className="flex-1 w-full h-full bg-slate-950 relative">
        <ReactFlow
          nodes={enrichedNodes}
          edges={edges}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            saveCurrentBoardState(nodes, edges);
          }}
          onEdgesChange={(changes) => {
            onEdgesChange(changes);
            saveCurrentBoardState(nodes, edges);
          }}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: '#ffffff', strokeWidth: 2.5 }
          }}
          className="bg-slate-950"
        >
          <Background color="#334155" variant={BackgroundVariant.Dots} gap={24} size={1.5} />
          <Controls className="!bg-slate-900 !border-slate-800 !text-white !rounded-xl overflow-hidden shadow-2xl" />
          <MiniMap
            nodeColor={(node) => (node.data?.isFinal ? '#f59e0b' : '#06b6d4')}
            maskColor="rgba(15, 23, 42, 0.8)"
            className="!bg-slate-900 !border-slate-800 !rounded-xl overflow-hidden shadow-2xl"
          />
        </ReactFlow>
      </div>

      {/* Modal Bottom Footer Status Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-3 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>
            {isAdmin 
              ? '🔒 Figma 무한 캔버스: 마우스 드래그 이동/휠 줌 | 노드 자유 배치 | [+] 버튼 가지치기' 
              : '👁️ 일반 사용자: Figma형 무한 캔버스 실시간 대진표 조회'}
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
