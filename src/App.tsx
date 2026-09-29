import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation, type TabType } from './components/Navigation';
import { HomeTab } from './components/tabs/HomeTab';
import { AnnouncementsTab } from './components/tabs/AnnouncementsTab';
import { GroupStandingsTab } from './components/tabs/GroupStandingsTab';
import { MatchScheduleTab } from './components/tabs/MatchScheduleTab';
import { TeamInfoTab } from './components/tabs/TeamInfoTab';
import { AdminPanel } from './components/admin/AdminPanel';
import { MemberManagementModal } from './components/admin/MemberManagementModal';
import { AuthModal } from './components/AuthModal';
import { SupabaseProvider, useSupabaseData } from './context/SupabaseContext';
import { CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

function AppContent() {
  const { refreshing, refreshAllData } = useSupabaseData();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(false);

  // User Auth & Admin Member Modal State
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState<boolean>(false);

  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const isTargetingAdmin = path === '/admin' || path.startsWith('/admin') || window.location.hash === '#admin';
      
      if (isTargetingAdmin) {
        const isAdminAuthenticated =
          sessionStorage.getItem('tsa_admin_auth') === 'true' ||
          localStorage.getItem('tsa_admin_auth') === 'true';

        if (!isAdminAuthenticated) {
          // Protected Route Guard: Immediately eject unauthenticated direct URL access back to '/'
          window.history.replaceState({}, '', '/');
          setIsAdminRoute(false);
          alert('🔒 [보안 방어] 관리자 접근 권한이 없습니다. 메인 화면(/)으로 즉시 이동(Redirect)되었습니다.');
          return;
        }
        setIsAdminRoute(true);
      } else {
        setIsAdminRoute(false);
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (email: string, _teamName?: string, isAdmin?: boolean) => {
    setCurrentUser(email);
    const isMasterAdmin = isAdmin || email === 'admin@tsacup.com' || email.toLowerCase().includes('admin');
    
    if (isMasterAdmin) {
      sessionStorage.setItem('tsa_admin_auth', 'true');
      localStorage.setItem('tsa_admin_auth', 'true');
      window.history.pushState({}, '', '/admin');
      setIsAdminRoute(true);
      alert('🔑 [최고 관리자 인증] 대표님 환영합니다! 어드민 대시보드(/admin)로 즉시 이동합니다.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('tsa_admin_auth');
    localStorage.removeItem('tsa_admin_auth');
    window.history.replaceState({}, '', '/');
    setIsAdminRoute(false);
  };

  const navigateToAdmin = (e: React.MouseEvent) => {
    e.preventDefault();
    const isAdminAuthenticated =
      sessionStorage.getItem('tsa_admin_auth') === 'true' ||
      localStorage.getItem('tsa_admin_auth') === 'true';

    if (!isAdminAuthenticated) {
      const pwd = prompt('🔒 관리자 비밀번호를 입력하세요 (기본: admin123):');
      if (pwd === 'admin123' || pwd === 'tsa2026') {
        sessionStorage.setItem('tsa_admin_auth', 'true');
        localStorage.setItem('tsa_admin_auth', 'true');
        window.history.pushState({}, '', '/admin');
        setIsAdminRoute(true);
        alert('🔑 관리자 인증 성공! 대시보드로 이동합니다.');
      } else if (pwd !== null) {
        alert('❌ 관리자 비밀번호가 일치하지 않습니다.');
      }
    } else {
      window.history.pushState({}, '', '/admin');
      setIsAdminRoute(true);
    }
  };

  const navigateToHome = (e: React.MouseEvent) => {
    e.preventDefault();
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'announcements':
        return <AnnouncementsTab isAdmin={isAdminRoute} />;
      case 'standings':
        return <GroupStandingsTab />;
      case 'schedule':
        return <MatchScheduleTab isAdmin={isAdminRoute} />;
      case 'teams':
        return <TeamInfoTab />;
      default:
        return <HomeTab onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-sports-pattern flex flex-col pb-20 md:pb-8">
      {/* Restored Header with TSA title, sponsor text, login/signup buttons or admin member button */}
      <Header
        onOpenAuth={handleOpenAuth}
        onOpenMemberManagement={() => setShowMemberModal(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        isAdminRoute={isAdminRoute}
      />

      {/* 5 Tabs Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-4 space-y-4">
        {/* Admin Dashboard if on /admin Route (No Red Warning Banner) */}
        {isAdminRoute ? (
          <AdminPanel
            onNavigateTab={(tab) => setActiveTab(tab)}
            onManualSeed={refreshAllData}
            seeding={refreshing}
          />
        ) : (
          <div className="glass-panel rounded-xl p-3 border border-emerald-500/30 flex items-center justify-between text-xs bg-emerald-500/5">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-emerald-300">1회 women Tournament (이데일리 컵)</span>
                <span className="text-[10px] text-slate-400 block truncate max-w-[160px] sm:max-w-none">
                  Supabase DB & Storage 실시간 연동 완료
                </span>
              </div>
            </div>

            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] active-press transition-all whitespace-nowrap"
              title="데이터 동기화"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-orange-400' : 'text-slate-400'}`} />
              <span>동기화</span>
            </button>
          </div>
        )}

        {/* Active Tab Content */}
        <div className="transition-all duration-300">
          {renderActiveTab()}
        </div>

        {/* Platform Footer */}
        <footer className="pt-6 text-center border-t border-slate-900 space-y-2">
          <div className="flex items-center justify-center space-x-2 text-slate-500 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>TSA 1회 women Tournament (이데일리 컵) &copy; 2026</span>
          </div>

          <div className="text-[10px] text-slate-600">
            {isAdminRoute ? (
              <a href="/" onClick={navigateToHome} className="hover:underline">
                [일반 사용자 메인화면으로 이동]
              </a>
            ) : (
              <a href="/admin" onClick={navigateToAdmin} className="hover:underline text-slate-600">
                [관리자 전용 페이지 /admin]
              </a>
            )}
          </div>
        </footer>
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
        onSuccess={handleAuthSuccess}
      />

      {/* Admin Member Management Modal */}
      <MemberManagementModal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
      />
    </div>
  );
}

export function App() {
  return (
    <SupabaseProvider>
      <AppContent />
    </SupabaseProvider>
  );
}

export default App;
