import React, { useState } from 'react';
import { Calendar, ExternalLink, Flame, Sparkles, ChevronRight, Award, Trophy, Users, X } from 'lucide-react';

interface SponsorItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  bannerBg: string;
  link?: string;
  badge: string;
}

export const HomeTab: React.FC<{ onNavigateTab: (tab: any) => void }> = ({ onNavigateTab }) => {
  const [selectedSponsor, setSelectedSponsor] = useState<SponsorItem | null>(null);

  // Upcoming Tournaments Mock Schedule
  const upcomingSchedule = [
    {
      id: '1',
      title: '1회 women Tournament (이데일리 컵)',
      date: '2026. 10. 01 ~ 10. 15',
      location: '해누리체육공원 풋살장',
      status: '진행 중',
      participants: '총 48개 팀 (1조 ~ 6조)',
      highlight: true
    },
    {
      id: '2',
      title: 'TSA 윈터 마스터즈 챔피언십',
      date: '2026. 12. 05 ~ 12. 20',
      location: 'TSA 메인 실내 에어돔구장',
      status: '접수 예정',
      participants: '선착순 32개 팀 모집 예정',
      highlight: false
    },
    {
      id: '3',
      title: '2027 TSA 전국 아마추어 유소년/여성 리그',
      date: '2027. 03. 10 ~ 04. 30',
      location: '서울/경기 주요 체육공원',
      status: '기획 중',
      participants: '전국 단위 클럽 대항전',
      highlight: false
    }
  ];

  // Sponsor List
  const sponsors: SponsorItem[] = [
    {
      id: 'edaily',
      name: '이데일리 (eDaily)',
      tagline: '대한민국 대표 종합 경제지',
      description: '이데일리 컵 "1회 women Tournament"의 메인 후원사로, 대한민국 여성 스포츠 저변 확대 및 건강한 스포츠 문화 조성을 지원합니다.',
      logo: '📰',
      bannerBg: 'from-amber-600/30 to-orange-900/40',
      badge: 'MAIN SPONSOR',
      link: 'https://www.edaily.co.kr'
    },
    {
      id: 'tsa-gear',
      name: 'TSA SPORT GEAR',
      tagline: '공식 스포츠 용품 & 유니폼 파트너',
      description: 'TSA 전용 최고급 여성 스포츠웨어 및 대회 공식 경기구를 제공합니다. 참가팀 전원 20% 유니폼 할인 쿠폰 제공!',
      logo: '⚽',
      bannerBg: 'from-blue-600/30 to-slate-900/40',
      badge: 'OFFICIAL PARTNER',
      link: 'https://tntsports.co.kr'
    },
    {
      id: 'haenuri',
      name: '해누리체육공원',
      tagline: '최상급 인조잔디 특설 구장',
      description: '쾌적한 관람석과 주차 시설, 최첨단 조명 시설을 갖춘 "1회 women Tournament" 지정 경기장입니다.',
      logo: '🏟️',
      bannerBg: 'from-emerald-600/30 to-slate-900/40',
      badge: 'VENUE PARTNER'
    }
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-4">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-6 border border-orange-500/30 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-orange-950/30">
        <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-15">
          <Trophy className="w-48 h-48 text-orange-500" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md">
              이데일리 컵
            </span>
            <span className="text-xs text-orange-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> OFFICIAL PLATFORM
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight font-sports">
            1회 women Tournament
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
            TSA 공식 스포츠 대회 플랫폼에 오신 것을 환영합니다! 조별 순위, 경기 일정 및 팀 전적을 실시간으로 확인하세요.
          </p>

          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={() => onNavigateTab('standings')}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/25 active-press transition-all flex items-center space-x-1.5"
            >
              <Award className="w-4 h-4" />
              <span>조별 순위 보기</span>
            </button>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 active-press transition-all flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>경기 일정 확인</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: 향후 TSA 대회 일정 (Upcoming Schedule Box) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-5 bg-orange-500 rounded-full" />
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>향후 TSA 대회 일정</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-semibold text-slate-400">
                SCHEDULE
              </span>
            </h3>
          </div>
        </div>

        <div className="space-y-2.5">
          {upcomingSchedule.map((item) => (
            <div
              key={item.id}
              className={`glass-panel rounded-2xl p-4 border transition-all hover:border-slate-700 ${
                item.highlight
                  ? 'border-orange-500/40 bg-gradient-to-r from-orange-500/10 via-slate-900 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.highlight
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status}
                    </span>
                    <span className="text-xs font-bold text-white">{item.title}</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 mt-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                      <span>{item.date}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>{item.participants} ({item.location})</span>
                    </div>
                  </div>
                </div>

                {item.highlight && (
                  <Flame className="w-5 h-5 text-orange-500 animate-bounce flex-shrink-0" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: 스폰서 홍보용 게시글/배너 리스트 */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-5 bg-amber-500 rounded-full" />
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>스폰서 홍보 & 파트너십</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
              SPONSORS
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              onClick={() => setSelectedSponsor(sponsor)}
              className={`glass-panel rounded-2xl p-4 border border-slate-800 hover:border-amber-500/50 bg-gradient-to-r ${sponsor.bannerBg} transition-all cursor-pointer group shadow-lg`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner group-hover:scale-105 transition-transform">
                    {sponsor.logo}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 tracking-widest uppercase block mb-0.5">
                      {sponsor.badge}
                    </span>
                    <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {sponsor.name}
                    </h4>
                    <p className="text-xs text-slate-300">{sponsor.tagline}</p>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsor Detail Modal */}
      {selectedSponsor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-2xl p-5 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">{selectedSponsor.logo}</span>
                <div>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block">
                    {selectedSponsor.badge}
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedSponsor.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedSponsor(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                {selectedSponsor.description}
              </p>

              {selectedSponsor.link && (
                <a
                  href={selectedSponsor.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold flex items-center justify-center space-x-1.5 transition-all shadow-md mt-2"
                >
                  <span>스폰서 공식 홈페이지 방문</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={() => setSelectedSponsor(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
