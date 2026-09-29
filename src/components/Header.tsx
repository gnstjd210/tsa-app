import React from 'react';
import { Trophy, LogIn, UserPlus, Sparkles, Users, User } from 'lucide-react';
import { useSupabaseData } from '../context/SupabaseContext';

interface HeaderProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenMemberManagement?: () => void;
  currentUser?: string | null;
  onLogout?: () => void;
  isAdminRoute?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuth,
  onOpenMemberManagement,
  currentUser,
  onLogout,
  isAdminRoute = false
}) => {
  const { sponsorTitle } = useSupabaseData();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Logo & Brand Area */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 p-[2px] shadow-lg shadow-orange-500/20 flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-orange-500" />
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            {/* Line 1: TSA Text + OFFICIAL Badge */}
            <div className="flex items-center space-x-1.5">
              <span className="font-sports text-2xl font-black tracking-wider text-white leading-none whitespace-nowrap">
                TSA
              </span>
              <span className="text-[9px] uppercase font-extrabold tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap shadow-sm">
                OFFICIAL
              </span>
            </div>

            {/* Line 2: TNT SPORTS ACADEMY */}
            <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase leading-snug whitespace-nowrap">
              TNT SPORTS ACADEMY
            </span>
          </div>
        </div>

        {/* Sponsor & Auth / Admin Member Management Section */}
        <div className="flex items-center space-x-2.5 flex-shrink-0">
          {/* Instruction 2: Dynamic Sponsor Title from Supabase */}
          <div className="hidden sm:flex flex-col items-end justify-center px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/30 text-right leading-tight">
            <div className="flex items-center space-x-1 text-[10px] font-black text-orange-400 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{sponsorTitle || '이데일리컵'}</span>
            </div>
            <span className="text-[9px] font-bold text-slate-300 tracking-wider whitespace-nowrap">
              공식대회
            </span>
          </div>

          {/* User Auth Buttons OR Admin Member Management Button (Instruction 3) */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {isAdminRoute ? (
              <button
                onClick={onOpenMemberManagement}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-red-500/20 active-press transition-all whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5" />
                <span>회원 관리</span>
              </button>
            ) : currentUser ? (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => alert(`👤 내 프로필 정보\n계정: ${currentUser}`)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center space-x-1 hover:border-orange-500/50 transition-all max-w-[120px] truncate"
                  title="마이페이지 (내 프로필)"
                >
                  <User className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                  <span className="truncate">{currentUser.split('@')[0]}</span>
                </button>

                <button
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold active-press transition-all whitespace-nowrap"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-orange-500/50 text-slate-200 text-xs font-semibold flex items-center space-x-1 active-press transition-all whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5 text-orange-400" />
                  <span>로그인</span>
                </button>

                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center space-x-1 shadow-md shadow-orange-500/20 active-press transition-all whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>회원가입</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sponsor Banner Row */}
      <div className="sm:hidden mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[11px] px-1">
        <span className="text-slate-400 font-medium">1회 women Tournament</span>
        <div className="flex items-center space-x-1 text-orange-400 font-extrabold text-[10px] bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full">
          <span>{sponsorTitle || '이데일리컵'}</span>
          <span className="text-slate-300">공식대회</span>
        </div>
      </div>
    </header>
  );
};
