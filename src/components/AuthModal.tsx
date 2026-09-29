import React, { useState, useEffect } from 'react';
import { Lock, Mail, ShieldCheck, X, Sparkles, Shield, CheckSquare, Square } from 'lucide-react';
import { useSupabaseData } from '../context/SupabaseContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: (userEmail: string, teamName?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const { addTeam } = useSupabaseData();
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Login Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form Fields
  const [signupTeamName, setSignupTeamName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);

  // Sync mode with initialMode prop whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setLoading(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (onSuccess) onSuccess(loginEmail);
      onClose();
    }, 500);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedPrivacy) {
      alert('개인정보 수집 및 이용 동의 항목에 체크해 주세요.');
      return;
    }
    if (!signupTeamName.trim() || !signupEmail.trim() || !signupPassword.trim()) return;

    try {
      setLoading(true);
      await addTeam(signupTeamName);
      if (onSuccess) onSuccess(signupEmail, signupTeamName);
      onClose();
      alert(`[${signupTeamName}] 팀 회원가입이 성공적으로 완료되었습니다!`);
    } catch (err) {
      console.error('Signup team creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-sm rounded-2xl p-6 border border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header (Instruction 1: Fixed "TSA 회원가입" title) */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center mx-auto mb-2 shadow-inner">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'TSA 회원 로그인' : 'TSA 회원가입'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'TSA 공식 플랫폼에 로그인하세요.'
              : '대회 참가 팀 등록 및 기록 관리를 위해 회원가입을 완료하세요.'}
          </p>
        </div>

        {/* MODE 1: LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">이메일 주소</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">비밀번호</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/25 active-press transition-all mt-4 flex items-center justify-center space-x-1.5"
            >
              {loading ? (
                <span>로그인 중...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>로그인</span>
                </>
              )}
            </button>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
              <p>
                계정이 없으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-orange-400 font-bold underline ml-1 hover:text-orange-300"
                >
                  회원가입
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* MODE 2: SIGNUP FORM */
          <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">팀명 (참가 팀 이름)</label>
              <div className="relative">
                <Shield className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="예: TSA 우먼스 FC"
                  value={signupTeamName}
                  onChange={(e) => setSignupTeamName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">이메일 주소</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">비밀번호</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* Mandatory Privacy Policy Checkbox */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setAgreedPrivacy(!agreedPrivacy)}
                className="flex items-start space-x-2 text-left cursor-pointer text-slate-300 hover:text-white"
              >
                {agreedPrivacy ? (
                  <CheckSquare className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
                )}
                <span className="text-[11px] leading-tight">
                  <span className="text-orange-400 font-bold">[필수]</span> 개인정보 수집 및 이용 동의 (대회 참가자 확인 및 팀 전적 관리 목적)
                </span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !agreedPrivacy}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg active-press transition-all mt-4 flex items-center justify-center space-x-1.5 ${
                agreedPrivacy
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {loading ? (
                <span>가입 처리 중...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>회원가입 완료</span>
                </>
              )}
            </button>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
              <p>
                이미 계정이 있으신가요?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-orange-400 font-bold underline ml-1 hover:text-orange-300"
                >
                  로그인
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
