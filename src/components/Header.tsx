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
  // 參考學校官網配色：
  // 深藍色 (Navy): #002664 (接近 Tailwind 的 blue-950)
  // 綠色 (Green): #008542 (接近 Tailwind 的 emerald-700)

  return (
    <header className="sticky top-0 z-50 bg-[#002664] text-white px-4 py-4 shadow-xl border-b-4 border-[#008542]">
      <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Logo 與 標題區 */}
        <div className="flex items-center gap-4">
          <div className="cursor-pointer" onDoubleClick={onTitleDoubleClick}>
            <h1 className="text-xl font-bold tracking-tight leading-none">
              Mowbray Public
              <span className="text-[11px] uppercase tracking-[0.2em] text-emerald-400 font-extrabold block mt-1">
                Lost & Found Hub
              </span>
            </h1>
          </div>

          {/* 管理員切換按鈕 */}
          {onAdminToggle && (isAdmin || (window.location.hostname === 'localhost')) && (
            <button
              onClick={onAdminToggle}
              className={`flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${isAdmin
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                : 'bg-blue-900/50 text-blue-200 hover:bg-blue-800 border border-blue-700'
                }`}
            >
              <ShieldCheck className="w-3 h-3 mr-1.5" />
              {isAdmin ? 'ADMIN MODE' : 'STAFF'}
            </button>
          )}
        </div>

        {/* 搜尋與切換視圖區 */}
        <div className="flex items-center gap-2 grow max-w-lg">
          <div className="relative flex-1">
            {/* 修正搜尋圖示：增加 z-index 並調整顏色對比 */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Search className="w-4 h-4 text-[#002664]" />
            </div>
            <input
              type="text"
              placeholder="Search for name, description and location" className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-transparent rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-white outline-none transition-all shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 視圖切換按鈕 */}
          <div className="flex bg-blue-950/40 p-1 rounded-xl border border-blue-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800'
                }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800'
                }`}
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