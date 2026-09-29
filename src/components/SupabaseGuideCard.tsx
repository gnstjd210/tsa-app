import React, { useState } from 'react';
import { Database, Check, Copy, Key, Server, Terminal } from 'lucide-react';

export const SupabaseGuideCard: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const sqlCode = `-- 1. Tournaments
CREATE TABLE tournaments (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, start_date DATE, end_date DATE, status VARCHAR(50) DEFAULT 'upcoming', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- 2. Groups
CREATE TABLE groups (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE, name VARCHAR(100) NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- 3. Teams
CREATE TABLE teams (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name VARCHAR(255) NOT NULL, logo_url TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- 4. Group_Teams
CREATE TABLE group_teams (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), group_id UUID REFERENCES groups(id) ON DELETE CASCADE, team_id UUID REFERENCES teams(id) ON DELETE CASCADE, played INT DEFAULT 0, won INT DEFAULT 0, drawn INT DEFAULT 0, lost INT DEFAULT 0, goals_for INT DEFAULT 0, goals_against INT DEFAULT 0, goal_difference INT DEFAULT 0, points INT DEFAULT 0, UNIQUE(group_id, team_id));

-- 5. Matches
CREATE TABLE matches (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), group_id UUID REFERENCES groups(id) ON DELETE CASCADE, home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE, away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE, match_time TIMESTAMP WITH TIME ZONE, field_location VARCHAR(255), home_score INT DEFAULT 0, away_score INT DEFAULT 0, status VARCHAR(50) DEFAULT 'scheduled', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());

-- 6. Announcements
CREATE TABLE announcements (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE, title VARCHAR(255) NOT NULL, content TEXT, is_pinned BOOLEAN DEFAULT false, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 glass-panel rounded-2xl border border-orange-500/30 overflow-hidden shadow-2xl">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-orange-600/20 via-slate-900 to-slate-900 px-5 py-4 border-b border-orange-500/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>[2단계] Supabase DB 스키마 생성 및 연동 대기</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                SQL 준비됨
              </span>
            </h3>
            <p className="text-xs text-slate-400">아래 SQL 코드를 Supabase SQL Editor에서 실행해 주세요.</p>
          </div>
        </div>

        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 active:scale-95 transition-all shadow-md"
        >
          {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? '복사 완료!' : 'SQL 복사'}</span>
        </button>
      </div>

      {/* Steps Guide */}
      <div className="p-4 bg-slate-950/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <Terminal className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <span className="text-slate-300">1. SQL Editor에 붙여넣기 후 Run</span>
          </div>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <Server className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300">2. Project Settings API 접속</span>
          </div>
          <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <Key className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-slate-300">3. Project URL & Anon Key 전달</span>
          </div>
        </div>

        {/* Code Snippet Box */}
        <div className="relative group">
          <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed selection:bg-orange-500/30">
            <code>{sqlCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
