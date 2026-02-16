import React from 'react';
import { Search, LayoutGrid, List, ShieldCheck } from 'lucide-react';
import type { ViewMode } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onTitleDoubleClick: () => void;
  isAdmin?: boolean;
  onAdminToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onTitleDoubleClick,
  isAdmin = false,
  onAdminToggle
}) => {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-4 shadow-sm">
      <div className="max-w-6xl mx-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black tracking-tight text-slate-800">
            Mowbray Public
            <span
              onDoubleClick={onTitleDoubleClick}
              className="text-[10px] uppercase tracking-[0.25em] text-emerald-600 font-bold block mt-1 cursor-default select-none"
            >
              Lost & Found Hub
            </span>
          </h1>

          {/* Admin Toggle for Development */}
          {onAdminToggle && (isAdmin || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) && (
            <button
              onClick={onAdminToggle}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isAdmin
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              title={isAdmin ? "Switch to normal mode" : "Switch to Admin Mode"}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              {isAdmin ? 'Admin' : 'Normal'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4" />
            <input
              type="text"
              placeholder="name, description, location..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl ${viewMode === 'grid' ? 'bg-white text-emerald-600' : 'text-slate-50'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl ${viewMode === 'list' ? 'bg-white text-emerald-600' : 'text-slate-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
