import React, { useState, useEffect } from 'react';
import { Lock, Mail, ShieldCheck, X, Sparkles, Shield, CheckSquare, Square, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSupabaseData } from '../context/SupabaseContext';
import { createProfile } from '../lib/dataService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
  onSuccess?: (userEmail: string, teamName?: string, isAdmin?: boolean) => void;
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

  // Password Policy Checker (Minimum 8 chars, letter, number, special char)
  const isMinLength = signupPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(signupPassword);
  const hasNumber = /[0-9]/.test(signupPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(signupPassword);
  const isPasswordValid = isMinLength && hasLetter && hasNumber && hasSpecial;

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
    const rawInput = loginEmail.trim();
    const passwordInput = loginPassword.trim();
    if (!rawInput || !passwordInput) return;

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      // Requirement 1 & 2: Admin Backdoor Shortcut Check ('admin' or 'tsa123' & password '2341')
      const isAdminShortcut =
        (rawInput.toLowerCase() === 'admin' || rawInput.toLowerCase() === 'tsa123') &&
        passwordInput === '2341';

      if (isAdminShortcut) {
        const masterAdminEmail = 'admin@tsacup.com';
        if (onSuccess) onSuccess(masterAdminEmail, 'TSA 최고 관리자', true);
        onClose();
        return;
      }

      // Requirement 4: Regular user email format validation check
      if (!rawInput.includes('@')) {
        alert('올바른 이메일 형식을 입력해 주세요 (예: name@example.com).');
        return;
      }

      // Regular User Login Flow
      if (onSuccess) onSuccess(rawInput, undefined, false);
      onClose();
    }, 400);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedPrivacy) {
      alert('개인정보 수집 및 이용 동의 항목에 체크해 주세요.');
      return;
    }
    if (!signupTeamName.trim() || !signupEmail.trim() || !signupPassword.trim()) return;

    if (!isPasswordValid) {
      alert('비밀번호는 최소 8자리 이상, 영문, 숫자, 특수문자를 포함해야 합니다.');
      return;
    }

    try {
      setLoading(true);
      // Requirement 2: Insert ONLY into profiles table. DO NOT insert into official teams table.
      await createProfile(signupEmail.trim(), signupTeamName.trim(), 'user');
      // Instant login & session creation
      if (onSuccess) onSuccess(signupEmail.trim(), signupTeamName.trim(), false);
      onClose();
      alert(`[${signupTeamName.trim()}] 회원가입이 완료되었습니다! (관리자 승인 후 공식 참가팀으로 연동됩니다)`);
    } catch (err) {
      console.error('Signup profile creation error:', err);
      alert('회원가입 처리 중 오류가 발생했습니다.');
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
          <form noValidate onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">이메일 주소</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  autoCapitalize="none"
                  autoComplete="username"
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
                  placeholder="8자리 이상 (영문, 숫자, 특수문자)"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  className={`w-full bg-slate-900 border rounded-xl pl-9 pr-3 py-2.5 text-white focus:outline-none transition-colors ${
                    signupPassword
                      ? isPasswordValid
                        ? 'border-emerald-500'
                        : 'border-rose-500'
                      : 'border-slate-800 focus:border-orange-500'
                  }`}
                />
              </div>

              {/* Real-time Password Helper Feedback Text */}
              {signupPassword.length > 0 && (
                <div className="mt-1.5 text-[11px] leading-snug">
                  {isPasswordValid ? (
                    <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>✅ 사용 가능한 안전한 비밀번호입니다!</span>
                    </div>
                  ) : (
                    <div className="space-y-0.5 text-rose-400 font-medium">
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                        <span>비밀번호 필수 조건 (8자 이상, 영문, 숫자, 특수문자):</span>
                      </div>
                      <div className="pl-4 flex flex-wrap gap-x-2 text-[10px]">
                        <span className={isMinLength ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {isMinLength ? '✓' : '•'} 8자 이상
                        </span>
                        <span className={hasLetter ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {hasLetter ? '✓' : '•'} 영문
                        </span>
                        <span className={hasNumber ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {hasNumber ? '✓' : '•'} 숫자
                        </span>
                        <span className={hasSpecial ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {hasSpecial ? '✓' : '•'} 특수문자
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
              disabled={loading || !agreedPrivacy || !isPasswordValid}
              className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg active-press transition-all mt-4 flex items-center justify-center space-x-1.5 ${
                agreedPrivacy && isPasswordValid
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
