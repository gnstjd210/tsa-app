import React from 'react';
import { Home, Megaphone, Award, CalendarDays, Shield } from 'lucide-react';

export type TabType = 'home' | 'announcements' | 'standings' | 'schedule' | 'teams';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'announcements', label: '공지사항', icon: Megaphone },
    { id: 'standings', label: '조별 순위', icon: Award },
    { id: 'schedule', label: '경기 일정', icon: CalendarDays },
    { id: 'teams', label: '팀 정보', icon: Shield },
  ] as const;

  return (
    <>
      {/* Top Tab Bar for Desktop */}
      <nav className="hidden md:block bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-[61px] z-30">
        <div className="max-w-md mx-auto flex items-center justify-around px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 py-3 px-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                  isActive
                    ? 'border-orange-500 text-orange-400 bg-orange-500/5 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (5 Tabs) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav px-2 py-1.5 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-0.5 text-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl active-press transition-all ${
                  isActive
                    ? 'text-orange-400 font-bold bg-gradient-to-b from-orange-500/15 to-transparent'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-6 h-[2.5px] bg-orange-500 rounded-full shadow-[0_0_8px_#f97316]" />
                )}
                <Icon
                  className={`w-4.5 h-4.5 mb-1 flex-shrink-0 transition-transform ${
                    isActive ? 'scale-110 text-orange-400' : 'text-slate-400'
                  }`}
                />
                <span className="text-[10px] tracking-tight whitespace-nowrap font-medium">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
