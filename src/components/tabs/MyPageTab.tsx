import React, { useState, useEffect } from 'react';
import { User, Lock, ShieldCheck, KeyRound, Sparkles, AlertCircle, CheckCircle2, Clock, Trophy, Percent, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Profile, Team } from '../../lib/supabase';
import { useSupabaseData } from '../../context/SupabaseContext';
import { getProfileByEmail, getTeamDetailedStats, formatGroupName } from '../../lib/dataService';

interface MyPageTabProps {
  currentUser: string | null;
}

interface TeamWithStats extends Team {
  groupName?: string;
  stats?: {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDiff: number;
    points: number;
    winRate: number;
  };
}

export const MyPageTab: React.FC<MyPageTabProps> = ({ currentUser }) => {
  const { teams, groups, fetchGroupStandings } = useSupabaseData();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [matchedTeam, setMatchedTeam] = useState<TeamWithStats | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password policy check
  const isMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isNewPasswordValid = isMinLength && hasLetter && hasNumber && hasSpecial;
  const isPasswordMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  // Load User Profile & Match Team
  useEffect(() => {
    const loadUserData = async () => {
      if (!currentUser) {
        setLoadingProfile(false);
        return;
      }

      try {
        setLoadingProfile(true);
        const userProfile = await getProfileByEmail(currentUser);
        setProfile(userProfile);

        if (userProfile?.team_name) {
          const normUserTeam = userProfile.team_name.trim().toLowerCase();
          const foundTeam = teams.find(
            (t) => t.name.trim().toLowerCase() === normUserTeam
          );

          if (foundTeam) {
            const stats = await getTeamDetailedStats(foundTeam.id);
            
            // Find assigned group name
            let assignedGroup = '미배정';
            for (const g of groups) {
              const standings = await fetchGroupStandings(g.id);
              if (standings.some(gt => gt.team_id === foundTeam.id)) {
                assignedGroup = formatGroupName(g.name);
                break;
              }
            }

            setMatchedTeam({
              ...foundTeam,
              groupName: assignedGroup,
              stats
            });
          } else {
            setMatchedTeam(null);
          }
        }
      } catch (err) {
        console.error('Error loading MyPage user profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadUserData();
  }, [currentUser, teams, groups]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isNewPasswordValid) {
      setToastMessage({ type: 'error', text: '새 비밀번호는 8자 이상, 영문, 숫자, 특수문자를 모두 포함해야 합니다.' });
      return;
    }

    if (!isPasswordMatch) {
      setToastMessage({ type: 'error', text: '새 비밀번호 확인이 일치하지 않습니다.' });
      return;
    }

    try {
      setChangingPassword(true);
      setToastMessage(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      setToastMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Password change error:', err);
      setToastMessage({
        type: 'error',
        text: err?.message || '비밀번호 변경 중 오류가 발생했습니다. 다시 시도해 주세요.'
      });
    } finally {
      setChangingPassword(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full glass-panel rounded-2xl p-8 text-center border border-slate-800 space-y-3">
        <User className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-bold text-white">로그인이 필요합니다</h3>
        <p className="text-xs text-slate-400">마이페이지를 확인하려면 먼저 로그인해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* 1. Header Profile Banner */}
      <div className="w-full glass-panel rounded-2xl p-5 border-l-4 border-l-orange-500 bg-gradient-to-r from-orange-500/10 via-slate-900 to-slate-900 relative overflow-hidden">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shadow-inner flex-shrink-0">
            <User className="w-6 h-6 text-orange-400" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight truncate">
                {currentUser.split('@')[0]} 님
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {profile?.role === 'admin' ? '최고 관리자' : 'TSA 회원'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">{currentUser}</p>
          </div>
        </div>
      </div>

      {/* Toast / Notification Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center space-x-2 text-xs font-semibold animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 2. Password Change Form */}
      <div className="w-full glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-bold text-white border-b border-slate-800 pb-2.5">
          <KeyRound className="w-4 h-4 text-orange-400" />
          <span>비밀번호 변경 (Supabase Auth)</span>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">현재 비밀번호 (확인용)</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                placeholder="현재 비밀번호 입력"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">새 비밀번호</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="8자 이상 (영문, 숫자, 특수문자)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full bg-slate-900 border rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none transition-colors ${
                  newPassword
                    ? isNewPasswordValid
                      ? 'border-emerald-500'
                      : 'border-rose-500'
                    : 'border-slate-800 focus:border-orange-500'
                }`}
              />
            </div>

            {/* Live Helper indicator */}
            {newPassword.length > 0 && (
              <div className="mt-1.5 text-[11px]">
                {isNewPasswordValid ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>사용 가능한 안전한 비밀번호입니다.</span>
                  </span>
                ) : (
                  <span className="text-rose-400 font-medium">
                    8자 이상, 영문, 숫자, 특수문자를 모두 포함해야 합니다.
                  </span>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">새 비밀번호 확인</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                placeholder="새 비밀번호 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full bg-slate-900 border rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none transition-colors ${
                  confirmPassword
                    ? isPasswordMatch
                      ? 'border-emerald-500'
                      : 'border-rose-500'
                    : 'border-slate-800 focus:border-orange-500'
                }`}
              />
            </div>
            {confirmPassword.length > 0 && (
              <div className="mt-1.5 text-[11px]">
                {isPasswordMatch ? (
                  <span className="text-emerald-400 font-semibold">✓ 비밀번호 확인 일치</span>
                ) : (
                  <span className="text-rose-400 font-medium">비밀번호가 일치하지 않습니다.</span>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={changingPassword || !isNewPasswordValid || !isPasswordMatch}
            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-md active-press transition-all flex items-center justify-center space-x-1.5 ${
              isNewPasswordValid && isPasswordMatch
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{changingPassword ? '비밀번호 변경 중...' : '비밀번호 변경 저장'}</span>
          </button>
        </form>
      </div>

      {/* 3. My Team Dashboard (Requirement 4) */}
      <div className="w-full glass-panel rounded-2xl p-5 border border-purple-500/30 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-400">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span>내 팀 정보 & 공식 전적 대시보드</span>
          </div>
          <span className="text-[10px] text-slate-500">teams & profiles 매칭</span>
        </div>

        {loadingProfile ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            내 팀 정보를 조회하는 중...
          </div>
        ) : matchedTeam ? (
          /* Case A: Approved & Matched Official Team */
          <div className="space-y-3 animate-fadeIn">
            <div className="p-4 bg-slate-900 rounded-2xl border border-purple-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {matchedTeam.logo_url ? (
                    <img
                      src={matchedTeam.logo_url}
                      alt={matchedTeam.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-700 shadow-md bg-slate-950"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Shield className="w-6 h-6" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-base font-bold text-white">{matchedTeam.name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✅ 승인완료
                      </span>
                    </div>
                    <span className="text-xs text-purple-400 font-semibold block mt-0.5">
                      소속: {matchedTeam.groupName || '1조'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">총 승점</span>
                  <span className="text-xl font-extrabold text-amber-400 font-sports">
                    {matchedTeam.stats?.points || 0} PTS
                  </span>
                </div>
              </div>

              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">경기 수</span>
                  <span className="font-bold text-white text-sm">{matchedTeam.stats?.played || 0}전</span>
                </div>

                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">승 / 무 / 패</span>
                  <span className="font-bold text-slate-200 text-xs">
                    {matchedTeam.stats?.won || 0}승 {matchedTeam.stats?.drawn || 0}무 {matchedTeam.stats?.lost || 0}패
                  </span>
                </div>

                <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">승률</span>
                  <span className="font-bold text-purple-400 text-xs">{matchedTeam.stats?.winRate || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Case B: Pending Approval / Unmatched Team */
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-amber-500/30 space-y-3 text-center animate-fadeIn">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 inline-block">
                ⏳ 승인 대기 중
              </span>
              <p className="text-sm font-bold text-slate-200">
                대회 주최측에서 팀 정보를 승인 및 연동 중입니다.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1 text-slate-400">
              <div>
                <span className="text-slate-500">가입 신청 팀명: </span>
                <span className="font-bold text-amber-400">{profile?.team_name || '미입력'}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                관리자가 `/admin` 대시보드에서 팀을 공식 참가팀으로 등록하고 조 배정을 완료하면 대시보드에 실시간 전적이 연동됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
