import React, { useState, useEffect, useRef } from 'react';
import { Search, LayoutGrid, List, ShieldCheck, Sun, Moon, Sparkles, Loader2 } from 'lucide-react';
import type { ViewMode } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onTitleDoubleClick?: () => void;
  isAdmin?: boolean;
  onAdminToggle?: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isSemanticSearch: boolean;
  setIsSemanticSearch: (value: boolean) => void;
  isEmbeddingLoading: boolean;
}

const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  onTitleDoubleClick,
  isAdmin = false,
  onAdminToggle,
  isDarkMode,
  toggleDarkMode,
  isSemanticSearch,
  setIsSemanticSearch,
  isEmbeddingLoading
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 參考學校官網配色：
  // 深藍色 (Navy): #002664 (接近 Tailwind 的 blue-950)
  // 綠色 (Green): #008542 (接近 Tailwind 的 emerald-700)
  // Dark mode adjustments:
  // Using slate-900 for dark background, but Header uses specific branding colors.
  // We can keep the branding colors but maybe slightly darken or adjust for contrast if needed.
  // However, sticky header usually stays consistent. Let's keep the brand colors as they are robust.

  return (
    <header className={`sticky top-0 z-50 bg-blue-900 text-white px-4 py-4 shadow-xl border-b-4 border-brand-green dark:border-emerald-600 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
      <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        {/* Logo 與 標題區 */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-4">
            <div className={onTitleDoubleClick ? 'cursor-pointer' : undefined} onDoubleClick={onTitleDoubleClick}>
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
                className={`hidden sm:flex items-center px-3 py-1 rounded-full text-xs font-bold transition-all ${isAdmin
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-blue-900/50 text-blue-200 hover:bg-blue-800 border border-blue-700'
                  }`}
              >
                <ShieldCheck className="w-3 h-3 mr-1.5" />
                {isAdmin ? 'ADMIN MODE' : 'STAFF'}
              </button>
            )}
          </div>

          {/* Mobile Toggles */}
          <div className="flex gap-2 sm:hidden items-center">
            {onAdminToggle && (isAdmin || (window.location.hostname === 'localhost')) && (
              <button
                onClick={onAdminToggle}
                className={`p-1.5 rounded-lg transition-all ${isAdmin
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-950/40 text-blue-200 border border-blue-800'
                  }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
            )}
            <div className="flex bg-blue-950/40 p-1 rounded-xl border border-blue-800 items-center">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200'}`}
                aria-label="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white shadow-md' : 'text-blue-200'}`}
                aria-label="List View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl bg-blue-950/40 border border-blue-800 text-blue-200 transition-all"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 搜尋與切換視圖區 */}
        <div className="flex items-center gap-2 grow max-w-lg w-full">
          <div className="relative flex-1">
            {/* 修正搜尋圖示：增加 z-index 並調整顏色對比 */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <input
              type="text"
              placeholder={isSemanticSearch ? "Describe what you lost..." : "Search items..."}
              className={`w-full pl-10 pr-20 py-2.5 bg-white border-2 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-inner dark:bg-slate-800 dark:text-white dark:placeholder-slate-500 ${isSemanticSearch ? 'border-emerald-500' : 'border-transparent dark:border-slate-700'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
              {isEmbeddingLoading && <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />}
              <button
                onClick={() => setIsSemanticSearch(!isSemanticSearch)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${isSemanticSearch
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500'
                  }`}
                title={isSemanticSearch ? "Switch to Keyword Search" : "Try Smart Search (AI)"}
              >
                <Sparkles className={`w-3 h-3 ${isSemanticSearch ? 'animate-pulse' : ''}`} />
                <span className="hidden xs:inline">{isSemanticSearch ? 'Smart' : 'AI'}</span>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-blue-950/40 p-1 rounded-xl border border-blue-800 h-full items-center">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800'
                  }`}
                aria-label="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-md' : 'text-blue-200 hover:bg-blue-800'
                  }`}
                aria-label="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800 text-blue-200 hover:bg-blue-800 transition-all flex items-center justify-center"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;